import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';
import EDiaryService from "./services/EDiaryService.js";
import DummyDataService from "./services/DummyDataService.js";

const initModel = {}

export default class SiteController extends ContainerController {
    constructor(element, history) {
        super(element, history);
        this.setModel({});
        let receivedParam = this.History.getState();
        this.DummyDataService = new DummyDataService(this.DSUStorage);
        console.log(receivedParam);
        this.DummyDataService.getSite(receivedParam,(err, data) => {
            if (err) {
                console.log(err);
                return;
            }
            this.model.site = JSON.parse(JSON.stringify(data));
        });


    }



}