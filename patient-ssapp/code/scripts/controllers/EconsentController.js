import TrialService from "../services/TrialService.js";
import FileDownloader from "../utils/FileDownloader.js";
import EconsentService from "../services/EconsentService.js";

const {WebcController} = WebCardinal.controllers;

export default class EconsentController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.setModel({});
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this.model.econsent = {};
        this.model.signed = false;
        this.model.declined = false;

        this.historyData = this.history.win.history.state.state;
        this._initEconsent();

    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.EconsentService = new EconsentService(DSUStorage);
    }

    _initHandlers() {
        this._attachHandlerReadEconsent();
        this._attachHandlerDownload();
        this._attachHandlerQuestion();
        this._attachHandlerVersions();
        this._attachHandlerWithdraw();
    }

    _initEconsent() {
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

                    this.model.signed = this.model.tpEconsents[this.model.tpEconsents.length - 1].signed;

                    this.model.declined = this.model.tpEconsents[this.model.tpEconsents.length - 1].declined;
                }
            })
        });


    }

    _attachHandlerDownload() {
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

    _attachHandlerReadEconsent() {
        this.onTagClick('econsent:read', (model, target, event) => {
            debugger
            this.navigateToPageTag('sign-econsent', {
                tpNumber: this.historyData.tpNumber,
                trialuid: this.historyData.trialuid,
                ecoId: this.historyData.ecoId
            })
        });
    }

    _attachHandlerVersions() {
        this.on('econsent:versions', (event) => {
            console.log('econsent:versions')
        })
    }

    _attachHandlerQuestion() {
        this.on('econsent:question', (event) => {
            console.log('econsent:question')
        })
    }

    _attachHandlerWithdraw() {
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