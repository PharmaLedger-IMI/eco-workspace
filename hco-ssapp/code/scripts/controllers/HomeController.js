const {WebcController} = WebCardinal.controllers;
import CommunicationService from "../services/CommunicationService.js";
import NotificationsService from "../services/NotificationsService.js";
import TrialService from "../services/TrialService.js";

let getInitModel = () => {
    return {
        title: 'HomePage',
        trials: [],
        trialsModel: {
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
    }
}

export default class HomeController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.setModel(getInitModel());
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initTrial();
        this._handleMessages();
    }

    addMessageToNotificationDsu(message) {
        this.NotificationsService.saveNotification(message.message, (err, notification) => {
            if (err) {
                return console.log(err);
            }
        });
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.NotificationsService = new NotificationsService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);
    }

    _initHandlers() {
        this._attachHandlerTrialDetails();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    _initTrial() {
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
            switch (data.message.operation) {
                case 'add-trial': {
                    this.addMessageToNotificationDsu(data);
                    this.TrialService.mountTrial(data.message.ssi, (err, trial) => {
                        if (err) {
                            return console.log(err);
                        }
                        this.model.trials.push(trial);
                    });
                    break;
                }
                case 'delete-trial': {
                    break;
                }
                case 'sign-econsent': {
                    const message = data.message;
                    this.TrialService.getEconsent(message.useCaseSpecifics.trialSSI, message.ssi, (err, econsent) => {
                        if (err) {
                            return console.log(err);
                        }
                        econsent.patientSigned = true;
                        econsent.tpNumber = message.useCaseSpecifics.tpNumber;
                        econsent.uid = econsent.keySSI;
                        this.TrialService.updateEconsent(message.useCaseSpecifics.trialSSI, econsent, (err, response) => {
                            if (err) {
                                return console.log(err);
                            }
                        });
                    })
                    break;
                }
                case 'withdraw-econsent': {
                    break;
                }
            }
        });
    }

    _attachHandlerTrialDetails() {
        this.onTagEvent('home:trial', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.navigateToPageTag('trial', model.keySSI);
            }
        )
    }
}