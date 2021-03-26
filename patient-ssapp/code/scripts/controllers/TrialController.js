import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';
import TrialDataService from "./services/TrialDataService.js";

import Constants from "./Constants.js";

export default class TrialController extends ContainerController {
    constructor(element, history) {
        super(element, history);

        this.setModel({});
        let receivedParam = this.History.getState();

        debugger;
        this.TrialDataService = new TrialDataService(this.DSUStorage);
        this.TrialDataService.getTrial(receivedParam, (err, data) => {
            if (err) {
                return console.log(err);
            }

            this.model.trial = data;
            this.model.trial.color = Constants.getColorByTrialStatus(this.model.trial.status);
            this.model.trial.status = '  TP STATUS: ' + this.model.trial.status;

        })

        this.on('go-to-site', (event) => {
            this.History.navigateToPageByTag('site', event.data);
        })

        this.on('go-to-econsent', (event) => {
            debugger;
            this.History.navigateToPageByTag('econsent', {trialId: receivedParam, econsentId: event.data});
        })

    }

}