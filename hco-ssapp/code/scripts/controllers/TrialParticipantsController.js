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
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initTrial(this.model.trialSSI);
        this._getSite();
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.TRIAL_PARTICIPANTS, DSUStorage);
        this.SiteService = new SiteService(DSUStorage);
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

    _initTrial(keySSI) {
        this.TrialService.getTrial(keySSI, async (err, trial) => {
            if (err) {
                return console.log(err);
            }
            this.model.trial = trial;

            this.model.trial.isInRecruitmentPeriod = true;
            let actions = await this._getEconsentActionsMappedByUser(keySSI);
            this.model.trialParticipants = await this._getTrialParticipantsMappedWithActionRequired(actions);
            if (this.model.trial.recruitmentPeriod) {
                let endDate = new Date(this.model.trial.recruitmentPeriod.endDate);
                let currentDate = new Date();
                this.model.trial.isInRecruitmentPeriod = currentDate <= endDate;
            }
        });
    }

    async _getTrialParticipantsMappedWithActionRequired(actions) {
        let trialsR = (await this.TrialParticipantRepository.findAllAsync());
        return trialsR
            .filter(tp => tp.trialNumber === this.model.trial.id)
            .map(tp => {
                let tpActions = actions[tp.did];
                if (tpActions === undefined || tpActions.length === 0) {
                    return {
                        ...tp,
                        actionNeeded: 'No action required'
                    }
                }
                let lastAction = tpActions[tpActions.length - 1];
                let actionNeeded = 'No action required';
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
                (event) => {
                    const response = event.detail;

                    this.model.trial.stage = 'Recruiting';
                    this.TrialService.updateTrialAsync(this.model.trial)

                    this.createTpDsu(response);
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
        trialParticipant.actionNeeded = 'No action required';
        this.model.trialParticipants.push(trialParticipant);
        this.sendMessageToPatient(
            'add-to-trial',
            this.model.trialSSI,
            {tpNumber: '', tpName: tp.name, did: tp.did},
            Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.ADD_TO_TRIAL
        );
        this._sendMessageToSponsor();
    }

    sendMessageToPatient(operation, ssi, tp, shortMessage) {
        this.CommunicationService.sendMessage(tp.did, {
            operation: operation,
            ssi: ssi,
            useCaseSpecifics: {
                tpNumber: tp.tpNumber,
                tpName: tp.tpName,
                tpDid: tp.did,
                sponsorIdentity: this.model.site.sponsorIdentity,
                site: {
                    name: this.model.site?.name,
                    number: this.model.site?.id,
                    country: this.model.site?.country,
                    status: this.model.site?.status,
                    keySSI: this.model.site?.keySSI,
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

    _getSite() {
        this.SiteService.getSites((err, sites) => {
            if (err) {
                return console.log(err);
            }
            if (sites && sites.length > 0) {
                this.model.site = sites[0];
                // To be fixed (@Raluca & @Cosmin)
                //let filtered = sites?.filter(site => site.trialKeySSI === this.model.trial.keySSI);
                //if (filtered) this.model.site = filtered[0];
            }
        });
    }

    _sendMessageToSponsor() {
        this.CommunicationService.sendMessage(this.model.site.sponsorIdentity, {
            operation: 'update-site-status',
            ssi: this.model.trialSSI,
            stageInfo: {
                siteSSI: this.model.site.KeySSI,
                status: this.model.trial.stage
            },
            shortDescription: 'The stage of the site changed',
        });
    }
}