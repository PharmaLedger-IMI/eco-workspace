import TrialService from "../services/TrialService.js";
import EconsentService from "../services/EconsentService.js";
import FileDownloader from "../utils/FileDownloader.js";

import CommunicationService from "../services/CommunicationService.js";
import NotificationsService from "../services/NotificationsService";


const {WebcController} = WebCardinal.controllers;

const TEXT_MIME_TYPE = "text/";

export default class ReadEconsentController extends WebcController {
    constructor(element, history) {
        super(element, history);
        this.setModel({});
        this.model.econsent = {};
        debugger;
        this._initServices(this.DSUStorage);

        this.model.historyData = this.history.win.history.state.state;
        this._initConsent();
        this._initHandlers();
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.EconsentService = new EconsentService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.PATIENT_IDENTITY);
    }

    _initConsent() {
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

    _initHandlers() {
        this._attachHandlerDecline();
        this._attachHandlerSign();
    }

    _finishProcess(event, response) {
        event.stopImmediatePropagation();
        this.responseCallback(undefined, response);
    };


    getEconsentFilePath(trialSSI, consentSSI, fileName) {
        return "/trials/" + trialSSI + '/consent/' + consentSSI + '/consent/' + fileName;
    }

    _attachHandlerSign() {

        this.onTagEvent('econsent:sign', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                debugger
                this.navigateToPageTag('home');

                this.model.econsent.signed = true;
                this.model.econsent.declined = false;
                this._saveEconsent();
                this.sendMessageToSponsorAndHCO('sign-econsent', this.model.econsent.keySSI, 'TP signed econsent ');
            }
        )
    }


    _attachHandlerDecline() {

        this.onTagEvent('econsent:decline', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();

                this.showModalFromTemplate('withdraw-econsent', (event) => {
                        const response = event.detail;
                        if (response.withdraw) {
                            debugger;
                            this.model.econsent.signed = false;
                            this.model.econsent.declined = true;
                            this._saveEconsent();
                            this.sendMessageToSponsorAndHCO('withdraw-econsent', this.model.econsent.keySSI, 'TP withdrow econsent ');
                        }
                    },
                    (event) => {
                        const response = event.detail;
                    }), {
                    controller: 'WithdrawEconsent',
                    disableExpanding: true,
                    disableBackdropClosing: false,
                    title: 'Decline Econsent',
                }
            }
        )
    }

    sendMessageToSponsorAndHCO(operation, ssi, shortMessage) {
        let sendObject = {
            operation: operation,
            ssi: ssi,
            useCaseSpecifics: {
                trialSSI: this.model.historyData.trialuid,
                tpNumber: this.model.historyData.tpNumber,
                operationDate: (new Date()).toISOString()
            },
            shortDescription: shortMessage,
        };
        this.CommunicationService.sendMessage(CommunicationService.identities.SPONSOR_IDENTITY, sendObject);
        this.CommunicationService.sendMessage(CommunicationService.identities.HCO_IDENTITY, sendObject);
    }

    _downloadFile = () => {
        this.fileDownloader.downloadFile((downloadedFile) => {
            this.rawBlob = downloadedFile.rawBlob;
            this.mimeType = downloadedFile.contentType;
            this.blob = new Blob([this.rawBlob], {
                type: this.mimeType
            });


            if (this.mimeType.indexOf(TEXT_MIME_TYPE) !== -1) {
                //this._prepareTextEditorViewModel();
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

    _saveEconsent() {
        debugger;
        this.EconsentService.saveEconsent({
            ...this.model.econsent,
            uid: this.model.econsent.keySSI,
            signed: this.model.econsent.signed,
            declined: this.model.econsent.declined,
            signedDate: new Date()
        }, (err, data) => {
            if (err) {
                return console.log(err);
            }
        })
    }
}
