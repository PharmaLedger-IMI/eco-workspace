import VisitsAndProceduresRepository from "../repositories/VisitsAndProceduresRepository.js";
import TrialParticipantRepository from '../repositories/TrialParticipantRepository.js';
import DateTimeService from '../services/DateTimeService.js';

import CommunicationService from "../services/CommunicationService.js";
import Constants from "../utils/Constants.js";
import TrialService from "../services/TrialService.js";

const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        details: {
            name: "details",
            placeholder: "Details"
        },
        toRemember: {
            name: "toRemember",
            placeholder: "To Remember"
        },
        procedures: {
            name: "procedures",
            placeholder: "Procedures"
        },
    };
};

export default class VisitEditController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({
            ...getInitModel(),
            ...this.history.win.history.state.state,
        });

        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initVisit();
    }

    _initHandlers() {
        this._attachHandlerBack();
        this._attachHandlerEditDate();
        this._attachHandlerSaveDetails();
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.VisitsAndProceduresRepository = VisitsAndProceduresRepository.getInstance(DSUStorage);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
    }

    async _initVisit() {
        this.model.visit = await this.VisitsAndProceduresRepository.findByAsync(this.model.existingVisit.pk);

        this.model.details.value = this._getTextOrDefault(this.model.visit.details);
        this.model.toRemember.value = this._getTextOrDefault(this.model.visit.toRemember);
        this.model.procedures.value = this._getTextOrDefault(this.model.visit.procedures);

        this.TrialParticipantRepository.findBy(this.model.tpUid, (err, tp) => {
            if (err) {
                return console.log(err);
            }
            this.model.tp = {
                ...tp,
                visit: this.model.visit
            };
        });
    }

    _getTextOrDefault(text) {
        if (text === undefined) {
            return 'General details and description of the trial in case it provided by the Sponsor/Site regarding specific particularities of the Trial or general message for Trial Subject';
        }
        return text;
    }

    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
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

    _attachHandlerSaveDetails() {
        this.onTagEvent('save', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            let visitIndex = model.tp.visits.findIndex(v => v.pk === model.existingVisit.pk)
            model.tp.visits[visitIndex].details = this.model.details.value;
            model.tp.visits[visitIndex].toRemember = this.model.toRemember.value;
            model.tp.visits[visitIndex].procedures = this.model.procedures.value;
            this.TrialParticipantRepository.updateAsync(model.tpUid, model.tp);
            this.VisitsAndProceduresRepository.updateAsync(model.tp.visits[visitIndex].pk, model.tp.visits[visitIndex]);
            this.sendMessageToPatient(model.tp.visits[visitIndex], Constants.MESSAGES.HCO.COMMUNICATION.TYPE.UPDATE_VISIT);
        });
    }

    sendMessageToPatient(visit, operation) {
        this.CommunicationService.sendMessage(CommunicationService.identities.ECO.PATIENT_IDENTITY, {
            operation: operation,
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
                    id: visit.id
                },
            },
            shortDescription: Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.SCHEDULE_VISIT,
        });
    }

}
