const {WebcController} = WebCardinal.controllers;


export default class ConfirmationAlertController extends WebcController {
    constructor(...props) {
        super(...props);
        this._initHandlers();
        this.setModel({title:'Confirmation',question:'Are you sure?'});

        this.model.question = props[0].question;
        this.model.title = props[0].title;
    }

    _initHandlers() {
        this._attachHandlerSubmit();
        this._attachHandlerCancel();
    }

    _attachHandlerSubmit() {
        this.onTagEvent('submit', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.send('confirmed', true);
        });
    }
    _attachHandlerCancel() {
        this.onTagEvent('cancel', 'click', (model, target, event) => {
            this.send('closed');
        });
    }
}
