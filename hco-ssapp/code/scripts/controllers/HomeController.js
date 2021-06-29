import Constants from "../utils/Constants.js";
import CommunicationService from '../services/CommunicationService.js';
import SiteService from '../services/SiteService.js';
import TrialService from '../services/TrialService.js';
import SharedStorage from '../services/SharedStorage.js';

import TrialParticipantRepository from '../repositories/TrialParticipantRepository.js';
import NotificationsRepository from "../repositories/NotificationsRepository.js";

const {WebcController} = WebCardinal.controllers;

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
            },
        },
    };
};

export default class HomeController extends WebcController {
    constructor(...props) {
        super(...props);

        this.setModel(getInitModel());
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._handleMessages();
    }


    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);
        this.StorageService = SharedStorage.getInstance(DSUStorage);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
        this.NotificationsRepository = NotificationsRepository.getInstance(DSUStorage);
        this.SiteService = new SiteService(DSUStorage);
    }

    _initHandlers() {

        this._attachHandlerNotifications();
        this._attachHandlerPatients();
        this._attachHandlerTrialManagement();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    _handleMessages() {
        this.CommunicationService.listenForMessages((err, data) => {
            if (err) {
                return console.error(err);
            }
            data = JSON.parse(data);
            switch (data.message.operation) {
                case 'add-trial': {

                    this._saveNotification(data.message, 'New trial was added','view trial',Constants.NOTIFICATIONS_TYPE.TRIAL_UPDATES);
                    debugger;
                    this.TrialService.mountTrial(data.message.ssi, (err, trial) => {
                        if (err) {
                            return console.log(err);
                        }

                    });
                    break;
                }
                case 'add-econsent-version': {
                    this._saveNotification(data.message, 'New ecosent version was added','view trial',Constants.NOTIFICATIONS_TYPE.CONSENT_UPDATES);
                    this.TrialService.mountTrial(data.message.ssi, () => {
                    });
                    this.sendMessageToPatient('refresh-trial', data.message.ssi,
                        Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.REFRESH_TRIAL);
                    break;
                }
                case 'add-consent': {
                    this._saveNotification(data.message, 'New ecosent  was added','view trial',Constants.NOTIFICATIONS_TYPE.CONSENT_UPDATES);
                    this.TrialService.unmountTrial(data.message.ssi, (err, response) => {
                        this.TrialService.mountTrial(data.message.ssi, (err, response) => {
                        })
                    })
                    this.sendMessageToPatient('refresh-trial', data.message.ssi,
                        Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.REFRESH_TRIAL);
                    break;
                }
                case 'delete-trial': {
                    break;
                }
                case 'update-econsent': {
                    this._updateEconsentWithDetails(data.message);
                    break;
                }
                case 'site-status-change': {
                    this._saveNotification(data.message, 'The status of site was changed','view trial',Constants.NOTIFICATIONS_TYPE.TRIAL_UPDATES);
                    debugger;
                    break;
                }
                case 'add-site': {

                    this._saveNotification(data.message, 'Your site was added to the trial ','view trial',Constants.NOTIFICATIONS_TYPE.TRIAL_UPDATES);

                    this.SiteService.mountSite(data.message.ssi, (err,site)=>{
                        if (err) {
                            return console.log(err);
                        }
                        this.TrialService.mountTrial(site.keySSI, (err, trial) => {
                            if (err) {
                                return console.log(err);
                            }

                        });
                    });

                    break;
                }

                case 'add-trial-consent': {

                    this._saveNotification(data.message, 'New consent was added to trial  ','view trial',Constants.NOTIFICATIONS_TYPE.TRIAL_UPDATES);

                    debugger;
                    // this.SiteService.mountSite(data.message.ssi, (err,site)){
                    //     if (err) {
                    //         return console.log(err);
                    //     }
                    //     this.TrialService.mountTrial(site.keySSI, (err, trial) => {
                    //         if (err) {
                    //             return console.log(err);
                    //         }
                    //
                    //     });
                    // }

                    break;
                }
            }
        });
    }

    _updateEconsentWithDetails(message) {

        this.TrialService.getEconsent(message.useCaseSpecifics.trialSSI, message.ssi, (err, econsent) => {
            if (err) {
                return console.log(err);
            }
            let currentVersionIndex = econsent.versions.findIndex(eco => eco.version === message.useCaseSpecifics.version)
            if (currentVersionIndex === -1) {
                return console.log(`Version ${message.useCaseSpecifics.version} of the econsent ${message.ssi} does not exist.`)
            }
            let currentVersion = econsent.versions[currentVersionIndex]
            if (currentVersion.actions === undefined) {
                currentVersion.actions = [];
            }

            let actionNeeded = 'No action required';
            let status = Constants.TRIAL_PARTICIPANT_STATUS.SCREENED;
            let tpSigned = false;
            switch (message.useCaseSpecifics.action.name) {
                case 'withdraw': {
                    actionNeeded = 'TP Withdrawed';
                    status =status = Constants.TRIAL_PARTICIPANT_STATUS.WITHDRAW;
                    this._saveNotification(message, 'Trial participant '+message.useCaseSpecifics.tpNumber +' withdraw','view trial participants',Constants.NOTIFICATIONS_TYPE.WITHDRAWS);
                    break;
                }
                case 'withdraw-intention': {
                    actionNeeded = 'Reconsent required';
                    this._saveNotification(message, 'Trial participant '+message.useCaseSpecifics.tpNumber +' withdraw','view trial participants',Constants.NOTIFICATIONS_TYPE.WITHDRAWS);
                    status =status = Constants.TRIAL_PARTICIPANT_STATUS.WITHDRAW;
                    break;
                }
                case 'sign': {
                    tpSigned = true;
                    this._saveNotification(message, 'Trial participant '+message.useCaseSpecifics.tpNumber +' signed','view trial',Constants.NOTIFICATIONS_TYPE.CONSENT_UPDATES);
                    actionNeeded = 'Acknowledgement required';
                    status =status = Constants.TRIAL_PARTICIPANT_STATUS.SCREENED;
                    break;
                }
            }
            currentVersion.actions.push({
                ...message.useCaseSpecifics.action,
                tpNumber: message.useCaseSpecifics.tpNumber,
                status : status,
                type: 'tp',
                actionNeeded:actionNeeded
            });

            this.TrialParticipantRepository.filter(`did == ${message.useCaseSpecifics.tpNumber}`, 'ascending', 30, (err, tps) => {

                if (tps && tps.length > 0) {
                    let tp = tps[0];
                    tp.actionNeeded = actionNeeded;
                    tp.tpSigned = tpSigned;
                    tp.status = status;

                    this.TrialParticipantRepository.update(tp.uid, tp, (err, trialParticipant) => {

                        if (err) {
                            return console.log(err);
                        }
                        console.log(trialParticipant);
                    });
                }
            });


            econsent.uid = econsent.keySSI;
            econsent.versions[currentVersionIndex] = currentVersion;
            this.TrialService.updateEconsent(message.useCaseSpecifics.trialSSI, econsent, (err, response) => {
                if (err) {
                    return console.log(err);
                }
            });
        });
    }

    sendMessageToPatient(operation, ssi, shortMessage) {
        this.CommunicationService.sendMessage(CommunicationService.identities.PATIENT_IDENTITY, {
            operation: operation,
            ssi: ssi,
            shortDescription: shortMessage,
        });
    }

    _attachHandlerTrialManagement() {
        this.onTagEvent('home:trials', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-management');
        });
    }

    _attachHandlerPatients() {
        this.onTagEvent('home:patients', 'click', (model, target, event) => {

        });
    }

    _attachHandlerNotifications() {
        this.onTagEvent('home:notifications', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('notifications');
        });
    }

    _saveNotification(notification, name , reccomendedAction,  type) {

        debugger;
        notification.type = type;
        notification.name = name;
        notification.recommendedAction = reccomendedAction;
        this.NotificationsRepository.create(notification, (err, data) => {
            if (err) {
                return console.error(err);
            }
        });
    }

}
