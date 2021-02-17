import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';
import TrialService from "./services/TrialService.js";

const initModel = {
    title: 'Create Trial',
    name: {
        name: 'name',
        label: 'Trial Name',
        required: true,
        placeholder: 'Trial name',
        value: ''
    },
    consentName: {
        name: 'consentName',
        label: 'Consent Name',
        required: true,
        placeholder: 'Consent name',
        value: ''
    },
    version: {
        name: 'version',
        label: 'Version',
        required: true,
        placeholder: 'Version',
        value: ''
    },
    status: {
        name: "status",
        required: true,
        checkboxLabel: "status",
        checkedValue: 1,
        uncheckedValue: 0,
        value: ''
    }

}

export default class TrialsController extends ContainerController {
    constructor(element, history) {
        super(element, history);

        this.setModel(JSON.parse(JSON.stringify(initModel)));

        this._attachHandlerTrialCreate();

        this.TrialService = new TrialService(this.DSUStorage);
        this.TrialService.getTrial((err, data) => {
            if (err) {
                console.log(err);
                return;
            }
            //bind
            this.setModel(data);
        });
    }



    _attachHandlerTrialCreate (){
        this.on('trial:create', (event) => {

            let trialObject = {
                name: this.model.name.value,
                consentName: this.model.consentName.value,
                version: this.model.version.value,
                status: this.model.status.value,
            }

            this.TrialService.saveTrial( trialObject,(err, updTrial) => {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log("Trial saved" +updTrial.uid);
            
            });
        });
    }

}
