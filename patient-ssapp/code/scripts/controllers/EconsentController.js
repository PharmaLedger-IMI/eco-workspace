import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';
import TrialDataService from "./services/TrialDataService.js";
import EconsentService from "../services/EconsentService.js";

export default class EconsentController extends ContainerController {
    constructor(element, history) {
        super(element, history);

        this.setModel({      econsentTA: {

                name: "econsent",
                required: true,
                value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum'
            }});
        let receivedData = this.History.getState();

        this.TrialDataService = new TrialDataService(this.DSUStorage);
        this.EconsentService = new EconsentService (this.DSUStorage);
        debugger;
        this.TrialDataService.getEconsent(receivedData.trialId,receivedData.econsentId, (err, data) => {
            debugger
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
                if(response){
                    this.model.econsent.signed = false;
                }
                this.EconsentService.saveEconsent(this.model.econsent,  (err, response) => {
                    if (err) {
                        return console.log(err);
                    }

                    })
            });
        })

        this.on('econsent:read', (event) => {
            this.showModal('readEconsent', {}, (err, response) => {
                if (err) {
                    return console.log(err);
                }

                if(response){
                    this.model.econsent.signed = true;
                }
            });
        })
    }

}