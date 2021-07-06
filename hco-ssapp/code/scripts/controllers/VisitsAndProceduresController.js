import NotificationsRepository from "../repositories/VisitsAndProceduresRepository.js";

const {WebcController} = WebCardinal.controllers;
import VisitsAndProceduresRepository from "../repositories/VisitsAndProceduresRepository.js";

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
                trialSSI: this.history.win.history.state.state
            }
        )
        ;
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initVisits();
    }

    _initHandlers() {
        this._attachHandlerBack();
        this._attachHandlerDetails();
    }

    _initServices(DSUStorage) {
        this.VisitsAndProceduresRepository = VisitsAndProceduresRepository.getInstance(DSUStorage);
    }

    _initVisits() {

        this.VisitsAndProceduresRepository.findAll((err, data) => {

            if (err) {
                return console.log(err);
            }

            this.model.visits = data.filter(visit => visit.trialSSI === this.model.trialSSI);

        });
    }

    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }

    _attachHandlerDetails() {
        this.onTagEvent('goToAction', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();

        });
    }


}
