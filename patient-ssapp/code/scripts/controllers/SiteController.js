import TrialDataService from "../services/TrialDataService.js";

const {WebcController} = WebCardinal.controllers;
export default class SiteController  extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.setModel({});
        // let receivedParam = this.History.getState();

        this.TrialDataService = new TrialDataService(this.DSUStorage);
        this.TrialDataService.getSite(1, (err, data) => {
            if(err) {
                return console.log(err);
            }
            this.model.site = data;
            console.log(data);
        })

    }


}