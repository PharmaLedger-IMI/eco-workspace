import TrialDataService from "./services/TrialDataService.js";
import CommunicationService from "./services/CommunicationService.js";
import TrialService from "./services/TrialService.js";
import NotificationsService from "./services/NotificationsService.js";

const {WebcController} = WebCardinal.controllers;
export default class HomeController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.setModel({});

        this.model.trials = [];

        this.TrialDataService = new TrialDataService(this.DSUStorage);
        this.TrialDataService.getTrials((err, data) => {
            if (err) {
                return console.log(err);
            }
            //this.model.trials = data;
            this.model.trials.push(...data);
        })

        this._attachHandlerTrialClick();
        this._attachHandlerEDiary();
        this._attachHandlerSites();
        this._attachHandlerNotifications();

        this.TrialService = new TrialService(this.DSUStorage);
        this.NotificationsService = new NotificationsService(this.DSUStorage);

        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.PATIENT_IDENTITY);
        this.CommunicationService.listenForMessages((err, data) => {
            if (err) {
                return console.error(err);
            }
            data = JSON.parse(data);
            this.addMessageToNotificationDsu(data);
            console.log("data in patient " + data);
            this.TrialService.mountTrial(data.message.ssi, (err, trial) => {
                if (err) {
                    return console.log(err);
                }
                this.model.trials.push(trial);
                this.TrialService.getEconsents(trial.keySSI, (err, data) => {
                    if (err) {
                        return console.log(err);
                    }
                    console.log(data.econsents);
                })
                console.log(trial);
            });

        });
    }

    addMessageToNotificationDsu(message) {
        this.NotificationsService.saveNotification({
            ...message.message,
            uid: message.message.ssi,
            viewed: false,
            startDate: new Date().toLocaleDateString("sw")
        }, (err, data) => {
            if (err) {
                return console.log(err);
            }
        })
    }

    _attachHandlerTrialClick() {

        this.onTagEvent('home:trial', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                debugger
                let trial = this.model.trials.find(trial => trial.id == target.attributes['data'].value)
                this.navigateToPageTag('trial', trial.keySSI);

                console.log(target.attributes['data'].value)
            }
        )
    }

    _attachHandlerEDiary() {
        this.onTagClick('home:ediary', (event) => {
            this.navigateToPageTag('ediary');
        });
    }

    _attachHandlerSites() {
        this.onTagClick('home:site', (event) => {
            this.navigateToPageTag('site');
        });
    }

    _attachHandlerNotifications() {
        this.onTagClick('home:notifications', (event) => {
            this.navigateToPageTag('notifications');
        });
    }


}