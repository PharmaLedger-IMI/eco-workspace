import CommunicationService from "./services/CommunicationService.js";
import TrialService from "./services/TrialService.js";

const {WebcController} = WebCardinal.controllers;

const initialTrialModel = {
    title: {
        name: 'trial',
        label: 'Trial',
        value: 'Trial1',
    },
    date: {
        name: 'date',
        label: 'Date',
        value: 'dd.mm.yyyy',
    },
    description: {
        name: 'description',
        label: 'Description',
        value: 'Loren ipsum test test test test test test 1 ',
    }
}


const initModel = {
    title: 'HomePage',
    trials: [
        // {
        //     id: 1,
        //     name: 'ala',
        //     title: 'Trial 1',
        //     date: '11.mm.yyyy',
        //     description: 'trial 1Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris ',
        //     initTrialModel: JSON.parse(JSON.stringify(initialTrialModel))
        //
        // },
        // {
        //     id: 2,
        //     name: 'bala',
        //     title: 'Trial 2',
        //     date: '22.mm.yyyy',
        //     description: 'Trial 2 Description Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris ',
        //     initTrialModel: JSON.parse(JSON.stringify(initialTrialModel))
        // },
        // {
        //     id: 3,
        //     name: 'portocala',
        //     title: 'Trial 3',
        //     date: '33.mm.yyyy',
        //     description: 'Trial 3 Description Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris ',
        //     initTrialModel: JSON.parse(JSON.stringify(initialTrialModel))
        // },
    ],
    trialsModel: JSON.parse(JSON.stringify(initialTrialModel))
}

export default class HomeController extends WebcController {
    constructor(element, history) {
        super(element, history);
        this._attachHandlerCreateTrial();
        this._attachHandlerClinics();
        this._attachHandlerTrialDetails();
        this.setModel(initModel);

        this.TrialService = new TrialService(this.DSUStorage);
        this.TrialService.getServiceModel((err, data) => {
            if(err) {
                return console.error(err);
            }
            this.model.trials = data.trials;
        })
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);
        this.CommunicationService.listenForMessages((err, data) => {
            if(err) {
                return console.error(err);
            }
            data = JSON.parse(data);
            this.TrialService.mountTrial(data.message.ssi,(err, trial) => {
                if (err) {
                    return console.log(err);
                }
                this.model.trials.push(trial);
            });
            this.addMessageToNotificationDsu(data);
        });

        this.onTagEvent('home:trial', 'click', (model) => {
            this.navigateToPageTag('trial', model.id);
        })
    }

    _attachHandlerCreateTrial() {
        this.onTagEvent('home:patient', 'click', (event) => {
            e.preventDefault();
            console.log("print");
            e.stopImmediatePropagation();
            this.navigateToPageTag('create-trial');
        });
    }

    _attachHandlerTrialDetails() {
        this.on('home:trialDetails', (event) => {
            console.log("Button pressed");
            const id = event.data;
            const trialIndex = this.model.trials.findIndex((trial) => trial.id === id);
            if (trialIndex === -1) {
                console.log('trial not found @id', id, this.model.trials);
                return;
            }

            const trialDetails = this.model.trials[trialIndex];
            this.showModal('trialDetails', trialDetails, (err, data) => {
                if (err) {
                    console.log(err);
                    return;
                }

            })

        });
    }


    _attachHandlerClinics() {
        this.on('home:clinics', (event) => {
            console.log("Button 2 pressed");
        });
    }

    addMessageToNotificationDsu (message){

    }
}