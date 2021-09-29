import TrialService from '../services/TrialService.js';

const {WebcController} = WebCardinal.controllers;

const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const Constants = ecoServices.Constants;
const DateTimeService = ecoServices.DateTimeService;
const DIDService = ecoServices.DIDService;
const BaseRepository = ecoServices.BaseRepository;

export default class HomeController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({});
        this._initServices();
        this._initHandlers();
        this._initTrials();
        this._initTrialParticipant();
    }

    async _initServices() {
        this.TrialService = new TrialService();
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.TRIAL_PARTICIPANT);
        this.NotificationsRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.NOTIFICATIONS);
        this.EconsentsStatusRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.ECOSESENT_STATUSES);
        this.VisitsAndProceduresRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.VISITS);
        this.QuestionsRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.QUESTIONS);

        this.CommunicationService = await DIDService.getCommunicationServiceInstanceAsync(this);
        this._handleMessages();
    }

    _initHandlers() {
        this._attachHandlerTrialClick();
        this._attachHandlerNotifications();
        this._attachHandlerSites();
        this._attachHandlerVisits();
        this._attachHandlerQuestions();
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
            switch (data.message.operation) {
                case  Constants.MESSAGES.PATIENT.REFRESH_TRIAL: {
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
                case Constants.MESSAGES.PATIENT.ADD_TO_TRIAL : {
                    this.saveNotification(data);
                    let hcoIdentity = {
                        did: data.did,
                        domain: data.domain
                    }
                    this._saveTrialParticipantInfo(hcoIdentity, data.message.useCaseSpecifics);
                    this.mountTrial(data);
                    break;
                }
                case Constants.MESSAGES.PATIENT.SCHEDULE_VISIT : {
                    this.saveNotification(data);
                    this._saveVisit(data.message.useCaseSpecifics.visit);
                }
                case Constants.MESSAGES.PATIENT.UPDATE_VISIT : {
                    this.saveNotification(data);
                    this._updateVisit(data.message.useCaseSpecifics.visit);
                }
                case Constants.MESSAGES.PATIENT.UPDATE_TP_NUMBER: {
                    this.saveNotification(data);
                    this._updateTrialParticipant(data.message.useCaseSpecifics);
                    break;
                }
                case Constants.MESSAGES.PATIENT.QUESTION_RESPONSE: {
                    this.saveNotification(data);
                    this._updateQuestion(data.message.useCaseSpecifics);
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

    _attachHandlerQuestions() {
        this.onTagClick('home:questionns', (event) => {
            this.navigateToPageTag('questions');
        });
    }

    _attachHandlerVisits() {

        this.onTagClick('home:visits', (event) => {
            this.navigateToPageTag('visits-procedures', {
                tpDid: this.model.tp.did,
                tpUid: this.model.tp.uid
            });
            ;
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
            let eco = await this.EconsentsStatusRepository.createAsync(consent);

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

    async _saveTrialParticipantInfo(hcoIdentity, data) {
        let trialParticipant = {
            name: data.tpName,
            did: data.tpDid,
            site: data.site,
            hcoIdentity: hcoIdentity,
            sponsorIdentity: data.sponsorIdentity
        }
        this.model.tp = await this.TrialParticipantRepository.createAsync(trialParticipant);
    }

    async _updateTrialParticipant(data) {

        this.model.tp.number = data.number;
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

        let trial = await this.TrialService.mountTrialAsync(data.message.ssi);
        this.model.trials?.push(trial);
        this.TrialService.getEconsents(data.message.ssi, (err, consents) => {
            if (err) {
                return console.log(err);
            }
            this._saveConsentsStatuses(consents, data.message.useCaseSpecifics.did);
        });

    }


    _saveVisit(visitToBeAdded) {
        this.VisitsAndProceduresRepository.createAsync(visitToBeAdded.uid, visitToBeAdded, (err, visitCreated) => {
            if (err) {
                return console.error(err);
            }
            this.model.tp.hasNewVisits = true;
            this.TrialParticipantRepository.update(this.model.tp.uid, this.model.tp, (err, data) => {
                if (err) {
                    console.log(err);
                }
            })

        })
    }

    _updateVisit(visitToBeUpdated) {
        this.VisitsAndProceduresRepository.filter(`id == ${visitToBeUpdated.id}`, 'ascending', 1, (err, visits) => {
            if (err || visits.length === 0) {
                return;
            }
            this.VisitsAndProceduresRepository.update(visits[0].pk, visitToBeUpdated, (err, updatedVisit) => {
                if (err) {
                    return err;
                }
            })
        })
    }

    _updateQuestion(data) {
        if (data.question) {
            this.QuestionsRepository.update(data.question.pk, data.question, (err, created) => {
                if (err) {
                    console.log(err);
                }
            })
        }
    }
}
