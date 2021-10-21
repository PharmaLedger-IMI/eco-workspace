import HCOService from '../services/HCOService.js';
const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        title: 'HomePage',
        trials: [],
        trialsModel: {
            title: {
                name: 'trial',
                label: 'Trial',
                value: 'Trial1',
            },
            date: {
                name: 'date',
                label: 'Date',
                value: 'dd.mm.yyyy',
            },
            description: {
                name: 'description',
                label: 'Description',
                value: 'Loren ipsum test test test test test test 1 ',
            },
        },
    };
};

export default class TrialManagementController extends WebcController {
    constructor(...props) {
        super(...props);

        this.setModel(getInitModel());
        this._initServices();
        this._initHandlers();
    }

    async _initServices() {
        this.HCOService = new HCOService();
        this.model.hcoDSU = await this.HCOService.getOrCreateAsync();
        this.model.trials = this.model.hcoDSU.volatile.trial !== undefined ? this.model.hcoDSU.volatile.trial : [];
    }

    _initHandlers() {
        this._attachHandlerTrialDetails();
        this._attachHandlerTrialParticipants();
        this._attachHandlerBack();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    _attachHandlerTrialDetails() {
        this.onTagEvent('trials:details', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-details', model.keySSI);
        });
    }

    _attachHandlerTrialParticipants() {
        this.onTagEvent('trials:participants', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-participants', model.keySSI);
        });
    }

    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }

}
