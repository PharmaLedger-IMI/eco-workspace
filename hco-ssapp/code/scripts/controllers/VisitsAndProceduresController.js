
import TrialService from "../services/TrialService.js";

const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const DateTimeService = ecoServices.DateTimeService;
const Constants = ecoServices.Constants;
const BaseRepository = ecoServices.BaseRepository;

const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        visits: []
    };
};

export default class VisitsAndProceduresController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({
            ...getInitModel(),
            ...this.history.win.history.state.state,
            visits: []
        });
        ;
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initVisits();
    }

    _initHandlers() {
        this._attachHandlerBack();
        this._attachHandlerDetails();
        this._attachHandlerSetDate();
        this._attachHandlerConfirm();
        this._attachHandlerEditDate();
        this._attachHandlerEditVisit();
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.VisitsAndProceduresRepository =BaseRepository.getInstance(BaseRepository.TABLE_NAMES.HCO.VISITS);
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.TABLE_NAMES.HCO.TRIAL_PARTICIPANT_REPOSITORY);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
    }

    async _initVisits() {
        this.TrialService.getEconsents(this.model.trialSSI, async (err, econsents) => {
            if (err) {
                return err;
            }
            let visits = await this.VisitsAndProceduresRepository.findAllAsync();
            // TODO: AUXILIARY METHOD TO COMPUTE VISITS BY PROCEDURES; TO BE DELETED AFTER
            //  SPONSOR SENDS THE VISITS PROPERLY
            let proceduresMappedByVisits = {}
            visits.forEach((visit) => {
                if (proceduresMappedByVisits[visit.id] === undefined) {
                    proceduresMappedByVisits[visit.id] = [];
                }
                proceduresMappedByVisits[visit.id].push(visit);
            });
            let newVisits = [];
            Object.keys(proceduresMappedByVisits).forEach((key) => {

                let visit = {
                    ...proceduresMappedByVisits[key][0],
                    procedures: proceduresMappedByVisits[key],
                    econsent: econsents[0]
                }
                newVisits.push(visit)
            })
            this.model.visits = newVisits;
            // END TODO
            // this.model.visits = visits.map(visit => {
            //     return {
            //         ...visit,
            //         econsent: econsents[0]
            //     }
            // });
            if (this.model.visits && this.model.visits.length > 0) {
                this.model.tp = await this.TrialParticipantRepository.findByAsync(this.model.tpUid);
                if (!this.model.tp.visits || this.model.tp.visits.length < 1) {
                    this.model.tp.visits = this.model.visits;
                    this._updateTrialParticipant();
                    return;
                } else {
                    this.model.visits.forEach(visit => {

                        let visitTp = this.model.tp.visits.filter(v => v.uid === visit.uid)[0];
                        visit.confirmed = visitTp.confirmed;
                        visit.accepted = visitTp.accepted;
                        visit.declined = visitTp.declined;
                        if (!visit.accepted && !visit.declined) {
                            visit.tsAcceptance = 'Required';
                        } else {
                            if (visit.accepted) {
                                visit.tsAcceptance = 'Agreed';
                            } else {
                                visit.tsAcceptance = 'Declined';
                            }
                        }
                        visit.date = visitTp.date;
                        visit.toShowDate = DateTimeService.convertStringToLocaleDateTimeString(visitTp.date);
                    })
                }
            }
        });
    }

    _updateTrialParticipantVisit(visit, operation) {
        if (!this.model.tp.visits) {
            this.model.tp.visits = this.visits;
        }

        let objIndex = this.model.tp.visits.findIndex((obj => obj.uid == visit.uid));
        this.model.tp.visits[objIndex] = visit;
        this.TrialParticipantRepository.updateAsync(this.model.tp.uid, this.model.tp);
        this.sendMessageToPatient(visit, operation);
    }

    _updateTrialParticipant() {
        this.model.tp.visits = this.model.visits;
        this.TrialParticipantRepository.updateAsync(this.model.tp.uid, this.model.tp);
    }

    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }

    _attachHandlerDetails() {
        this.onTagEvent('viewConsent', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            this.navigateToPageTag('econsent-sign', {
                trialSSI: model.trialSSI,
                econsentSSI: model.consentSSI,
                controlsShouldBeVisible: false
            });
        });
    }

    _attachHandlerSetDate() {
        this.onTagEvent('procedure:setDate', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'set-procedure-date',
                (event) => {
                    let date = new Date(event.detail);
                    model.date = event.detail;
                    model.toShowDate = DateTimeService.convertStringToLocaleDateTimeString(date);
                    this._updateVisit(model);
                    this._updateTrialParticipantVisit(model, Constants.MESSAGES.HCO.COMMUNICATION.TYPE.SCHEDULE_VISIT);
                },
                (event) => {
                    const response = event.detail;
                }
            ),
                {
                    controller: 'SetProcedureDateController',
                    disableExpanding: false,
                    disableBackdropClosing: false
                };
        });
    }

    _attachHandlerEditDate() {
        this.onTagEvent('procedure:editDate', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'set-procedure-date',
                (event) => {
                    let visitIndex = model.tp.visits.findIndex(v => v.pk === model.existingVisit.pk)
                    let date = new Date(event.detail);
                    model.date = event.detail;
                    model.tp.visits[visitIndex].date = event.detail;
                    model.tp.visits[visitIndex].toShowDate = DateTimeService.convertStringToLocaleDateTimeString(date);
                    this.model.existingVisit.toShowDate = DateTimeService.convertStringToLocaleDateTimeString(date);
                    this.model.visit = model.tp.visits[visitIndex];
                    this.TrialParticipantRepository.updateAsync(model.tpUid, model.tp);
                    this.VisitsAndProceduresRepository.updateAsync(this.model.visit.pk, this.model.visit);
                    this.sendMessageToPatient(model.tp.visits[visitIndex], Constants.MESSAGES.HCO.COMMUNICATION.TYPE.UPDATE_VISIT);
                },
                (event) => {
                    const response = event.detail;
                }
            ),
                {
                    controller: 'SetProcedureDateController',
                    disableExpanding: false,
                    disableBackdropClosing: false
                };
        });
    }

    _updateVisit(visit) {
        let objIndex = this.model.visits.findIndex((obj => obj.uid == visit.uid));
        this.model.visits[objIndex] = visit;
        let toBeChangedVisits = this.model.visits.filter(v => v.id === visit.id);
        toBeChangedVisits.forEach(v => {
            let auxV = {
                ...v,
                accepted: v.accepted,
                declined: v.declined,
                confirmed: v.confirmed
            }
            this.VisitsAndProceduresRepository.updateAsync(v.pk, auxV);
        })

    }

    sendMessageToPatient(visit, operation) {
        this.CommunicationService.sendMessage(CommunicationService.identities.ECO.PATIENT_IDENTITY, {
            operation: operation,
            ssi: visit.trialSSI,
            useCaseSpecifics: {
                tpDid: this.model.tp.did,
                trialSSI: visit.trialSSI,

                visit: {
                    confirmed: visit.confirmed,
                    details: visit.details,
                    toRemember: visit.toRemember,
                    procedures: visit.procedures,
                    name: visit.name,
                    period: visit.period,
                    consentSSI: visit.consentSSI,
                    date: visit.date,
                    unit: visit.unit,
                    id: visit.id
                },
            },
            shortDescription: Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.SCHEDULE_VISIT,
        });
    }

    _attachHandlerConfirm() {
        this.onTagEvent('visit:confirm', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'confirmation-alert',
                (event) => {
                    const response = event.detail;
                    if (response) {
                        model.confirmed = true;
                        this._updateVisit(model);
                        this.sendMessageToSponsor(model);
                    }
                },
                (event) => {
                    const response = event.detail;
                },
                {
                    controller: 'ConfirmationAlertController',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    question: 'Are you sure you want to confirm this visit, The patient attended to visit ? ',
                    title: 'Confirm visit',
                });
        });
    }

    _attachHandlerEditVisit() {
        this.onTagEvent('visit:edit', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('visit-edit', {
                tpUid: this.model.tpUid,
                existingVisit: model
            });
        });
    }

    sendMessageToSponsor(visit) {
        const currentDate = new Date();
        let sendObject = {
            operation: Constants.MESSAGES.HCO.COMMUNICATION.TYPE.VISIT_CONFIRMED,
            ssi: this.model.econsentSSI,
            useCaseSpecifics: {
                trialSSI: visit.trialSSI,
                tpNumber: this.model.tp.number,
                tpDid: this.model.tp.did,

                visit: {
                    id: visit.id,
                    date: DateTimeService.getCurrentDateAsISOString(),
                    toShowDate: currentDate.toLocaleDateString(),
                },
            },
            shortDescription: Constants.MESSAGES.HCO.COMMUNICATION.SPONSOR.VISIT_CONFIRMED,
        };
        this.CommunicationService.sendMessage(CommunicationService.identities.ECO.SPONSOR_IDENTITY, sendObject);
    }

}
