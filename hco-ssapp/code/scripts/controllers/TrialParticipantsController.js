import HCOService from '../services/HCOService.js';

const {WebcController} = WebCardinal.controllers;
import SiteService from '../services/SiteService.js';
import TrialService from '../services/TrialService.js';
import TrialParticipantsService from '../services/TrialParticipantsService.js';

const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const Constants = ecoServices.Constants;
const BaseRepository = ecoServices.BaseRepository;

let getInitModel = () => {
    return {
        trial: {},
        trialParticipants: [],
    };
};

export default class TrialParticipantsController extends WebcController {

    constructor(...props) {
        super(...props);
        this.setModel({
            ...getInitModel(),
            trialSSI: this.history.win.history.state.state,
        });
        this._initServices();
        this._initHandlers();
    }

    async _initServices() {
        this.HCOService = new HCOService();
        this.TrialService = new TrialService();
        this.TrialParticipantService = new TrialParticipantsService();
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.TRIAL_PARTICIPANTS);
        this.SiteService = new SiteService();
        this.model.hcoDSU = await this.HCOService.getOrCreateAsync();
        this._initTrial(this.model.trialSSI);
    }

    _initHandlers() {
        this._attachHandlerAddTrialParticipant();
        this._attachHandlerNavigateToParticipant();
        this._attachHandlerViewTrialParticipantDetails();
        this._attachHandlerViewTrialParticipantStatus();
        this._attachHandlerGoBack();
        this._attachHandlerEditRecruitmentPeriod();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    async _initTrial(keySSI) {
        this.model.trial = this.model.hcoDSU.volatile.trial.find(trial => trial.keySSI === keySSI);
        this.model.trial.isInRecruitmentPeriod = true;
        let actions = await this._getEconsentActionsMappedByUser(keySSI);
        this.model.trialParticipants = await this._getTrialParticipantsMappedWithActionRequired(actions);
        if (this.model.trial.recruitmentPeriod) {
            let endDate = new Date(this.model.trial.recruitmentPeriod.endDate);
            let currentDate = new Date();
            this.model.trial.isInRecruitmentPeriod = currentDate <= endDate;
        }
    }

    async _getTrialParticipantsMappedWithActionRequired(actions) {
        let tpsMappedByDID = {};

        let tps = await this.TrialParticipantRepository.findAllAsync();
        if (tps.length === 0) {
            return [];
        }
        tps.forEach(tp => tpsMappedByDID[tp.did] = tp)
        let trialsR = this.model.hcoDSU.volatile.tps;

        return trialsR
            .filter(tp => tp.trialNumber === this.model.trial.id)
            .map(tp => {
                let nonObfuscatedTp = tpsMappedByDID[tp.did];
                tp.name = nonObfuscatedTp.name;
                tp.birthdate = nonObfuscatedTp.birthdate;
                tp.enrolledDate = nonObfuscatedTp.enrolledDate;

                let tpActions = actions[tp.did];
                let actionNeeded = 'No action required';
                if (tpActions === undefined || tpActions.length === 0) {
                    return {
                        ...tp,
                        actionNeeded: actionNeeded
                    }
                }
                let lastAction = tpActions[tpActions.length - 1];

                switch (lastAction.action.name) {
                    case 'withdraw': {
                        actionNeeded = 'TP Withdrawed';
                        break;
                    }
                    case 'withdraw-intention': {
                        actionNeeded = 'Reconsent required';
                        break;
                    }
                    case 'sign': {
                        switch (lastAction.action.type) {
                            case 'hco': {
                                actionNeeded = 'Consented by HCO';
                                break;
                            }
                            case 'tp': {
                                actionNeeded = 'Acknowledgement required';
                                break;
                            }
                        }
                    }
                }
                return {
                    ...tp,
                    actionNeeded: actionNeeded
                }
            })
    }

    async _getEconsentActionsMappedByUser(keySSI) {
        let actions = {};
        (await this.TrialService.getEconsentsAsync(keySSI))
            .forEach(econsent => {
                if (econsent.versions === undefined) {
                    return actions;
                }
                econsent.versions.forEach(version => {
                    if (version.actions === undefined) {
                        return actions;
                    }
                    version.actions.forEach(action => {
                        if (actions[action.tpDid] === undefined) {
                            actions[action.tpDid] = []
                        }
                        actions[action.tpDid].push({
                            econsent: {
                                uid: econsent.uid,
                                keySSI: econsent.keySSI,
                                name: econsent.name,
                                type: econsent.type,
                            },
                            version: {
                                attachmentKeySSI: version.attachmentKeySSI,
                                version: version.version,
                                versionDate: version.versionDate,
                            },
                            action: action
                        })
                    })
                })
            });
        return actions;
    }

    _attachHandlerNavigateToParticipant() {
        this.onTagEvent('navigate:tp', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-participant', {
                trialSSI: this.model.trialSSI,
                tpUid: model.uid,
                trialParticipantNumber: model.number,
            });
        });
    }

    _attachHandlerAddTrialParticipant() {
        this.onTagEvent('add:ts', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'add-new-tp',
               async (event) => {
                    const response = event.detail;
                    this.model.trial.stage = 'Recruiting';
                    await this.TrialService.updateTrialAsync(this.model.trial);
                    await this.createTpDsu(response);
                    this._showFeedbackToast('Result', Constants.MESSAGES.HCO.FEEDBACK.SUCCESS.ADD_TRIAL_PARTICIPANT);

                },
                (event) => {
                    const response = event.detail;
                }
                ,
                {
                    controller: 'AddTrialParticipantController',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    title: 'Add Trial Participant',
                });
        });
    }

    _attachHandlerEditRecruitmentPeriod() {

        this.onTagEvent('edit-period', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'edit-recruitment-period',
                (event) => {
                    const response = event.detail;
                    this.model.trial.recruitmentPeriod = response;
                    this.model.trial.recruitmentPeriod.toShowDate = new Date(this.model.trial.recruitmentPeriod.startDate).toLocaleDateString() + ' - ' + new Date(this.model.trial.recruitmentPeriod.endDate).toLocaleDateString();
                    this.TrialService.updateTrialAsync(this.model.trial)

                },
                (event) => {
                    const response = event.detail;
                },
                {
                    controller: 'EditRecruitmentPeriodController',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    title: 'Edit Recruitment Period',
                    recruitmentPeriod: this.model.trial.recruitmentPeriod
                }
            );

        });

    }

    _attachHandlerViewTrialParticipantStatus() {
        this.onTagEvent('tp:status', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-participant-details', {
                trialSSI: this.model.trialSSI,
                tpUid: model.uid
            });
        });
    }

    _attachHandlerViewTrialParticipantDetails() {
        this.onTagEvent('tp:details', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-participant', {
                trialSSI: this.model.trialSSI,
                tpUid: model.uid
            });
        });
    }

    async createTpDsu(tp) {
        const currentDate = new Date();
        tp.trialNumber = this.model.trial.id;
        tp.status = Constants.TRIAL_PARTICIPANT_STATUS.PLANNED;
        tp.enrolledDate = currentDate.toLocaleDateString();
        tp.trialSSI = this.model.trial.keySSI;
        let trialParticipant = await this.TrialParticipantRepository.createAsync(tp);
        await this.HCOService.addTrialParticipantAsync(tp);
        trialParticipant.actionNeeded = 'No action required';
        //this.model.trialParticipants.push(trialParticipant);
        //refresh
        await this._initTrial(this.model.trialSSI);

        this.sendMessageToPatient(
            Constants.MESSAGES.HCO.SEND_HCO_DSU_TO_PATIENT,
            {
                tpNumber: '',
                tpName: tp.name,
                did: tp.did
            },
            this.model.trialSSI,
            Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.ADD_TO_TRIAL
        );

        this.HCOService.cloneIFCs(this.model.trialSSI, async () => {
            this.model.hcoDSU = await this.HCOService.getOrCreateAsync();

            let icfs = this.model.hcoDSU.volatile.icfs;
            let site = this.model.hcoDSU.volatile.site.find(site => site.trialKeySSI === this.model.trialSSI)
            let siteConsentsKeySSis = site.consents.map(consent => consent.keySSI);
            let trialConsents = icfs.filter(icf => {
                return siteConsentsKeySSis.indexOf(icf.genesisSSI) > -1
            })

            trialConsents.forEach(econsent => {
                console.log(econsent);
                this.sendConsentToPatient(Constants.MESSAGES.HCO.SEND_REFRESH_CONSENTS_TO_PATIENT, tp,
                    econsent.genesisSSI, null)
            })

            this._sendMessageToSponsor();
        });
    }


    //TODO: will be refactored on DID integration
    sendConsentToPatient(operation, tp, trialSSI, shortMessage) {
        this.CommunicationService.sendMessage(tp.did, {
            operation: operation,
            ssi: trialSSI,
            useCaseSpecifics: {
                tpName: tp.name,
                did: tp.did,
                sponsorIdentity: tp.sponsorIdentity,
                trialSSI: trialSSI
            },
            shortDescription: shortMessage,
        });
    }


    sendMessageToPatient(operation, tp, trialSSI, shortMessage) {
        let site = this.model.hcoDSU.volatile?.site[0];
        this.CommunicationService.sendMessage(tp.did, {
            operation: operation,
            ssi: site.uid,
            useCaseSpecifics: {
                tpNumber: tp.tpNumber,
                tpName: tp.tpName,
                tpDid: tp.did,
                trialSSI: trialSSI,
                sponsorIdentity: site.sponsorIdentity,
                site: {
                    name: site?.name,
                    number: site?.id,
                    country: site?.country,
                    status: site?.status,
                    keySSI: site?.keySSI,
                },
            },
            shortDescription: shortMessage,
        });
    }

    _showFeedbackToast(title, message, alertType = 'toast') {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }

    _attachHandlerGoBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }

    _sendMessageToSponsor() {
        this.CommunicationService.sendMessage(this.model.hcoDSU.volatile?.site[0].sponsorIdentity, {
            operation: 'update-site-status',
            ssi: this.model.trialSSI,
            stageInfo: {
                siteSSI: this.model.hcoDSU.volatile?.site[0].KeySSI,
                status: this.model.trial.stage
            },
            shortDescription: 'The stage of the site changed',
        });
    }
}