import TrialService from '../services/TrialService.js';
const {WebcController} = WebCardinal.controllers;

const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const DateTimeService = ecoServices.DateTimeService;
//const DIDService = ecoServices.DIDService;
const BaseRepository = ecoServices.BaseRepository;

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

    async _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.TRIAL_PARTICIPANT, DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.PATIENT_IDENTITY);
        this.NotificationsRepository =  BaseRepository.getInstance(BaseRepository.identities.PATIENT.NOTIFICATIONS, DSUStorage);
        this.EconsentsStatusRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.ECOSESENT_STATUSES, DSUStorage);
        this.VisitsAndProceduresRepository =  BaseRepository.getInstance(BaseRepository.identities.PATIENT.VISITS, DSUStorage);
        this.QuestionsRepository =  BaseRepository.getInstance(BaseRepository.identities.PATIENT.QUESTIONS, DSUStorage);

        //let auxCommunicationService = await DIDService.getCommunicationServiceInstanceAsync(this);
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
                case 'schedule-visit' : {
                    this.saveNotification(data);
                    this._saveVisit(data.message.useCaseSpecifics.visit);
                }
                case 'update-visit' : {
                    this.saveNotification(data);
                    this._updateVisit(data.message.useCaseSpecifics.visit);
                }
                case 'update-tpNumber': {
                    this.saveNotification(data);
                    this._updateTrialParticipant(data.message.useCaseSpecifics);
                    break;
                }
                case 'question-response': {
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

    async _saveTrialParticipantInfo(data) {

        let trialParticipant = {
            name: data.tpName, did: data.tpDid, site: data.site
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
        this.VisitsAndProceduresRepository.createAsync(visitToBeAdded, (err, visitCreated) => {
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
