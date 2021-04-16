import TrialDataService from "./services/TrialDataService.js";
import Constants from "./Constants.js";
import TrialService from "./services/TrialService.js";

const {WebcController} = WebCardinal.controllers;

export default class TrialController extends WebcController {

    trialStatus = {
        first: {
            name: 'First',
            color: '#00cc00',
            value: 1,
            background: ''
        },
        second: {
            name: 'Second',
            color: '#00cc00',
            value: 2,
            background: ''
        },
        third: {
            name: 'Third',
            color: '#00cc00',
            value: 3,
            background: ''
        },
        fourth: {
            name: 'Forth',
            color: '#00cc00',
            value: 4,
            background: ''
        },
        Completed: {
            name: 'Completed',
            color: '#00cc00',
            value: 5,
            background: ''
        },

    }

    constructor(element, history) {
        super(element, history);

        this.setModel({});

        this.model.trial = {};
        this.model.econsents = [];

        this.TrialService = new TrialService(this.DSUStorage);

        this.keyssi = this.history.win.history.state.state;
        this.mountData();
        debugger;

        // this.TrialDataService = new TrialDataService(this.DSUStorage);
        // this.TrialDataService.getTrial(1, (err, data) => {
        //     if (err) {
        //         return console.log(err);
        //     }
        //     debugger
        //
        //     this.model.trial = data;
        //     this.model.trial.color = Constants.getColorByTrialStatus(this.model.trial.status);
        //     this.model.econsents.push(...data.econsents);
        //     console.log("data" + data);
        //     console.log("ECONSENTS" + data.econsents);
        //
        // })


        this.on('go-to-site', (event) => {
            this.navigateToPageByTag('site', event.data);
        })


        this.onTagClick('go-to-econsent', (model, target, event) => {
                this.navigateToPageTag('econsent')
            }
        )


    }

    mountData() {

        this.TrialService.getTrial(this.keyssi, (err, trial) => {
            if (err) {
                debugger;
                return console.log(err);
            }
            debugger;
            this.model.trial = trial;
            this.model.trial.color = Constants.getColorByTrialStatus(this.model.trial.status);
            this.TrialService.getEconsents(trial.keySSI, (err, data) => {
                if (err) {
                    return console.log(err);
                    debugger;
                }
                debugger;

                this.model.econsents.push(...data.econsents);
                console.log(data.econsents);
            })

        });

    }

}