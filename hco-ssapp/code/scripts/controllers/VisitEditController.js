import VisitsAndProceduresRepository from "../repositories/VisitsAndProceduresRepository.js";
import TrialParticipantRepository from '../repositories/TrialParticipantRepository.js';

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
        }
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
        this._attachHandlerViewProcedures();
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

    _attachHandlerViewProcedures() {
        this.onTagEvent('procedures:view', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('procedures-view', {
                visitId: model.visit.id
            });
        });
    }

    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
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
            window.history.back();
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
