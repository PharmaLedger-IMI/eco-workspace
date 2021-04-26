
const {WebcController} = WebCardinal.controllers;
export default class WithdrawEconsent extends WebcController {
    constructor(element, history) {
        super(element, history);
        this.setModel({})
        this.on('openFeedback', (evt) => {
            this.feedbackEmitter = evt.detail;
        });
        this.withdrawOnClick();
        this.attachHandlerCancel();

    }

    withdrawOnClick() {
        this.on('withdraw-on-click', (event) => {
            if (this.__displayErrorRequiredField(event)) {
                console.log('withdraw')
                this._finishProcess(event, {
                    withdrow: true,
                });
            }
        });
    }

    attachHandlerCancel (){
        this.on('cancel', (event) => {
            if (this.__displayErrorRequiredField(event)) {
                console.log('withdraw')
                this._finishProcess(event, {
                    withdrow: false,
                });
            }
        });
    }

    _finishProcess(event, response) {
        event.stopImmediatePropagation();
        this.responseCallback(undefined, response);
    };


    __displayErrorRequiredField(event) {

        debugger;
        if (this.model.reason.value === undefined || this.model.reason.value === null || this.model.reason.value.length === 0) {
            this._emitFeedback(event, 'Reason is required.', "alert-danger");
            return true;
        }
        return false;
    }

    _emitFeedback(event, message, alertType) {
        event.preventDefault();
        event.stopImmediatePropagation();

        this.model.error.value= 'Reason is requiered';
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, "Validation", alertType)
        }
    }
}
