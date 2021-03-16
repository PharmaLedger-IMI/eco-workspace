import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';
import EDiaryService from "./services/EDiaryService.js";
import DummyDataService from "./services/DummyDataService.js";

const initModel = {}

export default class SitesTestController extends ContainerController {
    constructor(element, history) {
        super(element, history);
        this.setModel({});
        this.DummyDataService = new DummyDataService(this.DSUStorage);
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
            const id = event.data;

            this.History.navigateToPageByTag('site', id);
            debugger;
            console.log("click on site");
        });
    }

}
