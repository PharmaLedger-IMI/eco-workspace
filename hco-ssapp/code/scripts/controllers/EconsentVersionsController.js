const {WebcController} = WebCardinal.controllers;
import TrialService from "../services/TrialService.js";
import TrialParticipantsService from "../services/TrialParticipantsService.js";
import CommunicationService from "../services/CommunicationService.js";
import DateTimeService from "../services/DateTimeService.js";

let getInitModel = () => {
    return {
        econsent: {},
        versions: [],
    }
}

export default class EconsentVersionsController extends WebcController {
    constructor(element, history) {
        super(element, history);
        this.setModel({
            ...getInitModel(),
            ...this.history.win.history.state.state
        });
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initConsent();
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);
    }

    _initHandlers() {
        this._attachHandlerEconsentSign();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    _initConsent() {
        this.TrialService.getEconsent(this.model.trialSSI, this.model.econsentSSI, (err, data) => {
            if (err) {
                return console.log(err);
            }
            this.model.econsent = {
                ...data,
                versionDateAsString: DateTimeService.convertStringToLocaleDate(data.versionDate)
            };
            let econsentVersion = {
                ...data,
                tpApproval: '-',
                tpCaregiveApproval: '-',
                hcpApproval: '-',
                hcpWithdraw: '-'
            };
            econsentVersion.tpSigned = false;
            data.actions.forEach(action => {
                switch (action.name) {
                    case 'sign': {
                        econsentVersion.tpSigned = true;
                        econsentVersion.tpApproval = action.toShowDate;
                        econsentVersion.hcpApproval = 'Required';
                        break;
                    }
                    case 'withdraw': {
                        econsentVersion.hcpWithdraw = "TP Withdraw";
                        break;
                    }
                    case 'withdraw-intention': {
                        econsentVersion.hcpApproval = 'Contact TP';
                        econsentVersion.hcpWithdraw = "Intention";
                        break
                    }
                }
            })
            if (data.hcoSign) {
                econsentVersion.hcpApproval = data.hcoSign.toShowDate;
                econsentVersion.tpSigned = false;
            }

            this.model.versions.push(econsentVersion);
        });
    }

    _attachHandlerEconsentSign() {
        this.onTagEvent('econsent:sign', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.navigateToPageTag('econsent-sign', {
                    trialSSI: this.model.trialSSI,
                    econsentSSI: this.model.econsentSSI,
                    tpUid: this.model.tpUid
                });
            }
        )
    }

    _showFeedbackToast(title, message, alertType) {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }
}