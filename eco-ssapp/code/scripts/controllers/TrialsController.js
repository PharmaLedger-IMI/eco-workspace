import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';
import TrialService from "../services/TrialService.js";
import EconsentService from "../services/EconsentService.js";


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
    },
    filesChooser: {
        label: "Select files",

        listFiles: true,
        filesAppend: true,
        files: []
    },
    site: {
        name: 'site',
        label: 'Site',
        required: true,
        placeholder: 'Site',
        value: ''
    },

    hcp: {
        name: 'hcp',
        label: 'hcp',
        required: true,
        placeholder: 'Hcp',
        value: ''
    },

}

export default class TrialsController extends ContainerController {

    uid='';
    file= undefined;

    constructor(element, history) {
        super(element, history);

        this.setModel(JSON.parse(JSON.stringify(initModel)));

        this._attachHandlerTrialCreate();
        this._attachHandlerChooseEconsent();

        this.TrialService = new TrialService(this.DSUStorage);
        // this.TrialService.getTrial((err, data) => {
        //     if (err) {
        //         console.log(err);
        //         return;
        //     }
        //     //bind
        //     this.setModel(data);
        // });
        this.EconsentService = new EconsentService(this.DSUStorage);

        this.on('openFeedback', (evt) => {
            this.feedbackEmitter = evt.detail;
        });
    }



    _attachHandlerTrialCreate (){
        this.on('trial:create', (event) => {

            if(this.__displayErrorMessages(event)){
                return;
            }
            let trialObject = {
                name: this.model.name.value,
                consentName: this.model.consentName.value,
                version: this.model.version.value,
                status: this.model.status.value,
            }

            this.TrialService.saveTrial( trialObject,(err, updTrial) => {
                debugger;
                if (err) {
                    debugger;
                    console.log(err);
                    return;
                }
                debugger;
                console.log("Trial saved" +updTrial.uid);
                this.uid = updTrial.uid;

                this.__saveEconsentFile();
            });
        });
    }


    _attachHandlerChooseEconsent (){
        this.on('trial:addEconsent', (event) => {

        debugger
        if (event.data)
            this.file= event.data;

        });
    }

    __saveEconsentFile (){
        this.EconsentService.saveEconsent( this.uid, this.file ,(err, updTrial) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log("Trial updated" +updTrial.uid);
            this.uid = updTrial.uid;
        });
    }

    __displayErrorMessages = (event) => {

        return this.__displayErrorRequiredField(event, 'name', this.model.name.value) ||
            this.__displayErrorRequiredField(event, 'version', this.model.version.value) ||
              this.__displayErrorRequiredField(event, 'consentName', this.model.consentName.value) ;
    }

    __displayErrorRequiredField(event, fieldName, field) {
        if (field === undefined || field === null || field.length === 0) {
            this._emitFeedback(event, fieldName.toUpperCase() + " field is required.", "alert-danger")
            return true;
        }
        return false;
    }

    _emitFeedback(event, message, alertType) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, "Validation", alertType)
        }
    }

}
