
import TrialService from "./services/TrialService.js";
import FileDownloader from "../utils/FileDownloader.js";
const {WebcController} = WebCardinal.controllers;

export default class ReadEconsentController extends WebcController {
    constructor(element, history) {
        super(element, history);
        this.setModel({});
        this.model.econsent = {};
        let econsentTA = {

                name: "econsent",
                required: true,
                value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum'
        }

        this.model.econsentTa = econsentTA;
        debugger;
        this.TrialService = new TrialService(this.DSUStorage);
        this.historyData = this.history.win.history.state.state;
        this.attachHandlerSignEconsent();
        this.readEconsent();

    }

    readEconsent(){
        this.TrialService.getEconsent(this.historyData.trialuid, this.historyData.ecoId, (err, econsent) => {
            if (err) {
                return console.log(err);
            }
            this.model.econsent = econsent;
            this.fileDownloader = new FileDownloader(this.getEconsentFilePath(this.historyData.trialuid, this.historyData.ecoId, econsent.attachment), econsent.attachment);

            this._downloadFile();
            console.log("File downloader" + this.fileDownloader);
        });

    }
    attachHandlerSignEconsent() {
        this.on('econsent:sign', (event) => {

            console.log('withdraw')
            this._finishProcess(event, {
                signed: true,
            });
        });
    }

    _finishProcess(event, response) {
        event.stopImmediatePropagation();
        this.responseCallback(undefined, response);
    };

    _downloadFile = () => {
        this.fileDownloader.downloadFile((downloadedFile) => {
            this.rawBlob = downloadedFile.rawBlob;
            this.mimeType = downloadedFile.contentType;
            this.blob = new Blob([this.rawBlob], {
                type: this.mimeType
            });

            this._readFile ();
            if (this.mimeType.indexOf(TEXT_MIME_TYPE) !== -1) {
                this._prepareTextEditorViewModel();
            } else {
                this._displayFile();
                this._clearUnsavedFileSection();
            }
        });
    }

    _readFile (){
        const reader = new FileReader();
        reader.onload = () => {
            // const textEditorViewModel = {
            //     isEditable: true,
            //     value: reader.result,
            //     oldValue: reader.result,
            //     language: this.mimeType.split(TEXT_MIME_TYPE)[1]
            // };

            this.model.econsentTa.value = reader.result;

            debugger;


        }
        reader.readAsText(this.blob);
    }

    getEconsentFilePath(trialSSI, consentSSI, fileName) {
        return "/trials/" + trialSSI + '/consent/' + consentSSI + '/consent/' + fileName;
    }

}
