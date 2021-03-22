import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';
import TrialDataService from "./services/TrialDataService.js";

export default class EconsentController extends ContainerController {
    constructor(element, history) {
        super(element, history);

        this.setModel({});
        let receivedParam = this.History.getState();

        this.TrialDataService = new TrialDataService(this.DSUStorage);
        this.TrialDataService.getEconsent(receivedParam, (err, data) => {
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
            });
        })
    }

}