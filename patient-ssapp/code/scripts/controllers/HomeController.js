
import CommunicationService from "../services/CommunicationService.js";
import TrialService from "./services/TrialService.js";
import NotificationsService from "./services/NotificationsService.js";
import DateTimeService from "./services/DateTimeService.js";

const {WebcController} = WebCardinal.controllers;
export default class HomeController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.setModel({});

        this.model.trials = [];


        this.TrialService = new TrialService(this.DSUStorage);
        this.NotificationsService = new NotificationsService(this.DSUStorage);

        this.TrialService.getServiceModel((err, data) => {
            if(err) {
                return console.error(err);
            }
            this.model.trials.push(...data.trials);
        })
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.PATIENT_IDENTITY);
        this.CommunicationService.listenForMessages((err, data) => {
            if (err) {
                return console.error(err);
            }
            data = JSON.parse(data);
            this.addMessageToNotificationDsu(data);
            this.TrialService.mountTrial(data.message.ssi, (err, trial) => {
                if (err) {
                    return console.log(err);
                }
                trial.uid = trial.keySSI;
                this.TrialService.updateTrial({...trial, tpNumber: data.message.useCaseSpecifics.tpNumber}, (err, trial) => {
                    if (err) {
                        return console.log(err);
                    }
                    debugger
                    this.model.trials.push(trial);
                    this.TrialService.getEconsents(trial.keySSI, (err, data) => {
                        if (err) {
                            return console.log(err);
                        }
                        console.log(data.econsents);
                    })
                    console.log(trial);
                })
            });
        });

        this._attachHandlerTrialClick();
        this._attachHandlerSites();
        this._attachHandlerNotifications();
    }

    addMessageToNotificationDsu(message) {
        this.NotificationsService.saveNotification({
            ...message.message,
            uid: message.message.ssi,
            viewed: false,
            startDate: DateTimeService.convertStringToLocaleDate()
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
                let trial = model
                this.navigateToPageTag('trial', {
                    trialSSI: trial.keySSI,
                    tpNumber: trial.tpNumber
                });
            }
        )
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