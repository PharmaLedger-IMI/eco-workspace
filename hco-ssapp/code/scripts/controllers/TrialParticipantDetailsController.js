import HCOService from "../services/HCOService.js";
import TrialService from '../services/TrialService.js';
import TrialParticipantsService from '../services/TrialParticipantsService.js';

const {WebcController} = WebCardinal.controllers;


const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const BaseRepository = ecoServices.BaseRepository;

let getInitModel = () => {
    return {
        trial: {},
        trialParticipants: [],
    };
};

export default class TrialParticipantDetailsController extends WebcController {

    constructor(...props) {
        super(...props);
        this.setModel({
            ...getInitModel(),
            ...this.history.win.history.state.state,
            consentsSigned: [],
            userActionsToShow: []
        });
        this._initServices();
        this._initHandlers();
    }

    async _initServices() {
        this.TrialService = new TrialService();
        this.TrialParticipantService = new TrialParticipantsService();
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.TRIAL_PARTICIPANTS);
        this.HCOService = new HCOService();
        this.model.hcoDSU = await this.HCOService.getOrCreateAsync();
        this._initTrialParticipant(this.model.trialSSI);
    }

    _initHandlers() {
        this._attachHandlerGoBack();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    async _initTrialParticipant(keySSI) {
        let trialParticipant = this.model.hcoDSU.volatile.tps.find(tp => tp.uid === this.model.tpUid);
        let nonObfuscatedTps = await this.TrialParticipantRepository.filterAsync(`did == ${trialParticipant.did}`);
        if (nonObfuscatedTps.length > 0) {
            trialParticipant.name = nonObfuscatedTps[0].name;
        }
        this.model.trialParticipant = trialParticipant;

        let userActions = await this._getUserActionsFromEconsents(keySSI, this.model.trialParticipant.did);
        userActions = userActions.filter(ua => ua.action.type === 'tp');
        let userActionsToShow = [
            {
                name: 'Enrolled',
                date: this.model.trialParticipant.enrolledDate
            }
        ];
        userActions.forEach(ua => {
            let actualAction = ua.action;
            userActionsToShow.push({
                name: actualAction.status,
                date: actualAction.toShowDate
            })
        })
        this.model.userActionsToShow = userActionsToShow;
        this.model.lastAction = userActions.length === 0 ? undefined : userActions[userActions.length - 1].action.name
            .split('-')
            .filter(action => action.length > 0)
            .map(action => action.charAt(0).toUpperCase() + action.slice(1))
            .join(" ");

        this.model.consentsSigned = userActions
            .filter(ac => ac.action.name === 'sign')
            .map(ac => ac.version.version + ' - ' + ac.econsent.name)

        let lastBadActions = userActions
            .filter(ac => ac.action.name === 'withdraw-intention' || ac.action.name === 'withdraw')

        let lastBadAction = lastBadActions.length === 0 ? undefined : lastBadActions[lastBadActions.length - 1]

        let initials = lastBadAction === undefined ? 'N/A' : lastBadAction.action.name
            .split('-')
            .filter(action => action.length > 0)
            .map(action => action.charAt(0).toUpperCase())
            .join("");
        this.model.lastBadAction = lastBadAction === undefined ? 'N/A'
            : initials + ' - ' + lastBadAction.action.toShowDate;
    }

    async _getUserActionsFromEconsents(keySSI, tpDid) {
        // TODO: re-check this logic.
        let userActions = [];
        this.model.hcoDSU.volatile.icfs
            .forEach(econsent => {
                if (econsent.versions === undefined) {
                    return userActions;
                }
                econsent.versions.forEach(version => {
                    if (version.actions === undefined) {
                        return userActions;
                    }
                    version.actions.forEach(action => {
                        if (action.tpDid === tpDid) {
                            userActions.push({
                                econsent: {
                                    uid: econsent.uid,
                                    keySSI: econsent.keySSI,
                                    name: econsent.name,
                                    type: econsent.type,
                                },
                                version: {
                                    attachmentKeySSI: version.attachmentKeySSI,
                                    version: version.version,
                                    versionDate: version.versionDate,
                                },
                                action: action
                            })
                        }
                    })
                })
            });
        return userActions;
    }

    _showFeedbackToast(title, message, alertType = 'toast') {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }

    _attachHandlerGoBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }
}
