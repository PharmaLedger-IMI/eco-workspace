import TrialService from '../services/TrialService.js';
import FileDownloader from '../utils/FileDownloader.js';
import CommunicationService from '../services/CommunicationService.js';
import ConsentStatusMapper from '../utils/ConsentStatusMapper.js';
import EconsentsStatusRepository from "../repositories/EconsentsStatusRepository.js";
import TrialParticipantRepository from "../repositories/TrialParticipantRepository.js";

const {WebcController} = WebCardinal.controllers;

const TEXT_MIME_TYPE = 'text/';

export default class ReadEconsentController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({});
        this.model.econsent = {};
        this._initServices(this.DSUStorage);
        this.model.historyData = this.history.win.history.state.state;
        this.model.required = {};
        this.model.declined = {};
        this.model.signed = {};
        this.model.withdraw = {};
        this.model.showControls = false;
        this.model.pdf = {
            currentPage: 1,
            pagesNo: 0
        }
        this._initConsent();
        this._initHandlers();
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.PATIENT_IDENTITY);
        this.EconsentsStatusRepository = EconsentsStatusRepository.getInstance(DSUStorage);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
    }

    _initConsent() {
        this.TrialService.getEconsent(this.model.historyData.trialuid, this.model.historyData.ecoId, (err, econsent) => {
            if (err) {
                return console.log(err);
            }
            let ecoVersion = this.model.historyData.ecoVersion;
            this.model.econsent = econsent;
            let currentVersion = econsent.versions.find(eco => eco.version === ecoVersion);
            let econsentFilePath = this.getEconsentFilePath(this.model.historyData.trialuid, this.model.historyData.ecoId, ecoVersion, currentVersion.attachment);
            this.FileDownloader = new FileDownloader(econsentFilePath, currentVersion.attachment);
            this._downloadFile();
            this.EconsentsStatusRepository.findAll((err, data) => {
                if (err) {
                    return console.error(err);
                }
                let relevantStatuses = data.filter((element) => element.foreignConsentId === this.model.historyData.ecoId);
                let currentStatus = relevantStatuses.length > 0 ? relevantStatuses[relevantStatuses.length - 1] : {actions: []}

                this.model.status = currentStatus;
                this.model.signed = ConsentStatusMapper.isSigned(this.model.status.actions);
                this.model.declined = ConsentStatusMapper.isDeclined(this.model.status.actions);
                this.model.required = ConsentStatusMapper.isRequired(this.model.status.actions);
                this.model.withdraw = ConsentStatusMapper.isWithdraw(this.model.status.actions);
                this.model.withdrawIntention = ConsentStatusMapper.isWithdrawIntention(this.model.status.actions);
            });
        });
    }

    _initHandlers() {
        this._attachHandlerDecline();
        this._attachHandlerSign();
        this._attachHandlerManuallySign();
        this._attachHandlerDownload();
        this._attachHandlerBack();
    }

    _finishProcess(event, response) {
        event.stopImmediatePropagation();
        this.responseCallback(undefined, response);
    }

    getEconsentFilePath(trialSSI, consentSSI, version, fileName) {
        return '/trials/' + trialSSI + '/consent/' + consentSSI + '/consent/' + version + '/' + fileName;
    }

    _attachHandlerSign() {
        this.onTagEvent('econsent:sign', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.model.status.actions.push({name: 'signed'});
            this._saveStatus('sign');
        });
    }

    _attachHandlerDecline() {
        this.onTagEvent('econsent:withdraw', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'withdraw-econsent',
                (event) => {
                    const response = event.detail;
                    let operation = 'withdraw';
                    let message = 'TP withdraw consent.';
                    if (response.withdraw) {
                        this.model.status.actions.push({name: 'withdraw'});
                    } else if (response.withdrawIntention) {
                        this.model.status.actions.push({name: 'withdraw-intention'});
                        operation = 'withdraw-intention';
                        message = 'TP withdraw intention consent.';
                    }

                    this._saveStatus('withdraw-intention');
                },
                (event) => {
                    const response = event.detail;
                }
            ),
                {
                    controller: 'WithdrawEconsent',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    title: 'Decline Econsent',
                };
        });
    }

    _attachHandlerDownload() {
        this.onTagClick('econsent:download', (model, target, event) => {
            console.log('econsent:download');
            event.preventDefault();
            event.stopImmediatePropagation();
            this.FileDownloader.downloadFileToDevice({
                contentType: this.mimeType,
                rawBlob: this.rawBlob,
            });
        });
    }

    _attachHandlerManuallySign() {
        this.onTagClick('manual:sign', (model, target, event) => {
            this.navigateToPageTag('signmanually-econsent', {...this.model.historyData});
        });
    }

    sendMessageToSponsorAndHCO(action, ssi, shortMessage) {
        const currentDate = new Date();
        this.TrialParticipantRepository.findAll((err, data) => {
            if (err) {
                return console.log(err);
            }

            if (data && data.length > 0) {
                this.model.tp = data[0];
                let sendObject = {
                    operation: 'update-econsent',
                    ssi: ssi,
                    useCaseSpecifics: {
                        trialSSI: this.model.historyData.trialuid,
                        tpNumber: this.model.tp.did,
                        version: this.model.historyData.ecoVersion,
                        action: {
                            name: action,
                            date: currentDate.toISOString(),
                            toShowDate: currentDate.toLocaleDateString(),
                        },
                    },
                    shortDescription: shortMessage,
                };
                this.CommunicationService.sendMessage(CommunicationService.identities.ECO.SPONSOR_IDENTITY, sendObject);
                this.CommunicationService.sendMessage(CommunicationService.identities.ECO.HCO_IDENTITY, sendObject);
            }
        });
    }

    _downloadFile = () => {
        this.FileDownloader.downloadFile((downloadedFile) => {
            this.rawBlob = downloadedFile.rawBlob;
            this.mimeType = downloadedFile.contentType;
            this.blob = new Blob([this.rawBlob], {
                type: this.mimeType,
            });
            this._displayFile();
        });
    };

    _loadPdfOrTextFile = () => {
        const reader = new FileReader();
        reader.readAsDataURL(this.blob);
        reader.onloadend = () => {
            let base64data = reader.result;
            this.initPDF(base64data.substr(base64data.indexOf(',') + 1));
        };
    };

    initPDF(pdfData) {
        pdfData = atob(pdfData);
        let pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';

        this.loadingTask = pdfjsLib.getDocument({data: pdfData});
        this.renderPage(this.model.pdf.currentPage);
        window.addEventListener("scroll", (event) => {
            let myDiv = event.target;
            if (myDiv.id === 'canvas-wrapper'
                && myDiv.offsetHeight + myDiv.scrollTop >= myDiv.scrollHeight - 1) {
                this.model.showControls = true;

            }
        }, {capture: true});
    }

    renderPage = (pageNo) => {
        this.loadingTask.promise.then((pdf) => {
            this.model.pdf.pagesNo = pdf.numPages;
            if (pdf.numPages <= 1) {
                this.model.showControls = true;
            }
            pdf.getPage(pageNo).then(result => this.handlePages(pdf, result));
        }, (reason) => console.error(reason));
    }

    handlePages = (thePDF, page) => {
        const viewport = page.getViewport({scale: 0.64});
        let canvas = document.createElement("canvas");
        canvas.style.display = "block";
        let context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        page.render({canvasContext: context, viewport: viewport});
        document.getElementById('canvas-parent').appendChild(canvas);

        this.model.pdf.currentPage = this.model.pdf.currentPage + 1;
        let currPage = this.model.pdf.currentPage;
        if (thePDF !== null && currPage <= this.model.pdf.pagesNo) {
            thePDF.getPage(currPage).then(result => this.handlePages(thePDF, result));
        }
    }

    _displayFile = () => {
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            const file = new File([this.rawBlob], this.fileName);
            window.navigator.msSaveOrOpenBlob(file);
            this.feedbackController.setLoadingState(true);
            return;
        }

        window.URL = window.URL || window.webkitURL;
        const fileType = this.mimeType.split('/')[0];
        switch (fileType) {
            case 'image': {
                this._loadImageFile();
                break;
            }
            default: {
                this._loadPdfOrTextFile();
                break;
            }
        }
    };

    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }

    async _saveStatus(operation) {
        if (this.model.status === undefined || this.model.status.uid === undefined) {
            //TODO implement when status is not set => optional consents
            return;
        }
        await this.EconsentsStatusRepository.updateAsync(this.model.status.uid, this.model.status);
        this.sendMessageToSponsorAndHCO(operation, this.model.econsent.keySSI, 'Tp' + operation);
        this._finishActionSave();
    }

    _finishActionSave() {
        this.navigateToPageTag('home');
    }
}
