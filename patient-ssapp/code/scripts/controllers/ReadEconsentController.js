import TrialService from "./services/TrialService.js";
import FileDownloader from "../utils/FileDownloader.js";

import CommunicationService from "../services/CommunicationService.js";

const {WebcController} = WebCardinal.controllers;

export default class ReadEconsentController extends WebcController {
    constructor(element, history) {
        super(element, history);
        this.setModel({});
        this.model.econsent = {};
        let econsentTA = {

            name: "econsent",
            required: true,
            value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum'
        }

        this.model.econsentTa = econsentTA;
        debugger;
        this.TrialService = new TrialService(this.DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.PATIENT_IDENTITY);
        this.model.historyData = this.history.win.history.state.state;
        this.readEconsent();
        this._attachHandlerDecline();
        this._attachHandlerSign();
    }

    readEconsent() {
        this.TrialService.getEconsent(this.model.historyData.trialuid, this.model.historyData.ecoId, (err, econsent) => {
            if (err) {
                return console.log(err);
            }
            this.model.econsent = econsent;
            this.fileDownloader = new FileDownloader(this.getEconsentFilePath(this.model.historyData.trialuid, this.model.historyData.ecoId, econsent.attachment), econsent.attachment);

            this._downloadFile();
            console.log("File downloader" + this.fileDownloader);
        });

    }


    _finishProcess(event, response) {
        event.stopImmediatePropagation();
        this.responseCallback(undefined, response);
    };

    _downloadFile = () => {
        this.fileDownloader.downloadFile((downloadedFile) => {
            this.rawBlob = downloadedFile.rawBlob;
            this.mimeType = downloadedFile.contentType;
            this.blob = new Blob([this.rawBlob], {
                type: this.mimeType
            });

            this._readFile();
            if (this.mimeType.indexOf(TEXT_MIME_TYPE) !== -1) {
                this._prepareTextEditorViewModel();
            } else {
                this._displayFile();
                this._clearUnsavedFileSection();
            }
        });
    }

    _readFile() {
        const reader = new FileReader();
        reader.onload = () => {
            this.model.econsentTa.value = reader.result;
        }
        reader.readAsText(this.blob);
    }

    getEconsentFilePath(trialSSI, consentSSI, fileName) {
        return "/trials/" + trialSSI + '/consent/' + consentSSI + '/consent/' + fileName;
    }

    _attachHandlerSign() {

        this.onTagEvent('econsent:sign', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                debugger
                this.navigateToPageTag('home');
                this.sendMessageToHCO('sign-econsent', this.model.econsent.keySSI, 'TP signed econsent ');
            }
        )
    }

    _attachHandlerDecline() {

        this.onTagEvent('econsent:decline', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();

                this.showModalFromTemplate('withdraw-econsent', (event) => {
                        const response = event.detail;
                        this.sendMessageToHCO('withdraw-econsent', this.model.econsent.keySSI, 'TP withdrow econsent ');
                    },
                    (event) => {
                        const response = event.detail;
                    }), {
                    controller: 'WithdrawEconsent',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    title: 'Decline Econsent',
                }
        }
        )
    }

    sendMessageToHCO(operation, ssi, shortMessage) {
        debugger
        this.CommunicationService.sendMessage(CommunicationService.identities.HCO_IDENTITY, {
            operation: operation,
            ssi: ssi,
            useCaseSpecifics: {
                trialSSI: this.model.historyData.trialuid,
                tpNumber: this.model.historyData.tpNumber
            },
            shortDescription: shortMessage,
        });
    }
}
