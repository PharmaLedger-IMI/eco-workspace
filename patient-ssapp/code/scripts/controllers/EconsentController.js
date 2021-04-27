import TrialDataService from "./services/TrialDataService.js";
import TrialService from "./services/TrialService.js";
import FileDownloader from "../utils/FileDownloader.js";
import EconsentService from "./services/EconsentService.js";

const {WebcController} = WebCardinal.controllers;

export default class EconsentController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.setModel({});
        this.model.econsent = {};

        this.TrialService = new TrialService(this.DSUStorage);
        this.historyData = this.history.win.history.state.state;
        this.EconsentService = new EconsentService(this.DSUStorage);
        this.TrialDataService = new TrialDataService(this.DSUStorage);

        this._getData();


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

    _getData() {
        debugger;
        this.TrialService.getEconsent(this.historyData.trialuid, this.historyData.ecoId, (err, econsent) => {
            if (err) {
                return console.log(err);
            }
            this.model.econsent = econsent;
            this.model.econsent.versionDate = new Date(econsent.versionDate).toLocaleDateString("sw");

            this.fileDownloader = new FileDownloader(this.getEconsentFilePath(this.historyData.trialuid, this.historyData.ecoId, econsent.attachment), econsent.attachment);

            this._downloadFile();
            console.log("File downloader" + this.fileDownloader);
            this.model.tpEconsents = [];
            this.EconsentService.getServiceModel((err, data) => {
                if (err) {
                    return console.error(err);
                }
                this.model.tpEconsents.push(...data.econsents);
                let ec = this.model.tpEconsents.find(ec => ec.id == this.model.econsent.id);
                if (ec) {
                    this.model.econsent.signed = ec.signed;
                }
            })
        });


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
            debugger
            this.navigateToPageTag('sign-econsent', {
                tpNumber: this.historyData.tpNumber,
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
        });
    }
}