const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        answer: {
            label: 'Answer',
            name: 'answer',
            required: true,
            placeholder: 'Write your response here ',
            value: '',
        },
    };
};

export default class AnswerQuestionController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel(getInitModel());
        this.model.title = props[0].title;

        this._initHandlers();
    }

    _initHandlers() {
        this._attachHandlerSubmit();
    }

    _attachHandlerSubmit() {
        this.onTagEvent('tp:submit', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.send('confirmed', this.model.answer.value);
        });
    }
}
