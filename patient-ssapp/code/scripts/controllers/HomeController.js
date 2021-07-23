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
                    this.mountTrial(data);
                    break;
                }
                case 'update-tpNumber': {

                    this.saveNotification(data);
                    this._updateTrialParticipant(data.message.useCaseSpecifics);
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
                tpDid: this.model.tp.did,
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

    async _saveConsentsStatuses(consents, did) {
        for (const consent of consents) {
            let i = consents.indexOf(consent);
            consent.actions = [];
            if (consent.type === 'Mandatory') {
                consent.actions.push({name: 'required'});
            }
            consent.foreignConsentId = consent.keySSI;

            consent.tpDid = did;
            let eco= await this.EconsentsStatusRepository.createAsync(consent);

        }
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
            name: data.tpName, did: data.tpDid, site: data.site
        }
        this.model.tp = await this.TrialParticipantRepository.createAsync(trialParticipant);
    }

    async _updateTrialParticipant(data) {

        this.model.tp.number =  data.number;
        await this.TrialParticipantRepository.updateAsync(this.model.tp.uid, this.model.tp);

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

    async mountTrial(data) {

        let  trial = await this.TrialService.mountTrialAsync(data.message.ssi);
        this.model.trials?.push(trial);
        this.TrialService.getEconsents(data.message.ssi, (err, consents) => {
            if (err) {
                return console.log(err);
            }
            this._saveConsentsStatuses(consents, data.message.useCaseSpecifics.did);
        });

    }

}
