import TrialService from "./services/TrialService.js";
import TrialParticipantsService from "./services/TrialParticipantsService.js";
import CommunicationService from "../services/CommunicationService.js";
import DateTimeService from "./services/DateTimeService.js";

const {WebcController} = WebCardinal.controllers;

export default class EconsentVersionsController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.TrialService = new TrialService(this.DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(this.DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);

        this.setModel(
            {
                econsent: {},
                versions: [],
                ...this.history.win.history.state.state
            });

        this.initConsent();
        this._attachHandlerEconsentSign();

        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    initConsent() {
        this.TrialService.getEconsent(this.model.trialSSI, this.model.econsentSSI, (err, data) => {
            debugger
            if (err) {
                return console.log(err);
            }
            this.model.econsent = {
                ...data,
                versionDateAsString: DateTimeService.convertStringToLocaleDate(data.versionDate)
            };

            let econsentVersion = {
                ...data,
                tpSigned: false,
                tpApproval: 'Not yet',
                tpCaregiveApproval: 'Not yet',
                hcpApproval: 'Not yet'
            };

            if (data.patientSigned) {
                econsentVersion = {
                    ...data,
                    tpSigned: true,
                    tpApproval: 'See approval',
                    tpCaregiveApproval: 'See approval',
                    hcpApproval: 'Signature Required'
                };
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
                    econsentSSI: this.model.econsentSSI
                });
            }
        )
    }

    showFeedbackToast(title, message, alertType) {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }
}