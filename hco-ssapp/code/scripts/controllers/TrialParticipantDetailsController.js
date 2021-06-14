const {WebcController} = WebCardinal.controllers;
import Constants from '../utils/Constants.js';
import TrialService from '../services/TrialService.js';
import TrialParticipantsService from '../services/TrialParticipantsService.js';
import CommunicationService from '../services/CommunicationService.js';
import TrialParticipantRepository from '../repositories/TrialParticipantRepository.js';

let getInitModel = () => {
    return {
        trial: {},
        trialParticipants: [],
    };
};

export default class TrialParticipantDetailsController extends WebcController {

    constructor(...props) {
        super(...props);
        this.setModel({
            ...getInitModel(),
            ...this.history.win.history.state.state,
            consentsSigned: [{name: 'V1 - Assent Form 1'}, {name: 'V1 - Parental Consent'}]
        });
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initTrial(this.model.trialSSI);
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
    }

    _initHandlers() {
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    async _initTrial(keySSI) {
        debugger
        this.model.trialParticipant = await this.TrialParticipantRepository.findByAsync(this.model.tpUid)
        debugger
    }

    _showFeedbackToast(title, message, alertType = 'toast') {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }
}
