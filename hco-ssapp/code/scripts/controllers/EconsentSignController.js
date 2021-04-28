import TrialService from "./services/TrialService.js";
import TrialParticipantsService from "./services/TrialParticipantsService.js";
import CommunicationService from "../services/CommunicationService.js";
import DateTimeService from "./services/DateTimeService.js";
import FileDownloader from "../utils/FileDownloader.js";

const {WebcController} = WebCardinal.controllers;
const TEXT_MIME_TYPE = "text/";
export default class EconsentSignController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.TrialService = new TrialService(this.DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(this.DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);

        this.setModel({
            econsent: {},
            ...this.history.win.history.state.state
        });

        let econsentTA = {
            name: "econsent",
            required: true,
            value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum'
        }

        this.model.econsentTa = econsentTA;

        this.initConsent();
        this._attachHandlerEconsentSign();

        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    initConsent() {
        this.TrialService.getEconsent(this.model.trialSSI, this.model.econsentSSI, (err, econsent) => {
            debugger
            if (err) {
                return console.log(err);
            }
            this.model.econsent = {
                ...econsent,
                versionDateAsString: DateTimeService.convertStringToLocaleDate(econsent.versionDate)
            };
            this.fileDownloader = new FileDownloader(this.getEconsentFilePath(this.model.trialSSI, this.model.econsentSSI, econsent.attachment), econsent.attachment);

            this._downloadFile();
            console.log("File downloader" + this.fileDownloader);
            debugger
        });
    }



    getEconsentFilePath(trialSSI, consentSSI, fileName) {
        return "/trials/" + trialSSI + '/consent/' + consentSSI + '/consent/' + fileName;
    }

    _attachHandlerEconsentSign() {
        this.onTagEvent('econsent:sign', 'click', (model, target, event) => {
                debugger
                event.preventDefault();
                event.stopImmediatePropagation();
                this.sendMessageToSponsor('sign-econsent', 'HCO signed econsent');
            }
        )
    }

    showFeedbackToast(title, message, alertType) {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }

    sendMessageToSponsor(operation, shortMessage) {
        this.CommunicationService.sendMessage(CommunicationService.identities.SPONSOR_IDENTITY, {
            operation: operation,
            ssi: this.model.econsentSSI,
            useCaseSpecifics: {
                tpNumber: this.model.econsent.tpNumber,
                operationDate: (new Date()).toISOString(),
                trialSSI: this.model.trialSSI,
            },
            shortDescription: shortMessage,
        });
    }
    _downloadFile = () => {
        this.fileDownloader.downloadFile((downloadedFile) => {
            this.rawBlob = downloadedFile.rawBlob;
            this.mimeType = downloadedFile.contentType;
            this.blob = new Blob([this.rawBlob], {
                type: this.mimeType
            });


            if (this.mimeType.indexOf(TEXT_MIME_TYPE) !== -1) {
                this._prepareTextEditorViewModel();
            } else {
                this._displayFile();
            }
        });
    }

    _loadPdfOrTextFile = () => {
        this._loadBlob((base64Blob) => {
            const obj = document.createElement("object");
            obj.type = this.mimeType;
            obj.data = base64Blob;

            this._appendAsset(obj);
        });
    }

    _loadBlob = (callback) => {
        const reader = new FileReader();
        reader.readAsDataURL(this.blob);
        reader.onloadend = function () {
            callback(reader.result);
        }
    }

    _appendAsset = (assetObject) => {
        let content = this.element.querySelector(".content");

        if (content) {
            content.append(assetObject);
        }

        //this.feedbackController.setLoadingState(false);
    }

    _displayFile = () => {

        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            const file = new File([this.rawBlob], this.fileName);
            window.navigator.msSaveOrOpenBlob(file);
            this.feedbackController.setLoadingState(true);
            return;
        }

        window.URL = window.URL || window.webkitURL;
        const fileType = this.mimeType.split("/")[0];
        switch (fileType) {
            case "image": {
                this._loadImageFile();
                break;
            }
            default: {
                this._loadPdfOrTextFile();
                break;
            }
        }
    }
}