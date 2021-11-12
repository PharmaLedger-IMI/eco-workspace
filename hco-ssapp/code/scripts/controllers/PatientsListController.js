import HCOService from "../services/HCOService.js";

const {WebcController} = WebCardinal.controllers;
import SiteService from '../services/SiteService.js';
import TrialService from '../services/TrialService.js';
import TrialParticipantsService from '../services/TrialParticipantsService.js';


const ecoServices = require('eco-services');

const BaseRepository = ecoServices.BaseRepository;
const Constants = ecoServices.Constants;

let getInitModel = () => {
    return {
        trial: {},
        trialParticipants: [],
        statuses: {
            label: 'Select a status',
            placeholder: 'Please select an option',
            required: false,
            options: []
        },

        notifications: {
            label: 'Select a notification for action ',
            placeholder: 'Please select an option',
            required: false,
            options: []
        },

        search: {
            label: 'Search for a patient',
            required: false,
            placeholder: 'Patient Name ...',
            value: '',
        }
    };
};


export default class PatientsListController extends WebcController {

    constructor(...props) {
        super(...props);
        this.setModel({
            ...getInitModel(),
            trialSSI: this.history.win.history.state.state,
        });
        this._initServices();
    }

    async _initServices() {
        this.TrialService = new TrialService();
        this.TrialParticipantService = new TrialParticipantsService();
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.TRIAL_PARTICIPANTS);
        this.SiteService = new SiteService();
        this.HCOService = new HCOService();
        this.model.hcoDSU = await this.HCOService.getOrCreateAsync();
        this._getTrialParticipants();
        this._initHandlers();
        this._initFilterOptions();
    }

    _initFilterOptions() {
        Object.keys(Constants.ECO_STATUSES).forEach(key => {
            this.model.notifications.options.push({
                label: Constants.ECO_STATUSES[key],
                value: Constants.ECO_STATUSES[key]
            })
        });

        Object.keys(Constants.TRIAL_PARTICIPANT_STATUS).forEach(key => {
            this.model.statuses.options.push({
                label: Constants.TRIAL_PARTICIPANT_STATUS[key],
                value: Constants.TRIAL_PARTICIPANT_STATUS[key]
            })
        });

    }

    _initHandlers() {

        this._attachHandlerNavigateToParticipant();
        this._attachHandlerViewTrialParticipantDetails();
        this._attachHandlerViewTrialParticipantStatus();
        this._attachHandlerGoBack();
        this._attachHandlerFilters();
        this._attachHandlerSearch();
        this._attachHandlerClearFilters();

        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }


    async _getTrialParticipants() {

        this.model.trialParticipants = this.model.hcoDSU.volatile.tps;
        this.model.trialParticipantsFinal = this.model.trialParticipants;
    }

    _attachHandlerNavigateToParticipant() {
        this.onTagEvent('navigate:tp', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-participant', {
                trialSSI: model.trialSSI,
                tpUid: model.uid,
                trialParticipantNumber: model.number,
            });
        });
    }


    _attachHandlerViewTrialParticipantStatus() {
        this.onTagEvent('tp:status', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-participant-details', {
                trialSSI: model.trialSSI,
                tpUid: model.uid
            });
        });
    }

    _attachHandlerViewTrialParticipantDetails() {
        this.onTagEvent('tp:details', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-participant', {
                trialSSI: model.trialSSI,
                tpUid: model.uid
            });
        });
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

    _attachHandlerFilters() {
        this.on('filters-changed', async (event) => {
            this.filterData();
        });

    }

    _attachHandlerSearch() {
        const searchField = this.element.querySelector('#search-field');
        searchField.addEventListener('keydown', () => {
            setTimeout(() => {

                this.filterData();
            }, 300);
        });
    }

    _attachHandlerClearFilters (){
        this.onTagClick('filters-cleared', async (event) => {
            this.model.statuses.value = null;
            this.model.notifications.value = null;
            this.model.search.value = null;
            this.filterData();
        });
    }

    filterData() {
        let result = this.model.trialParticipantsFinal;

        if (this.model.statuses.value) {
            result = result.filter((x) => x.status === this.model.statuses.value);
        }
        if (this.model.notifications.value) {
            result = result.filter((x) => x.actionNeeded === this.model.notifications.value);
        }

        if (this.model.search.value && this.model.search.value !== '') {
            result = result.filter((x) => x.name.toUpperCase().search(this.model.search.value.toUpperCase()) !== -1);
        }

        this.model.trialParticipants = result;
    }
}