const {WebcController} = WebCardinal.controllers;
import TrialParticipantRepository from "../repositories/TrialParticipantRepository.js";

export default class SiteController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({});
        this._initServices(this.DSUStorage);
        this._initSite();
    }

    _initServices(DSUStorage) {
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
    }

    _initSite() {
        this.TrialParticipantRepository.findAll((err, data) => {
            if (err) {
                return console.log(err);
            }

            if (data && data.length > 0) {

                this.model.site = data [0]?.site;
            }
        });
    }

}
