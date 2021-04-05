import TrialDataService from "./services/TrialDataService.js";
const {WebcController} = WebCardinal.controllers;
export default class HomeController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.setModel({});
        this.model.trials =[];

        this.TrialDataService = new TrialDataService(this.DSUStorage);
        this.TrialDataService.getTrials((err, data) => {
            if(err) {
                return console.log(err);
            }
            //this.model.trials = data;
            this.model.trials.push(...data);
        })

        this._attachHandlerTrialClick();
        this._attachHandlerEDiary();
        this._attachHandlerSites();
        this._attachHandlerNotifications();
    }

    _attachHandlerTrialClick(){

        this.onTagClick('home:trial-details', (model, target, event) => {
                    this.navigateToPageTag('trial')
            }
        )
    }

    _attachHandlerEDiary(){
        this.onTagClick('home:ediary', (event) => {
            this.navigateToPageTag('ediary');
        });
    }

    _attachHandlerSites(){
        this.onTagClick('home:site', (event) => {
            this.navigateToPageTag('site');
        });
    }

    _attachHandlerNotifications(){
        this.onTagClick('home:notifications', (event) => {
            this.navigateToPageTag('notifications');
        });
    }
}