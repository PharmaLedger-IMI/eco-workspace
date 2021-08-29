const {WebcController} = WebCardinal.controllers;
import SiteService from '../services/SiteService.js';
import TrialService from '../services/TrialService.js';
import TrialParticipantsService from '../services/TrialParticipantsService.js';


const ecoServices = require('eco-services');

const BaseRepository = ecoServices.BaseRepository;

let getInitModel = () => {
    return {
        trial: {},
        trialParticipants: [],
    };
};

export default class PatientsListController extends WebcController {

    constructor(...props) {
        super(...props);
        this.setModel({
            ...getInitModel(),
            trialSSI: this.history.win.history.state.state,
        });
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._getTrialParticipants();
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(DSUStorage);
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.TRIAL_PARTICIPANTS, DSUStorage);
        this.SiteService = new SiteService(DSUStorage);
    }

    _initHandlers() {

        this._attachHandlerNavigateToParticipant();
        this._attachHandlerViewTrialParticipantDetails();
        this._attachHandlerViewTrialParticipantStatus();
        this._attachHandlerGoBack();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }



    async _getTrialParticipants() {

        this.model.trialParticipants= (await this.TrialParticipantRepository.findAllAsync());
    }

    _attachHandlerNavigateToParticipant() {
        this.onTagEvent('navigate:tp', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-participant', {
                trialSSI: model.trialSSI,
                tpUid: model.uid,
                trialParticipantNumber: model.number,
            });
        });
    }



    _attachHandlerViewTrialParticipantStatus() {
        this.onTagEvent('tp:status', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-participant-details', {
                trialSSI: model.trialSSI,
                tpUid: model.uid
            });
        });
    }

    _attachHandlerViewTrialParticipantDetails() {
        this.onTagEvent('tp:details', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-participant', {
                trialSSI: model.trialSSI,
                tpUid: model.uid
            });
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

}