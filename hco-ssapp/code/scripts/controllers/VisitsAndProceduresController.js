import NotificationsRepository from "../repositories/VisitsAndProceduresRepository.js";

const {WebcController} = WebCardinal.controllers;
import VisitsAndProceduresRepository from "../repositories/VisitsAndProceduresRepository.js";
import TrialParticipantRepository from '../repositories/TrialParticipantRepository.js';
import DateTimeService from '../services/DateTimeService.js';

import CommunicationService from "../services/CommunicationService.js";
import Constants from "../utils/Constants.js";

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
    }

    _initServices(DSUStorage) {
        this.VisitsAndProceduresRepository = VisitsAndProceduresRepository.getInstance(DSUStorage);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
    }

    async _initVisits() {

        this.model.visits = await this.VisitsAndProceduresRepository.findAllAsync();
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
                    visit.date = visitTp.date;
                })
            }
        }

    }

    _updateTrialParticipantVisit(visit) {
        if (!this.model.tp.visits)
            this.model.tp.visits = this.visits;

        let objIndex = this.model.tp.visits.findIndex((obj => obj.uid == visit.uid));
        this.model.tp.visits[objIndex] = visit;
        this.TrialParticipantRepository.updateAsync(this.model.tp.uid, this.model.tp);
        this.sendMessageToPatient(visit);
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

                    let date = new Date();
                    date.setTime(event.detail);
                    model.date = date.toISOString(),
                        this._updateVisit(model);
                    this._updateTrialParticipantVisit(model);
                },
                (event) => {
                    const response = event.detail;
                }
            ),
                {
                    controller: 'SetProcedureDateController',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    title: 'Set Procedure Date',
                };
        });
    }

    _updateVisit(visit) {
        let objIndex = this.model.visits.findIndex((obj => obj.uid == visit.uid));
        this.model.visits[objIndex] = visit;
    }

    sendMessageToPatient(visit) {

        this.CommunicationService.sendMessage(CommunicationService.identities.ECO.PATIENT_IDENTITY, {
            operation: Constants.MESSAGES.HCO.COMMUNICATION.TYPE.SCHEDULE_VISIT,
            ssi: visit.trialSSI,
            useCaseSpecifics: {
                tpDid: this.model.tp.did,
                trialSSI: visit.trialSSI,

                visit: {
                    name: visit.name,
                    period: visit.period,
                    consentSSI: visit.consentSSI,
                    date: visit.date,
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
                        model.confirmed =true;
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
