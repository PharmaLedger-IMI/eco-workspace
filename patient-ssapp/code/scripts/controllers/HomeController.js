import CommunicationService from "../services/CommunicationService.js";
import TrialService from "../services/TrialService.js";
import EconsentService from "../services/EconsentService.js";
import NotificationsService from "../services/NotificationsService.js";
import DateTimeService from "../services/DateTimeService.js";

const {WebcController} = WebCardinal.controllers;

export default class HomeController extends WebcController {

    constructor(element, history) {
        super(element, history);
        this.setModel({});
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initTrials();
        this._handleMessages();
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

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.NotificationsService = new NotificationsService(DSUStorage);
        this.EconsentService = new EconsentService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.PATIENT_IDENTITY);
    }

    _initHandlers() {
        this._attachHandlerTrialClick();
        this._attachHandlerNotifications();
        this._attachHandlerSites();
    }

    _initTrials() {
        this.model.trials = [];
        this.TrialService.getTrials((err, data) => {
            if (err) {
                return console.error(err);
            }
            this.model.trials = data;
        })
    }

    _handleMessages() {
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
                this.TrialService.updateTrial({
                    ...trial,
                    tpNumber: data.message.useCaseSpecifics.tpNumber
                }, (err, trial) => {
                    if (err) {
                        return console.log(err);
                    }
                    this.model.trials.push(trial);
                    this.TrialService.getEconsents(trial.keySSI, (err, consents) => {
                        if (err) {
                            return console.log(err);
                        }
                        this._saveConsentsStatuses(consents);
                    })

                    console.log(trial);
                })
            });
        });
    }


    _attachHandlerTrialClick() {

        this.onTagEvent('home:trial', 'click', (trial, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
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

    _saveConsentsStatuses(consents) {
        consents.forEach((consent, i) => {
            consent.actions = [];
            if (consent.type === 'Mandatory') {
                consent.actions.push({name: 'required'});
            }
            consent.foreignConsentId = consent.keySSI;
            this.EconsentService.saveEconsent(consent, (err, response) => {
                if (err) {
                    return console.log(err);
                }
            })
        })
    }

}