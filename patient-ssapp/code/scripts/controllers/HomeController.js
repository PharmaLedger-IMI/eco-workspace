import CommunicationService from '../services/CommunicationService.js';
import TrialService from '../services/TrialService.js';
import DateTimeService from '../services/DateTimeService.js';
import TrialParticipantRepository from "../repositories/TrialParticipantRepository.js";
import NotificationsRepository from "../repositories/NotificationsRepository.js";
import EconsentsStatusRepository from "../repositories/EconsentsStatusRepository.js";

const {WebcController} = WebCardinal.controllers;

export default class HomeController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({});
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initTrials();
        this._initTrialParticipant();
        this._handleMessages();
    }


    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.EconsentsStatusRepository = EconsentsStatusRepository.getInstance(DSUStorage);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.PATIENT_IDENTITY);
        this.NotificationsRepository = NotificationsRepository.getInstance(DSUStorage);
        this.EconsentsStatusRepository = EconsentsStatusRepository.getInstance(DSUStorage);
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
        });
    }

    _handleMessages() {
        this.CommunicationService.listenForMessages((err, data) => {
            if (err) {
                return console.error(err);
            }
            data = JSON.parse(data);
            switch (data.message.operation) {
                case 'refresh-trial': {
                    this.TrialService.reMountTrial(data.message.ssi, (err, trial) => {
                        this.TrialService.getEconsents(trial.keySSI, (err, consents) => {
                            if (err) {
                                return console.log(err);
                            }
                            this._saveConsentsStatuses(consents, this.model.tp?.did);
                        });
                    });
                    break;
                }
                case 'add-to-trial' : {
                    this.saveNotification(data);
                    this._saveTrialParticipantInfo(data.message.useCaseSpecifics);
                    this.mountTrial (data);
                    break;
                }
                case 'update-tpNumber': {
                    this.saveNotification(data);
                    this._saveTrialParticipantInfo(data.message.useCaseSpecifics);
                    break;
                }
            }
        });
    }


    _attachHandlerTrialClick() {
        this.onTagEvent('home:trial', 'click', (trial, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            this.navigateToPageTag('trial', {
                trialSSI: trial.keySSI,
                tpNumber: this.model.tp.did,
                isNewTp: this.model.isNewTp,
            });
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

    _saveConsentsStatuses(consents, did) {
        consents.forEach((consent, i) => {
            consent.actions = [];
            if (consent.type === 'Mandatory') {
                consent.actions.push({name: 'required'});
            }
            consent.foreignConsentId = consent.keySSI;

            consent.tpDid = did;
            this.EconsentsStatusRepository.create(consent, (err, data) => {
                if (err) {
                    return console.log(err);
                }
                console.log('database record' + data);
            })

        });
    }

    _initTrialParticipant() {
        this.model.tp = {};
        this.TrialParticipantRepository.findAll((err, data) => {
            if (err) {
                return console.log(err);
            }
            if (data && data.length > 0) {
                this.model.tp = data[data.length - 1];
            }
        });
    }

    async _saveTrialParticipantInfo(data) {

        let trialParticipant = {
            name: data.tpName, tpNumber: data.tpNumber, tpDid: data.tpDid, site: data.site
        }

        if (!this.model.tp || !this.model.tp.name) {
            this.model.tp = await this.TrialParticipantRepository.createAsync(trialParticipant);
        } else {
            this.model.tp.tpNumber = trialParticipant.tpNumber;
            this.model.tp.did = trialParticipant.tpDid;
            if (trialParticipant.name) {

                this.model.tp.name = trialParticipant.name;

            }
            this.model.tp = this.TrialParticipantRepository.updateAsync(this.model.tp.uid, this.model.tp);
        }

    }

    async saveNotification(message) {
        let notification = {
            ...message.message,
            uid: message.message.ssi,
            viewed: false,
            startDate: DateTimeService.convertStringToLocaleDate(),
        }
        let not = await this.NotificationsRepository.createAsync(notification, (err, data) => {
            if (err) {
                return console.error(err);
            }
        });
    }

    async mountTrial (data){

        let  trial = await this.TrialService.mountTrialAsync(data.message.ssi);
        this.TrialService.getEconsents(data.message.ssi, (err, consents) => {
            if (err) {
                return console.log(err);
            }
            this._saveConsentsStatuses(consents, data.message.useCaseSpecifics.did);
        });

    }

}
