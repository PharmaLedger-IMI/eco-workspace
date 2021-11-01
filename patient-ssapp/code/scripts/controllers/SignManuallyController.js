import TrialService from '../services/TrialService.js';
import ConsentStatusMapper from '../utils/ConsentStatusMapper.js';
import EconsentService from "../services/EconsentService.js";
import TrialConsentService from "../services/TrialConsentService.js";

const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const FileDownloader = ecoServices.FileDownloader;
const BaseRepository = ecoServices.BaseRepository;

const {WebcController} = WebCardinal.controllers;

const TEXT_MIME_TYPE = 'text/';

export default class SignManuallyController extends WebcController {
    attachment = {
        label: '3. Select signed consent',

        listFiles: true,
        filesAppend: false,
        files: [],
    };

    constructor(...props) {
        super(...props);
        this.setModel({});
        this.model.econsent = {};
        this.model.attachment = this.attachment;

        this.model.historyData = this.history.win.history.state.state;
        this._initServices();
    }

    _initServices() {
        this.TrialService = new TrialService();
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.PATIENT_IDENTITY);
        this.EconsentsStatusRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.ECOSESENT_STATUSES);
        this.EcosentService = new EconsentService();
        this.TrialParticipantRepository =  BaseRepository.getInstance(BaseRepository.identities.PATIENT.TRIAL_PARTICIPANT);
        this.TrialConsentService = new TrialConsentService();
        this.TrialConsentService.getOrCreate((err, trialConsent) => {
            if (err) {
                return console.log(err);
            }
            this.model.trialConsent = trialConsent;
            this._initConsent();
            this._initHandlers();
        });
    }

    _initConsent() {
        let econsent = this.model.trialConsent.volatile.ifc.find(c => c.uid === this.model.historyData.ecoId)
        let ecoVersion = this.model.historyData.ecoVersion;
        this.model.econsent = econsent;
        let currentVersion = econsent.versions.find(eco => eco.version === ecoVersion);
        let econsentFilePath = this.getEconsentFilePath(econsent, currentVersion);;
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
    }

    _initHandlers() {
        this._attachHandlerSign();
        this._attachHandlerDownload();
        this._attachHandlerAddEconsentFile();
    }

    _finishProcess(event, response) {
        event.stopImmediatePropagation();
        this.responseCallback(undefined, response);
    }

    getEconsentFilePath(econsent, currentVersion) {
        return this.TrialConsentService.PATH  + '/' + this.model.trialConsent.uid + '/ifc/'
            + econsent.uid + '/versions/' + currentVersion.version;
    }

    _attachHandlerSign() {
        this.onTagEvent('econsent:sign', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'confirmation-alert',
                (event) => {
                    const response = event.detail;
                    if (response) {
                        this.model.status.actions.push({name: 'signed'});
                        this._saveStatus('sign');
                    }
                },
                (event) => {
                    const response = event.detail;
                },
                {
                    controller: 'ConfirmationAlertController',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    question: 'Are you sure you want to send this file? ',
                    title: 'Send Signed Econsent',
                });
        });

    }

    _attachHandlerAddEconsentFile() {
        this.on('add-file', (event) => {
            console.log(event.data);
            if (event.data) this.file = event.data;
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

    sendMessageToSponsorAndHCO(action, ssi, shortMessage, fileSSI, fileName) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate());

        this.TrialParticipantRepository.findAll((err, data) => {

            if (err) {
                return console.log(err);
            }

            if (data && data.length > 0) {
                this.model.tp = data[data.length - 1];
                let sendObject = {
                    operation: 'update-econsent',
                    ssi: ssi,
                    useCaseSpecifics: {
                        trialSSI: this.model.historyData.trialuid,
                        tpNumber: this.model.tp.number,
                        tpDid: this.model.tp.did,
                        version: this.model.historyData.ecoVersion,
                        siteSSI: this.model.tp.site?.keySSI,
                        action: {
                            name: action,
                            date: currentDate.toISOString(),
                            toShowDate: currentDate.toLocaleDateString(),
                            isManual: true,
                            fileSSI: fileSSI,
                            attachment: fileName
                        },
                    },
                    shortDescription: shortMessage,
                };
                this.CommunicationService.sendMessage(this.model.tp.sponsorIdentity, sendObject);
                this.CommunicationService.sendMessage(this.model.tp.hcoIdentity, sendObject);
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
        });
    };

    _saveEconsent() {
        this.EconsentsStatusRepository.update(
            this.model.uid,
            {
                ...this.model.status,
            },
            (err, data) => {
                if (err) {
                    return console.log(err);
                }
                this._finishActionSave();
            }
        );
    }

    _finishActionSave(fileSSI, fileName) {
        this.navigateToPageTag('home');
        this.sendMessageToSponsorAndHCO('sign', this.model.historyData.ecoId, 'TP signed econsent ', fileSSI, fileName);
    }

    async _saveStatus(operation) {
        await this.EconsentsStatusRepository.updateAsync(this.model.status.uid, this.model.status);
        let eco = await this.EcosentService.saveEconsentAsync(this.model.econsent, '/econsents/' + this.model.econsent.id);
        let finalPath = this.TrialConsentService.PATH + '/' + this.TrialConsentService.ssi + '/ifc/'
            + this.model.econsent.uid + '/versions/' + this.model.historyData.ecoVersion + '/signed_manually';
        this.TrialConsentService.saveEconsentFile(this.file, finalPath, (err, data) => {
            if (err) {
                return console.log(err);
            }
            let fileName = this.file[0].name;
            this._finishActionSave(eco.KeySSI, fileName);
        });

        if (this.model.status === undefined || this.model.status.uid === undefined) {
            //TODO implement when status is not set => optional consents
            return;
        }

    }
}
