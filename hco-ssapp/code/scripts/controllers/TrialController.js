import TrialService from "./services/TrialService.js";
import Trial from "./services/TrialService.js";
import TrialParticipantsService from "./services/TrialParticipantsService.js";

const {WebcController} = WebCardinal.controllers;

export default class TrialController extends WebcController {
    constructor(element, history) {
        super(element, history);
        this.TrialService = new TrialService(this.DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(this.DSUStorage);
        this.setModel({trial: {}, trialParticipants: []});
        this.mountData();
        this.keyssi = this.history.win.history.state.state;
        debugger;


        this._attachHandlerAddTrialParticipant();
    }

    mountData() {

        this.TrialService.mountTrial(this.keyssi, (err, trial) => {
            if (err) {
                debugger;
                return console.log(err);
            }
            debugger;
            this.model.trial = trial;
        });

        this.TrialParticipantService.getTPS((err, data) => {
            if (err) {
                console.log(err);
                debugger;
                return;
            }

            console.log("All TPS " + data);
            this.model.trialParticipants = data.tps;
        });
    }

    _attachHandlerAddTrialParticipant() {

        this.onTagEvent('add:tp', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.showModalFromTemplate('add-new-tp', (event) => {
                        const response = event.detail;
                        this.createTpDsu(event.detail);
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

    createTpDsu(tp) {
        tp.trialNumber = this.model.trial.number;
        tp.status = "enrolled";
        this.TrialParticipantService.saveTrialParticipant(tp, (err, tp) => {
            debugger;
            if (err) {
                console.log(err);
                return;
            }
            console.log("New tp added " + tp);
        });

    }
}