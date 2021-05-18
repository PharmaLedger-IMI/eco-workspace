const {WebcController} = WebCardinal.controllers;
export default class WithdrawEconsent extends WebcController {

    constructor(element, history) {
        super(element, history);
        this.setModel({})
        this._initHandlers();
    }

    _initHandlers() {
        this._attachHandlerCancel();
        this._attachHandlerWithdraw();
    }

    _attachHandlerWithdraw() {
        this.onTagEvent('withdraw-on-click', 'click', (model, target, event) => {
            this.send('confirmed', {
                withdraw: true,
            });
        });
    }

    _attachHandlerCancel() {
        this.onTagEvent('cancel', 'click', (model, target, event) => {
            this.send('closed', {
                withdraw: false,
            });
        });
    }

    _finishProcess(event, response) {
        event.stopImmediatePropagation();
        this.responseCallback(undefined, response);
    };

}
