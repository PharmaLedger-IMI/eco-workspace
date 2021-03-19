import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';
import TrialDataService from "./services/TrialDataService.js";

export default class HomeController extends ContainerController {
    constructor(element, history) {
        super(element, history);

        this.setModel({});

        this.TrialDataService = new TrialDataService(this.DSUStorage);
        this.TrialDataService.getTrials((err, data) => {
            if(err) {
                return console.log(err);
            }
            this.model.trials = data;
        })

        this._attachHandlerTrialClick();
        this._attachHandlerEDiary();
        this._attachHandlerSites();
        this._attachHandlerNotifications();
    }

    _attachHandlerTrialClick(){
        this.on('home:trial-details', (event) => {
            this.History.navigateToPageByTag('trial', event.data);
        });
    }

    _attachHandlerEDiary(){
        this.on('home:ediary', (event) => {
            this.History.navigateToPageByTag('ediary');
        });
    }

    _attachHandlerSites(){
        this.on('home:sites', (event) => {
            this.History.navigateToPageByTag('sites');
        });
    }

    _attachHandlerNotifications(){
        this.on('home:notifications', (event) => {
            this.History.navigateToPageByTag('notifications');
        });
    }
}