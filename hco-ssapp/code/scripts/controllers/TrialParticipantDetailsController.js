const {WebcController} = WebCardinal.controllers;
import TrialService from '../services/TrialService.js';
import TrialParticipantsService from '../services/TrialParticipantsService.js';
import CommunicationService from '../services/CommunicationService.js';
import TrialParticipantRepository from '../repositories/TrialParticipantRepository.js';

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
            consentsSigned: [{name: 'V1 - Assent Form 1'}, {name: 'V1 - Parental Consent'}]
        });
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initTrialParticipant(this.model.trialSSI);
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
    }

    _initHandlers() {
        this._attachHandlerGoBack();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    async _initTrialParticipant(keySSI) {
        this.model.trialParticipant = await this.TrialParticipantRepository.findByAsync(this.model.tpUid);

        let userActions = await this._getUserActionsFromEconsents(keySSI, this.model.trialParticipant.did);


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

    async _getUserActionsFromEconsents(keySSI, tpNumber) {
        // TODO: re-check this logic.
        let userActions = [];
        (await this.TrialService.getEconsentsAsync(keySSI))
            .forEach(econsent => {
                if (econsent.versions === undefined) {
                    return userActions;
                }
                econsent.versions.forEach(version => {
                    if (version.actions === undefined) {
                        return userActions;
                    }
                    version.actions.forEach(action => {
                        if (action.tpNumber === tpNumber) {
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
