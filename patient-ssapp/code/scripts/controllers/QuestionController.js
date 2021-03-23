import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';
import TrialDataService from "./services/TrialDataService.js";

const initModel = {}

export default class QuestionController extends ContainerController {
    constructor(element, history) {
        super(element, history);
        this.setModel({});
        let receivedParam = this.History.getState();

        this.TrialDataService = new TrialDataService(this.DSUStorage);
    }

}