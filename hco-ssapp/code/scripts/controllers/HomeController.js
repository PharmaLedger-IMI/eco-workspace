import CommunicationService from "./services/CommunicationService.js";
import NotificationsService from "./services/NotificationsService.js";
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

    ],
    trialsModel: JSON.parse(JSON.stringify(initialTrialModel))
}

export default class HomeController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.setModel(initModel);
        this.NotificationsService = new NotificationsService(this.DSUStorage);

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
            this.addMessageToNotificationDsu (data);

            this.TrialService.mountTrial(data.message.ssi,(err, trial) => {
                if (err) {
                    return console.log(err);
                }
                this.model.trials.push(trial);
            });

        });


        this.model.trials.push ({number:'aaaa', status:'bbbb',name:'ccccc',id:'1',keySSI:'aaa'});

        this._attachHandlerTrialDetails();

    }



    _attachHandlerTrialDetails() {

        this.onTagEvent('home:trial', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            let trial = this.model.trials.find(trial => trial.id == target.attributes['data'].value)
            this.navigateToPageTag('trial',trial.keySSI);

            console.log(target.attributes['data'].value)
            }
        )
    }


    addMessageToNotificationDsu (message){

        this.NotificationsService.saveNotification( message.message,(err, notification) => {

            if (err) {
                console.log(err);
                return;
            }

            });
    }

}