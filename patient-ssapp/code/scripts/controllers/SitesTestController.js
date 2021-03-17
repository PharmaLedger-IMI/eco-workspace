import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';
import EDiaryService from "./services/EDiaryService.js";
import TrialDataService from "./services/TrialDataService.js";

const initModel = {}

export default class SitesTestController extends ContainerController {
    constructor(element, history) {
        super(element, history);
        this.setModel({});
        this.DummyDataService = new TrialDataService(this.DSUStorage);
        this.DummyDataService.getSites((err, data) => {
            if (err) {
                console.log(err);
                return;
            }
            this.model.sites = JSON.parse(JSON.stringify(data));
        });

        this._attachHandlerSiteDetails();
    }

    _attachHandlerSiteDetails() {
        this.on('sites:details', (event) => {
            this.History.navigateToPageByTag('site', event.data);
        });
    }

}
