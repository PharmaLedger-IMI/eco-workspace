import TrialService from '../services/TrialService.js';
import ConsentStatusMapper from '../utils/ConsentStatusMapper.js';
import EconsentService from "../services/EconsentService.js";


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
        // this.model.status = { attachment: this.attachment };
        this._initServices(this.DSUStorage);
        this.model.historyData = this.history.win.history.state.state;
        this._initConsent();
        this._initHandlers();
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.PATIENT_IDENTITY);
        this.EconsentsStatusRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.ECOSESENT_STATUSES, DSUStorage);
        this.EcosentService = new EconsentService(DSUStorage);
        this.TrialParticipantRepository =  BaseRepository.getInstance(BaseRepository.identities.PATIENT.TRIAL_PARTICIPANT, DSUStorage);
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
        this._attachHandlerSign();
        this._attachHandlerDownload();
        this._attachHandlerAddEconsentFile();
    }

    _finishProcess(event, response) {
        event.stopImmediatePropagation();
        this.responseCallback(undefined, response);
    }

    getEconsentFilePath(trialSSI, consentSSI, fileName) {
        return '/trials/' + trialSSI + '/consent/' + consentSSI + '/consent/' + fileName;
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

        this.EcosentService.saveEconsentFile(this.file, this.model.econsent, (err, data) => {
            if (err){
                console.log(err);
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
