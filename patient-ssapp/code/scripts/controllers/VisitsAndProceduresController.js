

const {WebcController} = WebCardinal.controllers;

const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const DateTimeService = ecoServices.DateTimeService;
const Constants = ecoServices.Constants;
const BaseRepository = ecoServices.BaseRepository;

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
            selectedVisit: {
                active: false,
                details: 'General details and description of the trial in case it provided by the Sponsor/Site regarding specific particularities of the Trial or general message for Trial Subject',
                toRemember: 'General details and description of the trial in case it provided by the Sponsor/Site regarding specific particularities of the Trial or general message for Trial Subject',
                procedures: 'General details and description of the trial in case it provided by the Sponsor/Site regarding specific particularities of the Trial or general message for Trial Subject',
            }
        });
        // TODO: Change mock data from details, toRemember and procedures.
        this._initServices();
        this._initHandlers();
        this._initVisits();
    }

    _initHandlers() {
        this._attachHandlerBack();
        this._attachHandlerDetails();
        this._attachHandlerAcceptVisit();
        this._attachHandlerChangeSelectedVisit();
        this._attachHandlerDecline();
        this._attachHandlerConfirm();
        this._attachHandlerViewProcedures();
    }

    _initServices() {
        this.VisitsAndProceduresRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.VISITS);
        this.TrialParticipantRepository =  BaseRepository.getInstance(BaseRepository.identities.PATIENT.TRIAL_PARTICIPANT);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
    }

    async _initVisits() {
        this.model.visits = (await this.VisitsAndProceduresRepository.findAllAsync())
            .map(visit => {
                return {
                    ...visit,
                    toShowDate: DateTimeService.convertStringToLocaleDate(visit.date)
                }
            });

        if (this.model.visits && this.model.visits.length > 0) {
            let tps = await this.TrialParticipantRepository.findAllAsync();
            this.model.tp = tps[tps.length-1];
        }
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
    _attachHandlerViewProcedures() {
        this.onTagEvent('procedures:view', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            this.navigateToPageTag('procedures-view', {
                procedures: model.visits.filter(visit => visit.id === model.selectedVisit.model.id),
            });

        });
    }

    _attachHandlerDecline() {
        this.onTagEvent('visit:decline', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'confirmation-alert',
                (event) => {
                    const response = event.detail;
                    if (response) {
                        model.accepted = false;
                        model.declined = true;
                        this._updateVisit(model);
                        this.sendMessageToHCO(model, Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.VISIT_DECLINED);
                    }
                },
                (event) => {
                    const response = event.detail;
                },
                {
                    controller: 'ConfirmationAlertController',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    question: 'Are you sure you want to decline this visit? ',
                    title: 'Decline visit',
                });
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
                        model.accepted = true;
                        model.declined = false;
                        this._updateVisit(model);
                        this.sendMessageToHCO(model, Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.VISIT_ACCEPTED);
                    }
                },
                (event) => {
                    const response = event.detail;
                },
                {
                    controller: 'ConfirmationAlertController',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    question: 'Are you sure you want to confirm this visit? ',
                    title: 'Accept visit',
                });
        });
    }

    _attachHandlerChangeSelectedVisit() {
        this.onTagEvent('accept-or-decline-visit', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'visit-accept-or-decline',
                (event) => {
                    let accepted = event.detail.accepted;
                    model = this.model.selectedVisit.model;
                    let status = accepted ? 'Accepted' : 'Declined';
                    model = {
                        ...model,
                        accepted: accepted,
                        declined: !accepted,
                        status: status
                    }
                    this.model.selectedVisit.model = model;
                    this._updateVisit(model);
                    if(accepted) {
                        return this.sendMessageToHCO(model, Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.VISIT_ACCEPTED);
                    }
                    this.sendMessageToHCO(model, Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.VISIT_DECLINED);
                },
                (event) => {
                }
            ),
                {
                    controller: 'VisitAcceptOrDeclineController',
                    disableExpanding: false,
                    disableBackdropClosing: false
                };
        });
    }

    _attachHandlerAcceptVisit() {
        this.onTagEvent('go-to-visit', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.model.selectedVisit.active = true;
            this.model.selectedVisit.model = model;
        });
    }

    _updateVisit(visit) {
        let objIndex = this.model.visits.findIndex((obj => obj.pk == visit.pk));
        this.model.visits[objIndex] = visit;
        this.VisitsAndProceduresRepository.updateAsync(visit.pk, visit);
    }

    sendMessageToHCO(visit, message) {
        this.CommunicationService.sendMessage(this.model.tp.hcoIdentity, {
            operation: Constants.MESSAGES.HCO.COMMUNICATION.TYPE.VISIT_RESPONSE,
            ssi: visit.trialSSI,
            useCaseSpecifics: {
                tpDid: this.model.tp.did,
                trialSSI: visit.trialSSI,
                visit: {
                    details: visit.details,
                    toRemember: visit.toRemember,
                    procedures: visit.procedures,
                    name: visit.name,
                    period: visit.period,
                    consentSSI: visit.consentSSI,
                    date: visit.date,
                    unit: visit.unit,
                    accepted: visit.accepted,
                    declined: visit.declined,
                    id: visit.uid
                },
            },
            shortDescription: message,
        });
    }

}
