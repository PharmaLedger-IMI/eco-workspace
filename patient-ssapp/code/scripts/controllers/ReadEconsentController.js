import ModalController from '../../../cardinal/controllers/base-controllers/ModalController.js';

export default class WithdrawEconsent extends ModalController {
    constructor(element, history) {
        super(element, history);
        this.setModel({
            econsent: {

                name: "econsent",
                required: true,
                value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum'
            },
            error: {
                name: "error",
                value: ''
            }
        })

        this.signEconsent();

    }

    signEconsent() {
        this.on('econsent:sign', (event) => {

            console.log('withdraw')
            this._finishProcess(event, {
                signed: true,
            });
        });
    }

    _finishProcess(event, response) {
        event.stopImmediatePropagation();
        this.responseCallback(undefined, response);
    };


}
