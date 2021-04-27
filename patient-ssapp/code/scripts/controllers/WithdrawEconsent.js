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
        this.onTagEvent('withdraw-on-click', 'click', (model, target, event) => {
            this.send('confirmed', {
                withdraw: true,
            });
        });
    }

    attachHandlerCancel() {
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



    _emitFeedback(event, message, alertType) {
        event.preventDefault();
        event.stopImmediatePropagation();

        this.model.error.value = 'Reason is requiered';
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, "Validation", alertType)
        }
    }
}
