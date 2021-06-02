import TrialService from '../services/TrialService.js';
import EconsentsStatusRepository from "../repositories/EconsentsStatusRepository.js";

const { WebcController } = WebCardinal.controllers;

export default class EconsentVersionsController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({});
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this.model.econsent = {};
        this.model.historyData = this.history.win.history.state.state;
        this.model.status = { actions: [] };
        this.model.versions = [];
        this._initEconsent();
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.EconsentsStatusRepository = EconsentsStatusRepository.getInstance(DSUStorage);
    }

    _initHandlers() {
        this._attachHandlerClose();
    }

    _initEconsent() {
        this.TrialService.getEconsent(this.model.historyData.trialuid, this.model.historyData.ecoId, (err, econsent) => {
            if (err) {
                return console.log(err);
            }
            this.model.econsent = econsent;
            this.model.versions = econsent.versions;
            debugger;
         });
    }

    _attachHandlerClose() {
        this.onTagClick('close', (model, target, event) => {


        });
    }

}
