import Constants from "../utils/Constants.js";
import QuestionsRepository from "../repositories/QuestionsRepository.js";
import CommunicationService from "../services/CommunicationService.js";


const {WebcController} = WebCardinal.controllers;

export default class QuestionsController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({});
        this._initServices(this.DSUStorage);
        this._attachQuestionAnswer();
        this._initQuestions();
        this._attachHandlerBack();
    }

    _initServices(DSUStorage) {
        this.QuestionsRepository = QuestionsRepository.getInstance(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
    }

    _initQuestions() {
        this.model.questions = [];
        this.QuestionsRepository.findAll((err, data) => {
            if (err) {
                return console.log(err);
            }

            this.model.questions.push(...data);
        });
    }

    _attachQuestionAnswer() {
        this.onTagEvent('question:answer', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            this.showModalFromTemplate(
                'answer-question',
                (event) => {
                    const response = event.detail;
                    if (response) {
                        model.answer = response;
                        this._updateQuestion(model);
                    }
                },
                (event) => {
                    const response = event.detail;
                },
                {
                    controller: 'AnswerQuestionController',
                    disableExpanding: false,
                    disableBackdropClosing: false,

                    title: model.question,
                });
        });
    }


    _updateQuestion(response) {
        this.QuestionsRepository.update(response.pk, response, (err, data) => {
            if (err) {
                console.log(err);
            }
            this._sendMessageToPatient(data);
        })
    }

    _sendMessageToPatient(question) {

        this.CommunicationService.sendMessage(CommunicationService.identities.ECO.PATIENT_IDENTITY, {
            operation: 'question-response',

            useCaseSpecifics: {

                question: {
                    ...question
                },
            },
            shortDescription: 'Hco answered to question ',
        });

    }

    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }
}
