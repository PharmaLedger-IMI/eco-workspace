import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';
import EDiaryService from "./services/EDiaryService.js";
import TrialDataService from "./services/TrialDataService.js";

const initModel = {}

export default class SiteController extends ContainerController {
    constructor(element, history) {
        super(element, history);
        this.setModel({});
        let receivedParam = this.History.getState();
        this.TrialDataService = new TrialDataService(this.DSUStorage);
        this.TrialDataService.getSite(receivedParam,(err, data) => {
            if (err) {
                console.log(err);
                return;
            }
            this.model.site = JSON.parse(JSON.stringify(data));
        });
    }

}