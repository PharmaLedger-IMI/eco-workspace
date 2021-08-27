const {WebcController} = WebCardinal.controllers;
import TrialService from '../services/TrialService.js';
import TrialParticipantsService from '../services/TrialParticipantsService.js';

const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const DateTimeService = ecoServices.DateTimeService;
const Constants = ecoServices.Constants;
const BaseRepository = ecoServices.BaseRepository;
let getInitModel = () => {
    return {
        trial: {},
        trialParticipants: [],
    };
};

export default class TrialDetailsController extends WebcController {

    constructor(...props) {
        super(...props);
        this.setModel({
            ...getInitModel(),
            trialSSI: this.history.win.history.state.state,
            subjects: {
                planned: '',
                screened: '',
                enrolled: '',
                percentage: '',
                withdrew: '',
                declined: '',
            },
            econsents: [],
            econsentsSize: 0
        });
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initTrial(this.model.trialSSI);
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.TRIAL_PARTICIPANTS, DSUStorage);
    }

    _initHandlers() {
        // this._attachHandlerAddTrialParticipant();
        // this._attachHandlerNavigateToParticipant();
        this._attachHandlerNavigateToVersion();
        this._attachHandlerBack();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    _initTrial(keySSI) {
        this.TrialService.getTrial(keySSI, async (err, trial) => {
            if (err) {
                return console.log(err);
            }
            this.model.trial = trial;

            // this.model.trialParticipants1 = await this.TrialParticipantRepository.filterAsync(`trialNumber == ${this.model.trial.id}`, 'asc', 30);
            // this.model.trialParticipants2 = await this.TrialParticipantRepository.filterAsync([`__version >= 0`,`trialNumber == ${this.model.trial.id}`],'asc', 30);
            this.model.trialParticipants = (await this.TrialParticipantRepository.findAllAsync()).filter(tp => tp.trialNumber === this.model.trial.id);
            this.model.subjects.planned = this.model.trialParticipants.length;
            this.model.subjects.enrolled = this.model.trialParticipants.filter(tp => tp.status === Constants.TRIAL_PARTICIPANT_STATUS.ENROLLED).length;
            this.model.subjects.screened = this.model.trialParticipants.filter(tp => tp.status === Constants.TRIAL_PARTICIPANT_STATUS.SCREENED).length;
            this.model.subjects.withdrew = this.model.trialParticipants.filter(tp => tp.status === Constants.TRIAL_PARTICIPANT_STATUS.WITHDRAW).length;
            this.model.subjects.declined = this.model.trialParticipants.filter(tp => tp.status === Constants.TRIAL_PARTICIPANT_STATUS.DECLINED).length;
            this.model.subjects.percentage = ((this.model.subjects.enrolled * 100) / this.model.subjects.planned).toFixed(2) + '%';

            this.TrialService.getEconsents(trial.uid, (err, econsents) => {
                if (err) {
                    return console.log(err);
                }
                this.model.econsents = econsents.map(econsent => {
                    return {
                        ...econsent,
                        versions: econsent.versions.map(v => {
                            return {
                                ...v,
                                econsentSSI: econsent.uid,
                                versionDateAsString: DateTimeService.convertStringToLocaleDate(v.versionDate)
                            }
                        })
                    }
                });
                this.model.econsentsSize = econsents.length;
            })

        });
    }


    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }

    _attachHandlerNavigateToVersion() {
        this.onTagEvent('navigate-to-version', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('econsent-sign', {
                trialSSI: this.model.trialSSI,
                econsentSSI: model.econsentSSI,
                ecoVersion: model.version,
                controlsShouldBeVisible: false
            });

        });
    }

    sendMessageToPatient(operation, ssi, trialParticipantNumber, shortMessage) {
        this.CommunicationService.sendMessage(CommunicationService.identities.ECO.PATIENT_IDENTITY, {
            operation: operation,
            ssi: ssi,
            useCaseSpecifics: {
                tpNumber: trialParticipantNumber,
            },
            shortDescription: shortMessage,
        });
    }

    _showFeedbackToast(title, message, alertType = 'toast') {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }


}
