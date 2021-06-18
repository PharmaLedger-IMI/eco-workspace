import TrialService from '../services/TrialService.js';
import TrialParticipantsService from '../services/TrialParticipantsService.js';
import CommunicationService from '../services/CommunicationService.js';
import DateTimeService from '../services/DateTimeService.js';
import TrialParticipantRepository from "../repositories/TrialParticipantRepository.js";
import Constants from "../utils/Constants.js";

const {WebcController} = WebCardinal.controllers;

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
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initConsents(this.model.trialSSI);

    }

    _initServices(DSUStorage) {
        debugger;

        this.TrialService = new TrialService(DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
    }

    _initHandlers() {
        this._attachHandlerNavigateToEconsentVersions();
        this._attachHandlerAddTrialParticipantNumber();
        this._attachHandlerGoBack();
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
                    versionDateAsString: DateTimeService.convertStringToLocaleDate(consent.versionDate),
                };
            });
            this._initTrialParticipant();
        });
    }

    _initTrialParticipant() {
        this.TrialParticipantRepository.findBy(this.model.tpUid, (err, data) => {
            debugger;
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

    _showFeedbackToast(title, message, alertType) {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }

    _attachHandlerAddTrialParticipantNumber() {
        this.onTagEvent('tp:setTpNumber', 'click', (model, target, event) => {
            debugger;
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'add-tp-number',
                (event) => {
                    this.model.tp.tpNumber = event.detail;
                    this._updateTrialParticipant(this.model.tp);

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

    _updateTrialParticipant(trialParticipant) {

        this.TrialParticipantRepository.update(trialParticipant.uid, trialParticipant, (err, trialParticipant) => {
            debugger;
            if (err) {
                return console.log(err);
            }
            this._showFeedbackToast('Result', Constants.MESSAGES.HCO.FEEDBACK.SUCCESS.ATTACH_TRIAL_PARTICIPANT_NUMBER);
        });

    }

    _computeEconsentsWithActions() {
        debugger;
        this.model.econsents.forEach(econsent => {
            econsent.versions.forEach(version => {
                if (version.actions != undefined) {
                    let tpVersions = version.actions.filter(action => action.tpNumber === this.model.tp.did);
                    if (tpVersions && tpVersions.length > 0) {
                        let tpVersion = tpVersions[tpVersions.length - 1];
                        if (tpVersion && tpVersion.actionNeeded) {
                            if (tpVersion.actionNeeded === Constants.ECO_STATUSES.TO_BE_SIGNED) {
                                econsent.signed = true;
                            }
                            if (tpVersion.actionNeeded ===Constants.ECO_STATUSES.WITHDRAW) {
                                econsent.withdraw = true;
                            }
                            if (tpVersion.actionNeeded === Constants.ECO_STATUSES.CONTACT) {
                                econsent.contact = true;
                            }
                        }
                    }
                }

            })
        })
    }
}
