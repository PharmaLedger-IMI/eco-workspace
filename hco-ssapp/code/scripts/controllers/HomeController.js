import SiteService from '../services/SiteService.js';
import TrialService from '../services/TrialService.js';

const {WebcController} = WebCardinal.controllers;

const ecoServices = require('eco-services');
const DIDService = ecoServices.DIDService;
const SharedStorage = ecoServices.SharedStorage;
const Constants = ecoServices.Constants;
const BaseRepository = ecoServices.BaseRepository;

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
        this._initServices();
        this._initHandlers();
    }

    async _initServices() {
        this.TrialService = new TrialService();
        this.StorageService = SharedStorage.getInstance();
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.TRIAL_PARTICIPANTS);
        this.NotificationsRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.NOTIFICATIONS);
        this.VisitsAndProceduresRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.VISITS);
        this.SiteService = new SiteService();
        this.CommunicationService = await DIDService.getCommunicationServiceInstanceAsync(this);
        this._handleMessages();
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

    _reMountTrialAndSendRefreshMessageToAllParticipants() {
        this.TrialService.mountTrial(data.message.ssi, () => {});
        this.TrialParticipantRepository.findAll((err, tps) => {
            if (err) {
                return console.log(err);
            }
            tps.forEach(tp => {
                this.sendMessageToPatient(tp.did, 'refresh-trial', data.message.ssi, Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.REFRESH_TRIAL);
            })
        })
    }

    _handleMessages() {
        this.CommunicationService.listenForMessages((err, data) => {
            if (err) {
                return console.error(err);
            }
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
                    this._reMountTrialAndSendRefreshMessageToAllParticipants();
                    break;
                }
                case 'add-consent': {
                    this._saveNotification(data.message, 'New ecosent  was added', 'view trial', Constants.NOTIFICATIONS_TYPE.CONSENT_UPDATES);
                    this._reMountTrialAndSendRefreshMessageToAllParticipants();
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
                    this._saveVisit(data.message.ssi);
                    break;
                }
                case 'add-site': {

                    this._saveNotification(data.message, 'Your site was added to the trial ', 'view trial', Constants.NOTIFICATIONS_TYPE.TRIAL_UPDATES);
                    this.SiteService.mountSite(data.message.ssi, (err, site) => {
                        if (err) {
                            return console.log(err);
                        }
                        site.sponsorIdentity = {
                            did: data.did,
                            domain: data.domain
                        }
                        this.SiteService.updateSite(site, (err, data) => {
                            if (err) {
                                return console.log(err);
                            }
                            this.TrialService.mountTrial(site.trialKeySSI, (err, trial) => {
                                if (err) {
                                    return console.log(err);
                                }
                            });
                        })
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

    sendMessageToPatient(did, operation, ssi, shortMessage) {
        this.CommunicationService.sendMessage(did, {
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


    _attachHandlerNotifications() {
        this.onTagEvent('home:notifications', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('notifications');
        });
    }

    _attachHandlerPatients() {
        this.onTagEvent('home:patients', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('patients-list');
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

                let visits = consent.visits;
                if (visits) {
                    visits.forEach(item => {

                        let visitToBeAdded = {
                            name: item.name,
                            procedures: item.procedures,
                            uuid: item.uuid,
                            visitWindow: item.visitWindow,
                            trialSSI: message,
                            consentsSSI: []
                        }

                        visitToBeAdded.consentsSSI.push(consent.keySSI);
                        let weaksFrom = item.weeks?.filter(weak => weak.type === 'weekFrom' || weak.type === 'week');
                        if (weaksFrom)
                            visitToBeAdded.weakFrom = weaksFrom[0]?.value;
                        let weaksTo = item.weeks?.filter(weak => weak.type === 'weekTo');
                        if (weaksTo)
                            visitToBeAdded.weakTo = weaksTo[0]?.value;

                        let plus = item.visitWindow?.filter(weak => weak.type === 'windowFrom');
                        if (plus)
                            visitToBeAdded.plus = plus[0]?.value;
                        let minus = item.visitWindow?.filter(weak => weak.type === 'windowTo');
                        if (plus)
                            visitToBeAdded.minus = minus[0]?.value;
                        this.VisitsAndProceduresRepository.findBy(visitToBeAdded.uuid, (err, existingVisit) => {
                            if (err || !existingVisit) {

                                this.VisitsAndProceduresRepository.create(visitToBeAdded.uuid, visitToBeAdded, (err, visitCreated) => {
                                    if (err) {
                                        return console.error(err);
                                    }
                                })
                            } else if (existingVisit) {
                                visitToBeAdded.consentsSSI.push(existingVisit.consentsSSI);
                                visitToBeAdded.procedures.push(existingVisit.procedures);

                                this.VisitsAndProceduresRepository.update(visitToBeAdded.uuid, visitToBeAdded, (err, visitCreated) => {
                                    if (err) {
                                        return console.error(err);
                                    }
                                })
                            }
                        })

                    })
                }

            })
        })
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
            let objIndex = tp?.visits?.findIndex((obj => obj.uuid == message.useCaseSpecifics.visit.id));
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