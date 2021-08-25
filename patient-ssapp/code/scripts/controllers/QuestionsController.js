
import QuestionsRepository from "../repositories/QuestionsRepository.js";

const ecoServices = require('eco-services');
const Constants = ecoServices.Constants;
const { WebcController } = WebCardinal.controllers;

export default class QuestionsController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({});
        this._initServices(this.DSUStorage);
        this._attachQuestionNavigationHandler();
        this._initQuestions();
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

    _attachQuestionNavigationHandler() {
        this.onTagEvent('go-to-question', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('question', model.uid);
        });
    }
}
