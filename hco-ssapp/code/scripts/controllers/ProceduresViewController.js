import VisitsAndProceduresRepository from "../repositories/VisitsAndProceduresRepository.js";
import TrialParticipantRepository from "../repositories/TrialParticipantRepository.js";

const {WebcController} = WebCardinal.controllers;

export default class ProceduresViewController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({
            procedures: [],
            toShowDate: 'DD/MM/YYYY',
            ...this.history.win.history.state.state,
        });

        this._initServices(this.DSUStorage);
        this._initProcedures();
        this._attachHandlerBack();
    }

    _initServices(DSUStorage) {
        this.VisitsAndProceduresRepository = VisitsAndProceduresRepository.getInstance(DSUStorage);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
    }

    async _initProcedures() {
        this.model.procedures = (await this.VisitsAndProceduresRepository.filterAsync(`id == ${this.model.visitId}`, 'ascending', 30));
        if (this.model.procedures.length > 0) {
            let relevantProcedures = this.model.procedures.filter(p => p.toShowDate);
            if (relevantProcedures) {
                this.model.toShowDate = relevantProcedures[0].toShowDate;
            }
        }
    }

    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }
}
