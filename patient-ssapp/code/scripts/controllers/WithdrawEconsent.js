import ModalController from '../../../cardinal/controllers/base-controllers/ModalController.js';

export default class WithdrawEconsent extends ModalController {
    constructor(element, history) {
        super(element, history);
        this.setModel({
            reason: {
                label: "Please fill the reason bellow",
                name: "reason",
                required: true,
                value: ''
            },
            error: {
                name:"error",
                value: ''
            }
        })
        this.on('openFeedback', (evt) => {
            this.feedbackEmitter = evt.detail;
        });
        this.withdrawOnClick();

    }

    withdrawOnClick() {
        this.on('withdraw-on-click', (event) => {
            if (this.__displayErrorRequiredField(event)) {
                console.log('withdraw')
                this._finishProcess(event, {
                    reason: this.model.reason.value,
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
