import CommunicationService from "./services/CommunicationService.js";
import NotificationsService from "./services/NotificationsService.js";

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
        {
            id: 1,
            title: 'Trial 1',
            date: '11.mm.yyyy',
            description: 'trial 1Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris ',
            initTrialModel: JSON.parse(JSON.stringify(initialTrialModel))

        },
        {
            id: 2,
            title: 'Trial 2',
            date: '22.mm.yyyy',
            description: 'Trial 2 Description Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris ',
            initTrialModel: JSON.parse(JSON.stringify(initialTrialModel))
        },
        {
            id: 3,
            title: 'Trial 3',
            date: '33.mm.yyyy',
            description: 'Trial 3 Description Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris ',
            initTrialModel: JSON.parse(JSON.stringify(initialTrialModel))
        },
    ],
    trialsModel: JSON.parse(JSON.stringify(initialTrialModel))
}

export default class HomeController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.setModel(initModel);
        this.NotificationsService = new NotificationsService(this.DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);

        this.CommunicationService.listenForMessages((err, message) => {

            if(err) {
                return console.error(err);
            }
            message = JSON.parse(message);
            this.addMessageToNotificationDsu (message);
            console.log(message);
            debugger;

        });

        this._attachHandlerTrialDetails();

    }



    _attachHandlerTrialDetails() {

        this.onTagEvent('home:trial', 'click', () => {
                console.log('button pressed ');
                this.navigateToPageTag('trial');
            }
        )
    }


    addMessageToNotificationDsu (message){
        debugger;

        this.NotificationsService.saveNotification( message.message,(err, notification) => {
            debugger;
            if (err) {
                console.log(err);
                return;
            }

            console.log("Notification saved" +notification.uid);
        });
    }
}