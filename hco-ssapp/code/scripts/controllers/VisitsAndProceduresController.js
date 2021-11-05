import TrialService from "../services/TrialService.js";
import SiteService from "../services/SiteService.js";
import HCOService from "../services/HCOService.js";

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
            visits: [],
            generalVisits: []
        });

        this._initServices();
    }

    _initHandlers() {
        this._attachHandlerBack();
        this._attachHandlerDetails();
        this._attachHandlerSetDate();
        this._attachHandlerConfirm();
        this._attachHandlerEditDate();
        this._attachHandlerEditVisit();
        this._attachHandlerProcedures();
    }

    async _initServices() {
        this.TrialService = new TrialService();
        this.VisitsAndProceduresRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.VISITS);
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.TRIAL_PARTICIPANTS);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
        this.SiteService = new SiteService();
        this.HCOService = new HCOService();
        this.model.hcoDSU = await this.HCOService.getOrCreateAsync();
        this._initHandlers();
        this._initSite();
        this._initVisits();
    }

    async _initVisits() {
        this.model.visits = this.model.hcoDSU.volatile.visit[0].visits.visits
        this._extractDataVisit();
        this._matchTpVisits();
    }

    _extractDataVisit() {

        if (this.model.visits) {
            this.model.visits.forEach(visit => {

                let weaksFrom = visit.weeks?.filter(weak => weak.type === 'weekFrom' || weak.type === 'week');
                if (weaksFrom)
                    visit.weakFrom = weaksFrom[0]?.value;
                let weaksTo = visit.weeks?.filter(weak => weak.type === 'weekTo');
                if (weaksTo)
                    visit.weakTo = weaksTo[0]?.value;

                let plus = visit.visitWindow?.filter(weak => weak.type === 'windowFrom');
                if (plus)
                    visit.plus = plus[0]?.value;
                let minus = visit.visitWindow?.filter(weak => weak.type === 'windowTo');
                if (plus)
                    visit.minus = minus[0]?.value;
            });

        }
    }

    async _matchTpVisits() {
        if (this.model.visits && this.model.visits.length > 0) {
            let tpIndex = this.model.hcoDSU.volatile.tps.findIndex(tp => tp.uid === this.model.tpUid)
            if (tpIndex === undefined) {
                return;
            }
            this.model.tp = this.model.hcoDSU.volatile.tps[tpIndex];
            if (!this.model.tp.visits || this.model.tp.visits.length < 1) {
                this.model.tp.visits = this.model.visits;
                this.HCOService.updateEntity(this.model.tp, {}, async (err, data) => {
                    this.model.hcoDSU = await this.HCOService.getOrCreateAsync();
                })
                return;
            } else {
                this.model.visits.forEach(visit => {

                    let visitTp = this.model.tp.visits.filter(v => v.uuid === visit.uuid)[0];
                    if (visitTp !== undefined) {
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
                    }
                })
            }
        }
    }

    async _updateTrialParticipantVisit(visit, operation) {
        if (!this.model.tp.visits) {
            this.model.tp.visits = this.visits;
        }

        let objIndex = this.model.tp.visits.findIndex((obj => obj.uuid == visit.uuid));
        this.model.tp.visits[objIndex] = visit;
        this.model.visits = this.model.tp.visits;
        let v = this.model.hcoDSU.volatile.visit[0];
        v.visits.visits = this.model.tp.visits;

        this.HCOService.updateEntity(v, {}, async (err, data) => {
            this.model.hcoDSU = await this.HCOService.getOrCreateAsync();
            let tpIndex = this.model.hcoDSU.volatile.tps.findIndex(tp => tp.uid === this.model.tpUid)
            this.model.tp = this.model.hcoDSU.volatile.tps[tpIndex];
            this.HCOService.updateEntity(this.model.tp, {}, async (err, data) => {
                this.model.hcoDSU = await this.HCOService.getOrCreateAsync();
                this.sendMessageToPatient(visit, operation);
            })
        })
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

    async _updateTrialParticipantRepository(uid, tp) {
        await this.TrialParticipantRepository.updateAsync(uid, tp);
    }

    _attachHandlerEditDate() {
        this.onTagEvent('procedure:editDate', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'set-procedure-date',
                (event) => {
                    let visitIndex = this.model.tp.visits.findIndex(v => v.pk === model.pk)
                    let date = new Date(event.detail);
                    this.model.tp.visits[visitIndex].date = event.detail;
                    this.model.tp.visits[visitIndex].toShowDate = DateTimeService.convertStringToLocaleDateTimeString(date);
                    // this.model.existingVisit.toShowDate = DateTimeService.convertStringToLocaleDateTimeString(date);
                    // this.model.visit = model.tp.visits[visitIndex];
                    this._updateTrialParticipantRepository(this.model.tp.uid, this.model.tp)
                    this.model.visits = this.model.tp.visits;
                    let v = this.model.hcoDSU.volatile.visit[0];
                    v.visits.visits = this.model.tp.visits;
                    this.HCOService.updateEntity(v, {}, async (err, data) => {
                        this.model.hcoDSU = await this.HCOService.getOrCreateAsync();
                    });
                    this.sendMessageToPatient(this.model.tp.visits[visitIndex], Constants.MESSAGES.HCO.COMMUNICATION.TYPE.UPDATE_VISIT);
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
        let objIndex = this.model.visits.findIndex((obj => obj.keySSI == visit.keySSI));
        this.model.visits[objIndex] = visit;
        let toBeChangedVisits = this.model.visits.filter(v => v.keySSI === visit.keySSI);
        toBeChangedVisits.forEach(v => {
            let auxV = {
                ...v,
                accepted: v.accepted,
                declined: v.declined,
                confirmed: v.confirmed
            }
            this._updateVisitRepository(v.pk, auxV)
        })
    }

    sendMessageToPatient(visit, operation) {
        this.CommunicationService.sendMessage(this.model.tp.did, {
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
                    uid: visit.uuid,
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
                        let visitIndex = this.model.tp.visits.findIndex(v => v.pk === model.pk);
                        this.model.tp.visits[visitIndex].confirmed = true;
                        this.HCOService.updateEntity(this.model.tp, {}, async (err, data) => {
                            this.model.hcoDSU = await this.HCOService.getOrCreateAsync();
                            this.model.visits = this.model.tp.visits;
                            this.sendMessageToSponsor(model);
                        })
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

    async _initSite() {
        this.model.site = this.model.hcoDSU.volatile.site[0];
    }

    _attachHandlerProcedures() {
        this.onTagEvent('visit:view', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('visits-details-procedures', {
                tpUid: this.model.tpUid,
                visitUuid: model.uuid
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
        this.CommunicationService.sendMessage(this.model.site.sponsorIdentity, sendObject);
    }

}
