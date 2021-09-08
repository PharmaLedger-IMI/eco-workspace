import TrialService from '../services/TrialService.js';
import EconsentService from "../services/EconsentService.js";


const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const BaseRepository = ecoServices.BaseRepository;

const {WebcController} = WebCardinal.controllers;


export default class AsqQuestionController extends WebcController {

    question = {
        name: "question",
        placeholder: "Insert your question here "
    };

    constructor(...props) {
        super(...props);
        this.setModel({});
        this.model.econsent = {};
        this.model.question = this.question;
        this._initServices(this.DSUStorage);
        this.model.historyData = this.history.win.history.state.state;
        this._initConsent();
        this._initHandlers();
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.PATIENT_IDENTITY);
        this.EcosentService = new EconsentService(DSUStorage);
        this.EconsentsStatusRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.ECOSESENT_STATUSES, DSUStorage);
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.TRIAL_PARTICIPANT, DSUStorage);
        this.QuestionsRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.QUESTIONS, DSUStorage);
    }

    _initConsent() {
        this.TrialService.getEconsent(this.model.historyData.trialuid, this.model.historyData.ecoId, (err, econsent) => {
            if (err) {
                return console.log(err);
            }
            let ecoVersion = this.model.historyData.ecoVersion;
            this.model.econsent = econsent;
            let currentVersion = econsent.versions.find(eco => eco.version === ecoVersion);


        });
    }

    _initHandlers() {
        this._attachHandlerSubmit();
        this._attachHandlerBack();
    }


    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();

        });
    }


    _attachHandlerSubmit() {
        this.onTagEvent('question-submit', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate());
            let question = {
                trialUID: this.model.historyData.trialuid,
                ecoUID: this.model.historyData.ecoId,
                ecoVersion: this.model.historyData.ecoVersion,
                tpDID: this.model.historyData.tpDID,
                question: this.model.question.value,
                date: currentDate

            }

            this.showModalFromTemplate(
                'confirmation-alert',
                (event) => {
                    const response = event.detail;
                    if (response) {

                        this._saveQuestion(question);
                    }
                },
                (event) => {
                    const response = event.detail;
                },
                {
                    controller: 'ConfirmationAlertController',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    question: 'Are you sure you want to send the question to HCO ?',
                    title: 'Send Question',
                });
        });
    }

    async _saveQuestion(questionToBeAdded) {
        let quest = await this.QuestionsRepository.createAsync(questionToBeAdded);
        this.sendMessageToHCO('ask-question', '', 'Patient asked a new question ', quest);
    }

    sendMessageToHCO(action, ssi, shortMessage, question) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate());

        this.TrialParticipantRepository.findAll((err, data) => {

            if (err) {
                return console.log(err);
            }

            if (data && data.length > 0) {
                this.model.tp = data[data.length - 1];
                question.patient = this.model.tp.did;
                question.ecoVersion = this.model.historyData.ecoVersion;
                let sendObject = {
                    operation: 'ask-question',
                    ssi: ssi,
                    useCaseSpecifics: {
                        trialSSI: this.model.historyData.trialuid,
                        tpNumber: this.model.tp.number,
                        tpDid: this.model.tp.did,
                        version: this.model.historyData.ecoVersion,

                        question: {
                            ...question
                        },
                    },
                    shortDescription: shortMessage,
                };

                this.CommunicationService.sendMessage(CommunicationService.identities.ECO.HCO_IDENTITY, sendObject);
                this.navigateToPageTag('home');
            }
        });
    }

}
