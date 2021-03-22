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
            }
        })
        this.withdrawOnClick();
    }

    withdrawOnClick() {
        this.on('withdraw-on-click', (event) => {
            console.log('withdraw')
            this._finishProcess(event, {
                reason: this.model.reason.value
            });
        });
    }

    _finishProcess(event, response) {
        event.stopImmediatePropagation();
        this.responseCallback(undefined, response);
    };
}
