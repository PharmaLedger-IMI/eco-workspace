import TrialDataService from "./services/TrialDataService.js";
import CommunicationService from "./services/CommunicationService.js";
import TrialService from "./services/TrialService.js";
const {WebcController} = WebCardinal.controllers;
export default class HomeController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.setModel({});
        debugger;
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

        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.PATIENT_IDENTITY);
        this.CommunicationService.listenForMessages((err, data) => {

            if (err) {
                return console.error(err);
            }
            data = JSON.parse(data);
            console.log("data in patient "+ data);
            debugger;
            this.TrialService.mountTrial(data.message.ssi,(err, trial) => {
                if (err) {
                    return console.log(err);
                }
                this.model.trials.push(trial);
            });
        });

        this.TrialService = new TrialService(this.DSUStorage);
        // this.TrialService.getServiceModel((err, data) => {
        //     if(err) {
        //         return console.error(err);
        //     }
        //     this.model.trials = data.trials;
        // })


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