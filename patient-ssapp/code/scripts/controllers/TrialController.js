import Constants from "./Constants.js";
import TrialService from "../services/TrialService.js";
import EconsentService from "../services/EconsentService.js";
const {WebcController} = WebCardinal.controllers;

export default class TrialController extends WebcController {

    trialStatus = {
        first: {
            name: 'First',
            color: '#00cc00',
            value: 1,
            background: ''
        },
        second: {
            name: 'Second',
            color: '#00cc00',
            value: 2,
            background: ''
        },
        third: {
            name: 'Third',
            color: '#00cc00',
            value: 3,
            background: ''
        },
        fourth: {
            name: 'Forth',
            color: '#00cc00',
            value: 4,
            background: ''
        },
        Completed: {
            name: 'Completed',
            color: '#00cc00',
            value: 5,
            background: ''
        },

    }

    tpStatus = {
        entered: {
            name: 'Entered',
            valueNumber: 1,
            details: 'Main Consent Signed',
            isSet :false,
        },
        enrolled: {
            name: 'Enrolled',
            valueNumber: 2,
            details: 'Tp Seem eligible for the trial',
            isSet :false,

        },
        completed: {
            name: 'Completed',
            valueNumber: 3,
            details: 'Tp has completed the planed treatment',
            isSet :false,
        },

    }
    constructor(element, history) {
        super(element, history);

        this.setModel({});

        this.model.trial = {};
        this.model.econsents = [];
        this.model.signed = false;
        this.model.declined= false;

       let receivedObject = this.history.win.history.state.state
        this.model.keyssi = receivedObject.trialSSI;
        this.model.tpNumber = receivedObject.tpNumber;
        this._initServices(this.DSUStorage);
        this._initTrial();
        this._initHandlers();
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.EconsentService = new EconsentService(this.DSUStorage);
    }

    _initHandlers() {
        this._attachHandlerConsentClick();
        this._attachHandlerSiteClick();
    }

    _initTrial() {
        this.TrialService.getTrial(this.model.keyssi, (err, trial) => {
            if (err) {
                return console.log(err);
            }
            debugger
            this.model.trial = trial;
            this.model.tpEconsents = [];
            this.model.trial.color = Constants.getColorByTrialStatus(this.model.trial.status);
            this.TrialService.getEconsents(trial.keySSI, (err, data) => {
                if (err) {
                    return console.log(err);
                }
                this.model.econsents =[];
                this.model.econsents.push(...data);
                this.EconsentService.getEconsents((err, data) => {
                    if (err) {
                        return console.error(err);
                    }
                    this.model.tpEconsents.push(...data.econsents);
                    let ec = this.model.tpEconsents.find(ec => ec.id == this.model.econsents[0].id);
                    if (ec) {
                        this.model.econsents[0].signed =this.model.tpEconsents[this.model.tpEconsents.length-1].signed;
                        this.model.signed = this.model.tpEconsents[this.model.tpEconsents.length-1].signed;
                        this.model.econsents[0].declined = this.model.tpEconsents[this.model.tpEconsents.length-1].declined;
                        this.model.declined = this.model.tpEconsents[this.model.tpEconsents.length-1].declined;
                    }
                })
                console.log(data.econsents);
            })
        });
    }

    _attachHandlerConsentClick() {

        this.onTagEvent('go-to-econsent', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                debugger
                this.navigateToPageTag('econsent', {
                    tpNumber: this.model.tpNumber,
                    trialuid: this.model.keyssi,
                    ecoId: target.attributes['data'].value
                });
            }
        )
    }

    _attachHandlerSiteClick (){
        this.on('go-to-site', (event) => {
            this.navigateToPageByTag('site', event.data);
        })
    }

}