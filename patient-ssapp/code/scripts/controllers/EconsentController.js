import TrialDataService from "./services/TrialDataService.js";
// import EconsentService from "../services/EconsentService.js";

const {WebcController} = WebCardinal.controllers;

export default class EconsentController extends WebcController {
    constructor(element, history) {
        super(element, history);

        debugger;
        this.setModel({
            econsentTA: {

                name: "econsent",
                required: true,
                value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum'
            }
        });


        this.TrialDataService = new TrialDataService(this.DSUStorage);
       // this.EconsentService = new EconsentService(this.DSUStorage);

        // let receivedData = this.History.getState();
        // this.TrialDataService.getEconsent(receivedData.trialId,receivedData.econsentId, (err, data) => {
        //     debugger
        //     if (err) {
        //         return console.log(err);
        //     }
        //     this.model.econsent = data;
        // })
        this.TrialDataService.getEconsent(1, 1, (err, data) => {

            if (err) {
                return console.log(err);
            }
            this.model.econsent = data;
        })


        this.on('econsent:versions', (event) => {
            console.log('econsent:versions')
        })

        this.on('econsent:question', (event) => {
            console.log('econsent:question')
        })

        this.on('econsent:withdraw', (event) => {
            this.showModal('withdrawEconsent', {}, (err, response) => {
                if (err) {
                    return console.log(err);
                }
                console.log('withdrawEconsent', response)
                if (response) {
                    this.model.econsent.signed = false;
                }
                this.EconsentService.saveEconsent(this.model.econsent, (err, response) => {
                    if (err) {
                        return console.log(err);
                    }

                })
            });
        })

        this.onTagClick('econsent:read', (model, target, event) => {
                this.navigateToPageTag('sign-econsent')
            }
        )
    }

}