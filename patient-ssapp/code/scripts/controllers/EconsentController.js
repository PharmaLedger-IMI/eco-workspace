import TrialService from '../services/TrialService.js';
import FileDownloader from '../utils/FileDownloader.js';
import ConsentStatusMapper from '../utils/ConsentStatusMapper.js';
import EconsentsStatusRepository from "../repositories/EconsentsStatusRepository.js";

const {WebcController} = WebCardinal.controllers;

export default class EconsentController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({});
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this.model.econsent = {};
        this.model.historyData = this.history.win.history.state.state;

        this.model.status = {
            actions: [],
            latest: 'N/A'
        };
        this._initEconsent();
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.EconsentsStatusRepository = EconsentsStatusRepository.getInstance(DSUStorage);
    }

    _initHandlers() {
        this._attachHandlerReadEconsent();
        this._attachHandlerVersions();
        this._attachHandlerDownload();
        this._attachHandlerQuestion();

        this._attachHandlerWithdraw();
        this._attachHandlerBack();
    }

    _initEconsent() {
        this.TrialService.getEconsent(this.model.historyData.trialuid, this.model.historyData.ecoId, (err, econsent) => {
            if (err) {
                return console.log(err);
            }
            let ecoVersion = this.model.historyData.ecoVersion;
            this.model.econsent = econsent;
            let currentVersion = econsent.versions.find(eco => eco.version === ecoVersion);
            let econsentFilePath = this.getEconsentFilePath(this.model.historyData.trialuid, this.model.historyData.ecoId, ecoVersion, currentVersion.attachment);
            this.fileDownloader = new FileDownloader(econsentFilePath, currentVersion.attachment);
            this.model.econsent.versionDate = new Date(currentVersion.versionDate).toLocaleDateString('sw');
            this.model.econsent.version = currentVersion.version;
            this._downloadFile();

            this.EconsentsStatusRepository.findAll((err, data) => {
                if (err) {
                    return console.error(err);
                }
                let status = data.find((element) => element.foreignConsentId === this.model.historyData.ecoId);
                if (status === undefined) {
                    return console.log(`Status not found for econsendId ${this.model.historyData.ecoId}`);
                }
                status.actions = status.actions.map((action, index) => {
                    return {
                        ...action,
                        index: index + 1,
                    };
                });
                this.model.status = status;
                this.model.status.latest = status.actions.length > 0 ? status.actions[status.actions.length - 1].name : 'N/A';
                this.model.signed = ConsentStatusMapper.isSigned(this.model.status.actions);
                this.model.declined = ConsentStatusMapper.isDeclined(this.model.status.actions);
            });
        });
    }

    _attachHandlerDownload() {
        this.onTagClick('econsent:download', (model, target, event) => {
            console.log('econsent:download');
            event.preventDefault();
            event.stopImmediatePropagation();
            this.fileDownloader.downloadFileToDevice({
                contentType: this.mimeType,
                rawBlob: this.rawBlob,
            });
        });
    }

    _attachHandlerReadEconsent() {
        this.onTagClick('econsent:read', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('sign-econsent', {...this.model.historyData});
        });
    }

    _attachHandlerVersions() {

        this.onTagClick('econsent:versions', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('econsent-versions', {trialSSI:this.model.historyData.trialuid, econsentSSI:this.model.historyData.ecoId, tpDid: this.model.historyData.tpDid});
        });
    }

    _attachHandlerQuestion() {
        this.on('econsent:question', (event) => {
            console.log('econsent:question');
        });
    }

    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();

        });
    }

    _attachHandlerWithdraw() {
        this.on('econsent:withdraw', (event) => {
            this.showModal('withdrawEconsent', {}, (err, response) => {
                if (err) {
                    return console.log(err);
                }
                if (response) {
                    this.model.status.actions.push({name: 'withdraw'});
                    this.model.status.latest = 'Withdraw';
                }
                this.EconsentsStatusRepository.update(this.model.status.uid, this.model.status, (err, response) => {
                    if (err) {
                        return console.log(err);
                    }
                });
            });
        });
    }

    getEconsentFilePath(trialSSI, consentSSI, version, fileName) {
        return '/trials/' + trialSSI + '/consent/' + consentSSI + '/consent/' + version;
    }

    _downloadFile = () => {
        this.fileDownloader.downloadFile((downloadedFile) => {
            this.rawBlob = downloadedFile.rawBlob;
            this.mimeType = downloadedFile.contentType;
            this.blob = new Blob([this.rawBlob], {
                type: this.mimeType,
            });
        });
    };
}
