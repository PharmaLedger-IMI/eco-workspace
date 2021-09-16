const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const Constants = ecoServices.Constants;
const BaseRepository = ecoServices.BaseRepository;

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
        this.QuestionsRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.QUESTIONS, DSUStorage);
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
                return console.log(err);
            }
            this.TrialParticipantRepository.findAll((err, tps) => {
                if (err) {
                    return console.log(err);
                }
                tps.forEach(tp => {
                    this._sendMessageToPatient(tp.did, data);
                })
            })
        })
    }

    _sendMessageToPatient(did, question) {
        this.CommunicationService.sendMessage(did, {
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
