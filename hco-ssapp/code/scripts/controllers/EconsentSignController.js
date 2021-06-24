import TrialParticipantRepository from "../repositories/TrialParticipantRepository.js";

const {WebcController} = WebCardinal.controllers;
import TrialService from '../services/TrialService.js';
import TrialParticipantsService from '../services/TrialParticipantsService.js';
import CommunicationService from '../services/CommunicationService.js';
import DateTimeService from '../services/DateTimeService.js';
import FileDownloader from '../utils/FileDownloader.js';
import Constants from '../utils/Constants.js';

const TEXT_MIME_TYPE = 'text/';

let getInitModel = () => {
    return {
        econsent: {},
    };
};

export default class EconsentSignController extends WebcController {
    constructor(...props) {
        super(...props);

        this.setModel({
            ...getInitModel(),
            ...this.history.win.history.state.state,
            showControls: false,
            pdf: {
                currentPage: 1,
                pagesNo: 0
            },
            showPageUp: false,
            showPageDown: true
        });

        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initConsent();
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
    }

    _initHandlers() {
        this._attachHandlerEconsentSign();
        this._attachHandlerPdfPageUp();
        this._attachHandlerPdfPageDown();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    _initConsent() {
        this.TrialService.getEconsent(this.model.trialSSI, this.model.econsentSSI, (err, econsent) => {
            if (err) {
                return console.log(err);
            }
            this.model.econsent = {
                ...econsent,
                versionDateAsString: DateTimeService.convertStringToLocaleDate(econsent.versionDate),
            };
            let ecoVersion = this.model.ecoVersion;
            let currentVersion = econsent.versions.find(eco => eco.version === ecoVersion);
            let econsentFilePath = this._getEconsentFilePath(this.model.trialSSI, this.model.econsentSSI, ecoVersion, currentVersion.attachment);
            this.FileDownloader = new FileDownloader(econsentFilePath, currentVersion.attachment);
            this._downloadFile();
        });
    }

    sendMessageToSponsor(operation, shortMessage) {
        const currentDate = new Date();
        let sendObject = {
            operation: operation,
            ssi: this.model.econsentSSI,
            useCaseSpecifics: {
                trialSSI: this.model.trialSSI,
                tpNumber: this.model.trialParticipantNumber,
                version: this.model.ecoVersion,
                action: {
                    name: 'sign',
                    date: DateTimeService.getCurrentDateAsISOString(),
                    toShowDate: currentDate.toLocaleDateString(),
                },
            },
            shortDescription: shortMessage,
        };
        this.CommunicationService.sendMessage(CommunicationService.identities.SPONSOR_IDENTITY, sendObject);
    }

    _getEconsentFilePath(trialSSI, consentSSI, version, fileName) {
        return '/trials/' + trialSSI + '/consent/' + consentSSI + '/consent/' + version + '/' + fileName;
    }

    _attachHandlerEconsentSign() {
        this.onTagEvent('econsent:sign', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            const currentDate = new Date();
            this.model.econsent.hcoSign = {
                date: currentDate.toISOString(),
                toShowDate: currentDate.toLocaleDateString(),
            };

            // this.TrialService.updateEconsent(this.model.trialSSI, this.model.econsent, (err, response) => {
            //     if (err) {
            //         return console.log(err);
            //     }
            // });
            this._updateEconsentWithDetails();
            this.sendMessageToSponsor('sign-econsent', Constants.MESSAGES.HCO.COMMUNICATION.SPONSOR.SIGN_ECONSENT);
            this.navigateToPageTag('home');
        });
    }

    _attachHandlerPdfPageUp() {
        this.onTagEvent('pdf-page-up', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            if (this.model.pdf.currentPage === 1) {
                this.model.showPageUp = false;
            }
            if (this.model.pdf.currentPage + 1 < this.model.pdf.pagesNo) {
                this.model.showPageDown = true;
            }
            if (this.model.pdf.currentPage <= 1) {
                return;
            }
            this.model.pdf.currentPage = this.model.pdf.currentPage - 1;
            this.renderPage(this.model.pdf.currentPage);
        });
    }

    _attachHandlerPdfPageDown() {
        this.onTagEvent('pdf-page-down', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            if (this.model.pdf.currentPage >= 1) {
                this.model.showPageUp = true;
            }
            if (this.model.pdf.currentPage + 1 === this.model.pdf.pagesNo) {
                this.model.showControls = true;
                this.model.showPageDown = false;
            }
            if (this.model.pdf.currentPage >= this.model.pdf.pagesNo) {
                this.model.showControls = true;
                return;
            }
            this.model.pdf.currentPage = this.model.pdf.currentPage + 1;
            this.renderPage(this.model.pdf.currentPage);
        });
    }

    _downloadFile = () => {
        this.FileDownloader.downloadFile((downloadedFile) => {
            this.rawBlob = downloadedFile.rawBlob;
            this.mimeType = downloadedFile.contentType;
            this.blob = new Blob([this.rawBlob], {
                type: this.mimeType,
            });
            if (this.mimeType.indexOf(TEXT_MIME_TYPE) !== -1) {
                this._prepareTextEditorViewModel();
            } else {
                this._displayFile();
            }
        });
    };

    _loadPdfOrTextFile = () => {
        this._loadBlob((base64Blob) => {
            const obj = document.createElement('object');
            obj.type = this.mimeType;
            obj.data = base64Blob;
            this._appendAsset(obj);
        });
    };

    _loadBlob = (callback) => {
        const reader = new FileReader();
        reader.readAsDataURL(this.blob);
        reader.onloadend = () => {
            let base64data = reader.result;
            this.initPDF(base64data.substr(base64data.indexOf(',')+1));
            callback(base64data);
        };
    };

    _appendAsset = (assetObject) => {
        return;
        let content = this.element.querySelector('.content');
        if (content) {
            content.append(assetObject);
        }

        window.addEventListener("scroll", (event) => {
            let myDiv = event.target;
            if (myDiv.id === 'pdfViewer'
                && myDiv.offsetHeight + myDiv.scrollTop >= myDiv.scrollHeight) {
                this.model.showControls = true;
            }
        }, {capture: true});
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
                && myDiv.offsetHeight + myDiv.scrollTop >= myDiv.scrollHeight) {
                console.log('Scroll down -> should change the page here.')
            }
        }, {capture: true});
    }

    renderPage = (pageNo) => {
        this.loadingTask.promise.then((pdf) => {
            this.model.pdf.pagesNo = pdf.numPages;
            pdf.getPage(pageNo).then(page => {
                const viewport = page.getViewport({scale: 1});

                const canvas = document.getElementById('the-canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                const renderTask = page.render(renderContext);
                renderTask.promise.then(function () {
                    console.log('Page rendered');
                });
            });
        }, (reason) => console.error(reason));
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

    _showFeedbackToast(title, message, alertType) {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }


    _updateEconsentWithDetails(message) {

        let currentVersionIndex = this.model.econsent.versions.findIndex(eco => eco.version === this.model.ecoVersion)
        if (currentVersionIndex === -1) {
            return console.log(`Version ${message.useCaseSpecifics.version} of the econsent ${message.ssi} does not exist.`)
        }
        let currentVersion = this.model.econsent.versions[currentVersionIndex]
        if (currentVersion.actions === undefined) {
            currentVersion.actions = [];
        }


        const currentDate = new Date();
        currentVersion.actions.push({

            tpNumber: this.model.trialParticipantNumber,
            type: 'hco',
            status: Constants.TRIAL_PARTICIPANT_STATUS.ENROLLED,
            actionNeeded: 'HCO SIGNED -no action required',
            toShowDate: currentDate.toLocaleDateString(),
        });

        this.model.econsent.uid = this.model.econsent.keySSI;
        this.model.econsent.versions[currentVersionIndex] = currentVersion;
        this.TrialService.updateEconsent(this.model.trialSSI, this.model.econsent, (err, response) => {
            if (err) {
                return console.log(err);
            }
            this._updateTrialParticipantStatus();
        });
    }

    _updateTrialParticipantStatus() {

        this.TrialParticipantRepository.filter(`did == ${this.model.trialParticipantNumber}`, 'ascending', 30, (err, tps) => {

            if (tps && tps.length > 0) {
                let tp = tps[0];
                tp.actionNeeded = 'HCO SIGNED -no action required',
                tp.tpSigned = true;
                tp.status = Constants.TRIAL_PARTICIPANT_STATUS.ENROLLED;
                this.TrialParticipantRepository.update(tp.uid, tp, (err, trialParticipant) => {
                    if (err) {
                        return console.log(err);
                    }
                    console.log(trialParticipant);
                });
            }
        });


    }
}
