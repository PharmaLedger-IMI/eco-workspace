import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';
import TrialDataService from "./services/TrialDataService.js";

export default class TrialController extends ContainerController {
    constructor(element, history) {
        super(element, history);

        this.setModel({});
        let receivedParam = this.History.getState();

        this.TrialDataService = new TrialDataService(this.DSUStorage);
        this.TrialDataService.getTrial(receivedParam, (err, data) => {
            if (err) {
                return console.log(err);
            }
            this.model.trial = data;
            console.log(data);
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