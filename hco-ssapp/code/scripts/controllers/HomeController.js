import Constants from "../utils/Constants.js";
import SiteService from '../services/SiteService.js';
import TrialService from '../services/TrialService.js';
import TrialParticipantRepository from '../repositories/TrialParticipantRepository.js';
import NotificationsRepository from "../repositories/NotificationsRepository.js";
import VisitsAndProceduresRepository from "../repositories/VisitsAndProceduresRepository.js";
import QuestionsRepository from "../repositories/QuestionsRepository.js";
import BaseRepository from "../repositories/BaseRepository.js";

const {WebcController} = WebCardinal.controllers;

const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const SharedStorage = ecoServices.SharedStorage;

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
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
        this.StorageService = SharedStorage.getInstance(DSUStorage);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
        this.NotificationsRepository = BaseRepository.getInstance(DSUStorage,'notifications');
        this.SiteService = new SiteService(DSUStorage);
        this.VisitsAndProceduresRepository = VisitsAndProceduresRepository.getInstance(DSUStorage);
        this.QuestionsRepository = QuestionsRepository.getInstance(DSUStorage);
    }

    _initHandlers() {
        this._attachHandlerVisits();
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

                    this._saveNotification(data.message, 'New trial was added', 'view trial', Constants.NOTIFICATIONS_TYPE.TRIAL_UPDATES);

                    this.TrialService.mountTrial(data.message.ssi, (err, trial) => {
                        if (err) {
                            return console.log(err);
                        }

                    });
                    break;
                }
                case 'add-econsent-version': {
                    this._saveNotification(data.message, 'New ecosent version was added', 'view trial', Constants.NOTIFICATIONS_TYPE.CONSENT_UPDATES);
                    this.TrialService.mountTrial(data.message.ssi, () => {
                    });
                    this.sendMessageToPatient('refresh-trial', data.message.ssi,
                        Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.REFRESH_TRIAL);
                    break;
                }
                case 'add-consent': {
                    this._saveNotification(data.message, 'New ecosent  was added', 'view trial', Constants.NOTIFICATIONS_TYPE.CONSENT_UPDATES);
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
                    this._refreshSite(data.message);
                    this._saveNotification(data.message, 'The status of site was changed', 'view trial', Constants.NOTIFICATIONS_TYPE.TRIAL_UPDATES);

                    break;
                }
                case 'update-base-procedures': {
                    this._saveNotification(data.message, 'New procedure was added ', 'view trial', Constants.NOTIFICATIONS_TYPE.TRIAL_UPDATES);
                    this._updateVisits(data.message.ssi);
                    break;
                }
                case 'add-site': {

                    this._saveNotification(data.message, 'Your site was added to the trial ', 'view trial', Constants.NOTIFICATIONS_TYPE.TRIAL_UPDATES);

                    this.SiteService.mountSite(data.message.ssi, (err, site) => {

                        if (err) {
                            return console.log(err);
                        }
                        this.TrialService.mountTrial(site.trialKeySSI, (err, trial) => {
                            if (err) {
                                return console.log(err);
                            }

                        });
                    });

                    break;
                }

                case 'ask-question': {
                    this._saveQuestion(data.message);
                    break;
                }

                case Constants.MESSAGES.HCO.COMMUNICATION.TYPE.VISIT_RESPONSE: {

                    this._updateVisit(data.message);
                    break;
                }

                case 'add-trial-consent': {

                    this._saveNotification(data.message, 'New consent was added to trial  ', 'view trial', Constants.NOTIFICATIONS_TYPE.TRIAL_UPDATES);


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

    _refreshSite(message) {

        this.SiteService.mountSite(message.data.site, (err, site) => {
            if (err) {
                return console.log(err);
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
                    status = Constants.TRIAL_PARTICIPANT_STATUS.WITHDRAW;
                    this._saveNotification(message, 'Trial participant ' + message.useCaseSpecifics.tpDid + ' withdraw', 'view trial participants', Constants.NOTIFICATIONS_TYPE.WITHDRAWS);
                    break;
                }
                case 'withdraw-intention': {
                    actionNeeded = 'Reconsent required';
                    this._saveNotification(message, 'Trial participant ' + message.useCaseSpecifics.tpDid + ' withdraw', 'view trial participants', Constants.NOTIFICATIONS_TYPE.WITHDRAWS);
                    status = Constants.TRIAL_PARTICIPANT_STATUS.WITHDRAW;
                    break;
                }
                case 'Declined': {
                    actionNeeded = 'TP Declined';
                    this._saveNotification(message, 'Trial participant ' + message.useCaseSpecifics.tpDid + ' declined', 'view trial participants', Constants.NOTIFICATIONS_TYPE.WITHDRAWS);
                    status = Constants.TRIAL_PARTICIPANT_STATUS.DECLINED;
                    break;
                }
                case 'sign': {
                    tpSigned = true;
                    this._saveNotification(message, 'Trial participant ' + message.useCaseSpecifics.tpDid + ' signed', 'view trial', Constants.NOTIFICATIONS_TYPE.CONSENT_UPDATES);
                    actionNeeded = 'Acknowledgement required';
                    status = Constants.TRIAL_PARTICIPANT_STATUS.SCREENED;
                    break;
                }
            }

            currentVersion.actions.push({
                ...message.useCaseSpecifics.action,
                tpDid: message.useCaseSpecifics.tpDid,
                status: status,
                type: 'tp',
                actionNeeded: actionNeeded
            });

            this.TrialParticipantRepository.filter(`did == ${message.useCaseSpecifics.tpDid}`, 'ascending', 30, (err, tps) => {
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
        this.CommunicationService.sendMessage(CommunicationService.identities.ECO.PATIENT_IDENTITY, {
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

    _attachHandlerVisits() {
        this.onTagEvent('home:visits', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('visits');
        });
    }

    _saveNotification(notification, name, reccomendedAction, type) {
        notification.type = type;
        notification.name = name;
        notification.recommendedAction = reccomendedAction;
        this.NotificationsRepository.create(notification, (err, data) => {
            if (err) {
                return console.error(err);
            }
        });
    }

    _saveVisit(message) {
        let demoMessage = 'General details and description of the trial in case it provided by the Sponsor/Site regarding specific particularities of the Trial or general message for Trial Subject';
        this.TrialService.getEconsents(message, (err, consents) => {
            if (err) {
                return console.error(err);
            }
            consents.forEach(consent => {
                let procedures = consent.procedures;

                if (procedures) {
                    procedures.forEach(item => {

                        if (item.visits && item.visits.length > 0) {
                            item.visits.forEach(visit => {
                                let visitToBeAdded = {
                                    details: demoMessage,
                                    toRemember: demoMessage,
                                    procedures: demoMessage,
                                    name: item.name,
                                    consentSSI: item.consent.keySSI,
                                    trialSSI: message,
                                    period: visit.period,
                                    unit: visit.unit,
                                    id: visit.id
                                };

                                this.VisitsAndProceduresRepository.create(visitToBeAdded, (err, visitCreated) => {
                                    if (err) {
                                        return console.error(err);
                                    }
                                })
                            })
                        }

                    })
                }

            })
        })
    }

    _updateVisits(trialSSI) {

        //Here it will be updated and sync  but at this moment there is no solution to identify  and sync the visits and procedures
        this.VisitsAndProceduresRepository.filter(`trialSSI == ${trialSSI}`, 'asc', 30, (err, data) => {
            if (err) {
                return console.error(err);
            }
            if (data && data.length > 0) {
                let nrDeleted = 0;
                data.forEach(visit => {
                    this.VisitsAndProceduresRepository.delete(visit.pk, (err, msg) => {
                        if (err) {
                            return console.error(err);
                        }
                        nrDeleted++;
                        if (nrDeleted == data.length) {
                            this._saveVisit(trialSSI);
                        }
                    });
                })

            } else {
                this._saveVisit(trialSSI);
            }
        });
    }

    _saveQuestion(message) {
        this.QuestionsRepository.create(message.useCaseSpecifics.question.pk, message.useCaseSpecifics.question, (err, data) => {
            if (err) {
                console.log(err);
            }
            let notification = message;

            this._saveNotification(notification, message.shortDescription, 'view questions', Constants.NOTIFICATIONS_TYPE.TRIAL_SUBJECT_QUESTIONS);
        })
    }

    _updateVisit(message) {
        this.TrialParticipantRepository.filter(`did == ${message.useCaseSpecifics.tpDid}`, 'ascending', 30, (err, tps) => {
            if (err) {
                console.log(err);
            }
            let tp = tps[0];
            let objIndex = tp?.visits?.findIndex((obj => obj.id == message.useCaseSpecifics.visit.id));
            tp.visits[objIndex].accepted = message.useCaseSpecifics.visit.accepted;
            tp.visits[objIndex].declined = message.useCaseSpecifics.visit.declined;
            this.TrialParticipantRepository.update(tp.uid, tp, (err, data) => {
                if (err) {
                    console.log(err);
                }

                let notification = message;
                notification.tpUid = data.uid;
                this._saveNotification(notification, message.shortDescription, 'view visits', Constants.NOTIFICATIONS_TYPE.MILESTONES_REMINDERS);
            })


        });
    }
}
