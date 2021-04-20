import TrialDataService from "./services/TrialDataService.js";
import TrialService from "./services/TrialService.js";
import FileDownloader from "../utils/FileDownloader.js";


const {WebcController} = WebCardinal.controllers;

export default class EconsentController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.setModel({});
        this.model.econsent = {};

        this.TrialService = new TrialService(this.DSUStorage);
        this.historyData = this.history.win.history.state.state;

        this.TrialDataService = new TrialDataService(this.DSUStorage);


        this.TrialService.getEconsent(this.historyData.trialuid, this.historyData.ecoId, (err, econsent) => {
            if (err) {
                return console.log(err);
            }
            this.model.econsent = econsent;
            this.fileDownloader = new FileDownloader(this.getEconsentFilePath(this.historyData.trialuid, this.historyData.ecoId, econsent.attachment), econsent.attachment);

            this._downloadFile();
            console.log("File downloader" + this.fileDownloader);
        });


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
                if (response) {
                    this.model.econsent.signed = false;
                }
                this.EconsentService.saveEconsent(this.model.econsent, (err, response) => {
                    if (err) {
                        return console.log(err);
                    }

                })
            });
        })

        this.attachHandlerReadEconsent();
        this.attachHandlerDownload();
    }

    attachHandlerDownload() {
        this.onTagClick('econsent:download', (model, target, event) => {
            console.log('econsent:download')
            event.preventDefault();
            event.stopImmediatePropagation();
            debugger;

            this.fileDownloader.downloadFileToDevice({
                contentType: this.mimeType,
                rawBlob: this.rawBlob
            });
        })
    }

    attachHandlerReadEconsent() {
        this.onTagClick('econsent:read', (model, target, event) => {
            this.navigateToPageTag('sign-econsent', {
                trialuid: this.historyData.trialuid,
                ecoId: this.historyData.ecoId
            })
        });
    }

    getEconsentFilePath(trialSSI, consentSSI, fileName) {
        return "/trials/" + trialSSI + '/consent/' + consentSSI + '/consent/' + fileName;
    }

    _downloadFile = () => {
        this.fileDownloader.downloadFile((downloadedFile) => {
            this.rawBlob = downloadedFile.rawBlob;
            this.mimeType = downloadedFile.contentType;
            this.blob = new Blob([this.rawBlob], {
                type: this.mimeType
            });

            // if (this.mimeType.indexOf(TEXT_MIME_TYPE) !== -1) {
            //     this._prepareTextEditorViewModel();
            // } else {
            //     this._displayFile();
            //     this._clearUnsavedFileSection();
            // }
        });
    }
}