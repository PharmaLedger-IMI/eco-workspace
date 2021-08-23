import Constants from "../utils/Constants.js";
import QuestionsRepository from "../repositories/QuestionsRepository.js";


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
            this.navigateToPageTag('question', model.uid);
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
