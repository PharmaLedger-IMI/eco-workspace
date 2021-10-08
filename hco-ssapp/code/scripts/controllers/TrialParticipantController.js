import TrialService from '../services/TrialService.js';
import SiteService from '../services/SiteService.js';


const {WebcController} = WebCardinal.controllers;

const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const DateTimeService = ecoServices.DateTimeService;
const Constants = ecoServices.Constants;
const BaseRepository = ecoServices.BaseRepository;
let getInitModel = () => {
    return {
        econsents: [],
    };
};

export default class TrialParticipantController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({
            ...getInitModel(),
            ...this.history.win.history.state.state,
        });
        this._initServices();
        this._initHandlers();
        this._initConsents(this.model.trialSSI);

    }

    _initServices() {
        this.TrialService = new TrialService();
        this.SiteService = new SiteService();
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.TRIAL_PARTICIPANTS);
    }

    _initHandlers() {
        this._attachHandlerNavigateToEconsentVersions();
        this._attachHandlerNavigateToEconsentSign();
        this._attachHandlerAddTrialParticipantNumber();
        this._attachHandlerGoBack();
        this._attachHandlerView();
        this._attachHandlerVisits();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    _initConsents(keySSI) {
        this.TrialService.getEconsents(keySSI, (err, data) => {
            if (err) {
                return console.log(err);
            }
            this.model.econsents = data.map((consent) => {
                return {
                    ...consent,
                    versionDateAsString: DateTimeService.convertStringToLocaleDate(consent.versionDate)
                };
            });
            this._initTrialParticipant();
        });
    }

    _initTrialParticipant() {
        this.TrialParticipantRepository.findBy(this.model.tpUid, (err, data) => {
            if (err) {
                return console.log(err);
            }
            this.model.tp = data;
            this._computeEconsentsWithActions();

        })
    }

    _attachHandlerNavigateToEconsentVersions() {
        this.onTagEvent('consent:history', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('econsent-versions', {
                trialSSI: this.model.trialSSI,
                econsentSSI: model.keySSI,
                trialParticipantNumber: this.model.trialParticipantNumber,
                tpUid: this.model.tpUid,
                tpDid: this.model.tp.did,
            });
        });
    }

    _attachHandlerView() {
        this.onTagEvent('consent:view', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('econsent-sign', {
                trialSSI: this.model.trialSSI,
                econsentSSI: model.KeySSI,
                ecoVersion: model.lastVersion,
                tpDid: this.model.tp.did,
                controlsShouldBeVisible: false
            });
        });
    }

    _attachHandlerNavigateToEconsentSign() {
        this.onTagEvent('consent:sign', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            let ecoVersion = undefined;
            if (model && model.versions && model.versions.length > 0) {
                ecoVersion = model.versions[model.versions.length - 1].version;
            }
            this.navigateToPageTag('econsent-sign', {
                trialSSI: this.model.trialSSI,
                econsentSSI: model.keySSI,
                isManuallySigned: model.isManuallySigned,
                manualKeySSI: model.manualKeySSI,
                manualAttachment: model.manualAttachment,
                trialParticipantNumber: this.model.tp.did,
                tpUid: this.model.tpUid,
                tpDid: this.model.tp.did,
                ecoVersion: ecoVersion
            });
        });
    }

    _attachHandlerGoBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }

    _attachHandlerVisits() {
        this.onTagEvent('tp:visits', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('visits-procedures', {
                trialSSI: this.model.trialSSI,
                tpUid: this.model.tpUid,
            });
        });
    }

    _showFeedbackToast(title, message, alertType) {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }


    _attachHandlerAddTrialParticipantNumber() {
        this.onTagEvent('tp:setTpNumber', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'add-tp-number',
                (event) => {
                    this.model.tp.number = event.detail;
                    this.sendMessageToProfessional(this.model.tp)
                    this._updateTrialParticipant(this.model.tp);
                    this.updateTrialStage();
                },
                (event) => {
                    const response = event.detail;
                }
            ),
                {
                    controller: 'AddTrialParticipantNumber',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    title: 'Attach Trial Participant Number',
                };
        });
    }

    async sendMessageToProfessional(tp) {
        let trial = await this.TrialService.getTrialAsync(this.model.trialSSI);

        let econsents = await this.TrialService.getEconsentsAsync(this.model.trialSSI);

        let wantedAction = {
            toShowDate: 'DD/MM/YYYY'
        };

        for (const econsent of econsents) {
            for (const version of econsent.versions) {
                let validActions = version.actions
                    .filter(action => action.name === 'sign' && action.type === 'tp')
                    .filter(action => tp.did === action.tpNumber);

                if (validActions.length > 0) {
                    wantedAction = validActions[0];
                    break;
                }
            }
        }

        let messageForIot = {
            trial: {
                id: trial.id,
                name: trial.name,
                status: trial.status
            },
            participant: {
                id: tp.tpNumber,
                name: tp.name,
                gender: tp.gender,
                enrolledDate: tp.enrolledDate,
                birthdate: tp.birthdate,
                signDate: wantedAction.toShowDate
            }
        }
        this.CommunicationService.sendMessage(CommunicationService.identities.IOT.PROFESSIONAL_IDENTITY, {
            operation: Constants.MESSAGES.PATIENT.ADD_TRIAL_SUBJECT,
            useCaseSpecifics: messageForIot
        });

    }

    updateTrialStage() {
        this.TrialService.getTrial(this.model.trialSSI, async (err, trial) => {
            if (err) {
                return console.log(err);
            }
            trial.stage = 'Enrolling';
            this.TrialService.updateTrialAsync(trial)
            this._getSite();
        });
    }

    _updateTrialParticipant(trialParticipant) {

        this.TrialParticipantRepository.update(trialParticipant.uid, trialParticipant, (err, trialParticipant) => {
            if (err) {
                return console.log(err);
            }
            this._showFeedbackToast('Result', Constants.MESSAGES.HCO.FEEDBACK.SUCCESS.ATTACH_TRIAL_PARTICIPANT_NUMBER);
            this._sendMessageToPatient(this.model.trialSSI, trialParticipant, 'Tp Number was attached');
        });

    }

    _sendMessageToPatient(ssi, tp, shortMessage) {
        this.CommunicationService.sendMessage(tp.did, {
            operation: Constants.MESSAGES.PATIENT.UPDATE_TP_NUMBER,
            ssi: ssi,
            useCaseSpecifics: {
                tpNumber: tp.number,
                tpName: tp.name,
                tpDid: tp.did
            },
            shortDescription: shortMessage,
        });
    }

    _showButton(econsent, buttonName) {
        let existingButtons = ['Sign', 'View', 'Contact'];
        existingButtons.forEach(bn => {
            econsent['show' + bn + 'Button'] = false;
        })
        econsent['show' + buttonName + 'Button'] = true;
        return econsent;
    }

    _computeEconsentsWithActions() {
        this.model.econsents.forEach(econsent => {
            econsent = this._showButton(econsent, 'View');
            econsent.versions.forEach(version => {
                if (version.actions != undefined) {
                    let validVersions = version.actions.filter(action => action.tpDid === this.model.tp.did);
                    let tpVersions = validVersions.filter(action => action.type === 'tp');
                    let hcoVersions = validVersions.filter(action => action.type === 'hco');

                    let tpVersion = {};
                    if (tpVersions && tpVersions.length > 0) {
                        tpVersion = tpVersions[tpVersions.length - 1];
                        if (tpVersion && tpVersion.actionNeeded) {
                            if (tpVersion.actionNeeded === Constants.ECO_STATUSES.TO_BE_SIGNED) {

                                econsent = this._showButton(econsent, 'Sign');
                                this.model.tp.tpSigned = true;
                                econsent.tsSignedDate = tpVersion.toShowDate;
                                econsent.isManuallySigned = tpVersion.isManual;
                                econsent.manualAttachment = tpVersion.attachment;
                                econsent.manualKeySSI = tpVersion.fileSSI;

                            }
                            if (tpVersion.actionNeeded === Constants.ECO_STATUSES.WITHDRAW) {
                                econsent = this._showButton(econsent, 'Contact');
                                econsent.tsWithdrawDate = tpVersion.toShowDate;
                            }
                            if (tpVersion.actionNeeded === Constants.ECO_STATUSES.CONTACT) {
                                if (tpVersion.status === 'Withdrawed') {
                                    econsent.tsWithdrawDate = tpVersion.toShowDate;
                                } else {
                                    econsent = this._showButton(econsent, 'Contact');
                                    econsent.tsWithdrawedIntentionDate = 'Intention';
                                }
                            }
                            if (tpVersion.actionNeeded === Constants.ECO_STATUSES.DECLINED) {
                                econsent.tsDeclined = 'Declined';
                            }
                        }
                    }
                    if (hcoVersions && hcoVersions.length > 0) {
                        let hcoVersion = hcoVersions[hcoVersions.length - 1];
                        let hcoVersionIndex = validVersions.findIndex(v => v === hcoVersion);
                        let tpVersionIndex = validVersions.findIndex(v => v === tpVersion);
                        if (hcoVersion.name === 'sign' && hcoVersionIndex > tpVersionIndex) {
                            econsent = this._showButton(econsent, 'View');
                        }
                        econsent.hcoDate = hcoVersion.toShowDate;
                        this.model.tp.hcoSigned = true;

                    }
                }

                econsent.lastVersion = econsent.versions[econsent.versions.length - 1].version;
            })
        })
    }

    _getSite() {
        this.SiteService.getSites((err, sites) => {
            if (err) {
                return console.log(err);
            }
            // this.model.site = sites?.filter(site=> site.trialKeySSI === this.model.trial.keySSI);
            if (sites && sites.length > 0) {
                this.model.site = sites[sites.length - 1];
                this._sendMessageToSponsor();
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
