import SiteService from "../services/SiteService";

const {WebcController} = WebCardinal.controllers;

import TrialService from '../services/TrialService.js';

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

export default class TrialController extends WebcController {

    constructor(...props) {
        super(...props);
        this.setModel({
            ...getInitModel(),
            trialSSI: this.history.win.history.state.state,
        });
        this._initServices();
        this._initHandlers();
        this._initTrial(this.model.trialSSI);
        this._getSite();
    }

    _initServices() {
        this.TrialService = new TrialService();
        this.SiteService = new SiteService();
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.TABLE_NAMES.HCO.TRIAL_PARTICIPANTS);
    }

    _initHandlers() {
        this._attachHandlerAddTrialParticipant();
        this._attachHandlerNavigateToParticipant();
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
            this.model.trialParticipants = (await this.TrialParticipantRepository.findAllAsync()).filter(tp => tp.trialNumber === this.model.trial.id);
        });
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
        this.onTagEvent('add:tp', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'add-new-tp',
                (event) => {
                    const response = event.detail;
                    this.createTpDsu(response);
                    this._showFeedbackToast('Result', Constants.MESSAGES.HCO.FEEDBACK.SUCCESS.ADD_TRIAL_PARTICIPANT);
                },
                (event) => {
                    const response = event.detail;
                }
            ),
                {
                    controller: 'AddTrialParticipantController',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    title: 'Add Trial Participant',
                };
        });
    }


    async createTpDsu(tp) {
        tp.trialNumber = this.model.trial.id;
        tp.status = 'screened';
        tp.sponsorIdentity = this.model.site.sponsorIdentity;
        let trialParticipant = await this.TrialParticipantRepository.createAsync(tp);
        this.model.trialParticipants.push(trialParticipant);
        this.sendMessageToPatient(
            Constants.MESSAGES.PATIENT.ADD_TO_TRIAL,
            this.model.trialSSI,
            trialParticipant,
            Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.ADD_TO_TRIAL
        );
    }

    _getSite() {
        this.SiteService.getSites((err, sites) => {
            if (err) {
                return console.log(err);
            }
            if (sites && sites.length > 0) {
                this.model.site = sites[sites.length - 1];
            }
        });
    }

    sendMessageToPatient(operation, ssi, trialParticipant, shortMessage) {
        this.CommunicationService.sendMessage(trialParticipant.did, {
            operation: operation,
            ssi: ssi,
            useCaseSpecifics: {
                tpName: trialParticipant.name,
                did: trialParticipant.did,
                sponsorIdentity: trialParticipant.sponsorIdentity,
                trialSSI: ssi
            },
            shortDescription: shortMessage,
        });
    }

    _showFeedbackToast(title, message, alertType = 'toast') {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }


}
