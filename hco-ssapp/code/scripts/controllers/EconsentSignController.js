import TrialService from '../services/TrialService.js';
import TrialParticipantsService from '../services/TrialParticipantsService.js';
import SiteService from '../services/SiteService.js';
import PatientEcosentService from "../services/PatientEcosentService.js";
import HCOService from "../services/HCOService.js";

const {WebcController} = WebCardinal.controllers;

const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const DateTimeService = ecoServices.DateTimeService;
const Constants = ecoServices.Constants;
const FileDownloaderService = ecoServices.FileDownloaderService;
const BaseRepository = ecoServices.BaseRepository;

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

        if (this.model.controlsShouldBeVisible === undefined) {
            this.model.controlsShouldBeVisible = true;
        }

        this._initServices();
        this._initHandlers();
    }

    async _initServices() {
        this.TrialService = new TrialService();
        this.TrialParticipantService = new TrialParticipantsService();
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.TRIAL_PARTICIPANTS);
        this.SiteService = new SiteService();
        this.HCOService = new HCOService();
        this.model.hcoDSU = await this.HCOService.getOrCreateAsync();
        this._initSite();
        this._initTrialParticipant();
        this._initConsent();
    }

    _initHandlers() {
        this._attachHandlerEconsentSign();
        this._attachHandlerBack();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    _initConsent() {
        let econsent = this.model.hcoDSU.volatile.icfs.find(consent => consent.uid == this.model.econsentSSI);
        if (econsent === undefined) {
            return console.log('Error while loading econsent.');
        }
        this.model.econsent = {
            ...econsent,
            versionDateAsString: DateTimeService.convertStringToLocaleDate(econsent.versions[0].versionDate)
        }
        let currentVersion = '';
        if (this.model.ecoVersion) {
            currentVersion = econsent.versions.find(eco => eco.version === this.model.ecoVersion);
        } else {
            currentVersion = econsent.versions[econsent.versions.length - 1];
            this.model.ecoVersion = currentVersion.version;
        }
        this.fileDownloaderService = new FileDownloaderService(this.DSUStorage);

        if (this.model.isManuallySigned) {
            this.PatientEcosentService = new PatientEcosentService(this.model.econsent.id);
            this.PatientEcosentService.mountEcosent(this.model.manualKeySSI, (err, data) => {
                if (err) {
                    return console.log(err);
                }
                let econsentFilePath = this._getEconsentManualFilePath(this.model.econsent.id, data.keySSI, this.model.manualAttachment);
                this._downloadFile(econsentFilePath, this.model.manualAttachment);
            })

        } else {
            let econsentFilePath = this._getEconsentFilePath(econsent, currentVersion);
            this._downloadFile(econsentFilePath, currentVersion.attachment);
        }
    }

    sendMessageToSponsor(operation, shortMessage) {
        const currentDate = new Date();
        let sendObject = {
            operation: operation,
            ssi: this.model.econsentSSI,
            useCaseSpecifics: {
                trialSSI: this.model.trialSSI,
                tpNumber: this.model.trialParticipant.number,
                tpDid: this.model.trialParticipant.did,
                version: this.model.ecoVersion,
                siteSSI: this.model.site?.keySSI,
                action: {
                    name: 'sign',
                    date: DateTimeService.getCurrentDateAsISOString(),
                    toShowDate: currentDate.toLocaleDateString(),
                },
            },
            shortDescription: shortMessage,
        };
        this.CommunicationService.sendMessage(this.model.site.sponsorIdentity, sendObject);
    }

    _getEconsentFilePath(econsent, currentVersion) {
        return this.HCOService.PATH  + '/' + this.model.hcoDSU.uid + '/icfs/' + this.model.trialSSI + "/"
        + econsent.uid + '/versions/' + currentVersion.version
    }

    _getEconsentManualFilePath(ecoID, consentSSI, fileName) {
        return '/econsents/' + ecoID + '/' + consentSSI;
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
            this._updateEconsentWithDetails();
            this.sendMessageToSponsor(Constants.MESSAGES.SPONSOR.SIGN_ECOSENT, Constants.MESSAGES.HCO.COMMUNICATION.SPONSOR.SIGN_ECONSENT);
            this.navigateToPageTag('home');
        });
    }


    _downloadFile = async (filePath, fileName) => {
        await this.fileDownloaderService.prepareDownloadFromDsu(filePath, fileName);
        let fileBlob = this.fileDownloaderService.getFileBlob(fileName);
        this.rawBlob = fileBlob.rawBlob;
        this.mimeType = fileBlob.mimeType;
        this.blob = new Blob([this.rawBlob], {
            type: this.mimeType,
        });
        this._displayFile();
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
                && myDiv.offsetHeight + myDiv.scrollTop >= myDiv.scrollHeight) {
                this.model.showControls = true;
            }
        }, {capture: true});
    }

    renderPage = (pageNo) => {
        this.loadingTask.promise.then((pdf) => {
            this.model.pdf.pagesNo = pdf.numPages;
            pdf.getPage(pageNo).then(result => this.handlePages(pdf, result));
        }, (reason) => console.error(reason));
    }

    handlePages = (thePDF, page) => {
        const viewport = page.getViewport({scale: 1.5});
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
            name: 'sign',
            tpDid: this.model.tpDid,
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

    _initTrialParticipant() {
        this.TrialParticipantRepository.filter(`did == ${this.model.trialParticipantNumber}`, 'ascending', 30, (err, tps) => {

            if (tps && tps.length > 0) {
                this.model.trialParticipant = tps[0];
            }
        });
    }

    _updateTrialParticipantStatus() {
        this.model.trialParticipant.actionNeeded = 'HCO SIGNED -no action required';
        this.model.trialParticipant.tpSigned = true;
        this.model.trialParticipant.status = Constants.TRIAL_PARTICIPANT_STATUS.ENROLLED;
        this.TrialParticipantRepository.update(this.model.trialParticipant.uid, this.model.trialParticipant, (err, trialParticipant) => {
            if (err) {
                return console.log(err);
            }
            console.log(trialParticipant);
        });
    }

    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }

    async _initSite() {
        let sites = this.model.hcoDSU.volatile.site;
        if (sites && sites.length > 0) {
            this.model.site = sites[sites.length - 1];
        }
    }

}
