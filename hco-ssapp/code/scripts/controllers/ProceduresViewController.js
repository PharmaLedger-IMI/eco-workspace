import TrialService from "../services/TrialService.js";

const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const DateTimeService = ecoServices.DateTimeService;
const Constants = ecoServices.Constants;
const BaseRepository = ecoServices.BaseRepository;

const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        procedures: [],
        visit: {}
    };
};

export default class ProceduresViewController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({
            ...getInitModel(),
            ...this.history.win.history.state.state,
        });

        this._initServices();
        this._initHandlers();
        this._initProcedures();
    }

    _initHandlers() {
        this._attachHandlerBack();
        this._attachHandlerDetails();
        this._attachHandlerConfirm();
    }

    _initServices() {
        this.TrialService = new TrialService();
        this.VisitsAndProceduresRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.VISITS);
        this.TrialParticipantRepository = BaseRepository.getInstance(BaseRepository.identities.HCO.TRIAL_PARTICIPANTS);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
    }

    async _initProcedures() {
        this.model.visit = await this.VisitsAndProceduresRepository.findByAsync(this.model.visitUuid);
        this.model.tp = await this.TrialParticipantRepository.findByAsync(this.model.tpUid);
        this.model.procedures = this.model.visit.procedures;

        if (!this.model.tp.visits || this.model.tp.visits.length < 1) {

            this.model.tp.visits = this.model.visits;
            this._updateTrialParticipant();

        } else {

            let visitTp = this.model.tp.visits.filter(v => v.uuid === this.model.visitUuid) [0];
            if (visitTp) {
                this.model.procedures = visitTp.procedures;
            } else {
                this.model.tp.visits.push(this.model.visit);
                this._updateTrialParticipant();
            }
        }

    }


    async _updateTrialParticipant() {
        // this.model.tp.procedures = this.model.procedures;

        await this.TrialParticipantRepository.updateAsync(this.model.tp.uid, this.model.tp);
    }

    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }

    _attachHandlerDetails() {
        this.onTagEvent('viewConsent', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            this.navigateToPageTag('econsent-sign', {
                trialSSI: model.trialSSI,
                econsentSSI: model.consentSSI,
                controlsShouldBeVisible: false
            });
        });
    }


    _updateProcedure(procedure) {

        let objIndex = this.model.procedures.findIndex((obj => obj.id == procedure.id));
        this.model.procedures[objIndex] = procedure;
        let visitTp = this.model.tp.visits.filter(v => v.uuid === this.model.visitUuid) [0];
        visitTp.procedures = this.model.procedures;
        let obj = this.model.tp.visits.findIndex((obj => obj.uuid == visitTp.uuid));
        this.model.tp.visits[obj] = visitTp;
        this._updateTrialParticipant();
    }


    _attachHandlerConfirm() {
        this.onTagEvent('procedure:confirm', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'confirmation-alert',
                (event) => {
                    const response = event.detail;
                    if (response) {
                        model.status = 'Confirmed';
                        this._updateProcedure(model);
                    }
                },
                (event) => {
                    const response = event.detail;
                },
                {
                    controller: 'ConfirmationAlertController',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    question: 'Are you sure that this procedure is completed for patient ? ',
                    title: 'Complete procedure',
                });
        });
    }

}
