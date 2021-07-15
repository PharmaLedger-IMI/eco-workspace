const {WebcController} = WebCardinal.controllers;



export default class DeclineConsentController extends WebcController {
    constructor(...props) {
        super(...props);
        this._initHandlers();
    }

    _initHandlers() {
        this._attachHandlerSubmit();
    }

    _attachHandlerSubmit() {
        this.onTagEvent('decline:submit', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.send('confirmed', true);
        });
    }
}
