import TrialService from "./services/TrialService.js";

const {WebcController} = WebCardinal.controllers;

export default class TrialController extends WebcController {
    constructor(element, history) {
        super(element, history);
        this.TrialService = new TrialService(this.DSUStorage);
        this.setModel({trial: {}});
        let keyssi = this.history.win.history.state.state;
        debugger;
        this.TrialService.mountTrial(keyssi, (err, trial) => {
            if (err) {
                debugger;
                return console.log(err);
            }
            debugger;
            this.model.trial = trial;
        });

        this._attachHandlerAddTrialParticipant();
    }

    _attachHandlerAddTrialParticipant() {

        this.onTagEvent('add:tp', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.showModalFromTemplate('add-new-tp', (event) => {
                        const response = event.detail;
                        console.log(response);
                    },
                    (event) => {
                        const response = event.detail;
                        console.log(response);

                    }), {
                    controller: 'AddTrialParticipantController',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                }

            }
        )
    }
}