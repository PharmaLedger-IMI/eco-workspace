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
        this._initTrialParticipant();
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
    }

    _initHandlers() {
        this._attachHandlerNavigateToEconsentVersions();
        this._attachHandlerAddTrialParticipantNumber();
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
        });
    }

    _initTrialParticipant() {
        this.TrialParticipantRepository.findBy(this.model.tpUid, (err, data) => {
            debugger;
            if (err) {
                return console.log(err);
            }
            this.model.tp = data;
        })
    }

    _attachHandlerNavigateToEconsentVersions() {
        this.onTagEvent('navigate:ec', 'click', (model, target, event) => {
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
}
