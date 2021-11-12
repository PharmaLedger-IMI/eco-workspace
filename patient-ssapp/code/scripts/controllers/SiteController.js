const {WebcController} = WebCardinal.controllers;

const ecoServices = require('eco-services');
const BaseRepository = ecoServices.BaseRepository;

export default class SiteController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({});
        this._initServices();
        this._initSite();
    }

    _initServices() {
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.TRIAL_PARTICIPANT);
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
