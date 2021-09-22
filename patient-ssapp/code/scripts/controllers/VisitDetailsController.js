
const {WebcController} = WebCardinal.controllers;

const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const DateTimeService = ecoServices.DateTimeService;
const Constants = ecoServices.Constants;
const BaseRepository = ecoServices.BaseRepository;

let getInitModel = () => {
    return {
        visits: []
    };
};

export default class VisitDetailsController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({
            ...getInitModel(),
            ...this.history.win.history.state.state,

        });
        ;
        this._initServices();
        this._initHandlers();
        this._initVisit();
    }

    _initHandlers() {
        this._attachHandlerBack();
        this._attachHandlerDetails();
        this._attachHandlerSetDate();
    }

    _initServices() {
        this.VisitsAndProceduresRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.VISITS);
        this.TrialParticipantRepository =  BaseRepository.getInstance(BaseRepository.identities.PATIENT.TRIAL_PARTICIPANT);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
    }

    async _initVisit() {

         this.VisitsAndProceduresRepository.findBy(this.model.visitUID, (err,data)=>{
             if(err){
                 console.log(err);
             }
             this.model.visit = data;
         });


    }

    _updateTrialParticipantVisit(visit) {
        if (!this.model.tp.visits)
            this.model.tp.visits = this.visits;

        let objIndex = this.model.tp.visits.findIndex((obj => obj.uid == visit.uid));
        this.model.tp.visits[objIndex] = visit;
        this.TrialParticipantRepository.updateAsync(this.model.tp.uid, this.model.tp);
        this.sendMessageToPatient(visit);
    }

    _updateTrialParticipant() {
        this.model.tp.visits = this.model.visits;
        this.TrialParticipantRepository.updateAsync(this.model.tp.uid, this.model.tp);
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

    _attachHandlerSetDate() {
        this.onTagEvent('procedure:setDate', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'set-procedure-date',
                (event) => {

                    let date = new Date();
                    date.setTime(event.detail);
                    model.date = date.toISOString(),
                        this._updateVisit(model);
                    this._updateTrialParticipantVisit(model);
                },
                (event) => {
                    const response = event.detail;
                }
            ),
                {
                    controller: 'SetProcedureDateController',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    title: 'Set Procedure Date',
                };
        });
    }

    _updateVisit(visit) {
        let objIndex = this.model.visits.findIndex((obj => obj.uid == visit.uid));
        this.model.visits[objIndex] = visit;
    }

    sendMessageToPatient(visit) {
        this.CommunicationService.sendMessage(this.model.tp.did, {
            operation: Constants.MESSAGES.HCO.COMMUNICATION.TYPE.SCHEDULE_VISIT,
            ssi: visit.trialSSI,
            useCaseSpecifics: {
                tpDid: this.model.tp.did,
                trialSSI: visit.trialSSI,
                visit: {
                    details: visit.details,
                    toRemember: visit.toRemember,
                    procedures: visit.procedures,
                    name: visit.name,
                    period: visit.period,
                    consentSSI: visit.consentSSI,
                    date: visit.date,
                    unit: visit.unit,
                    id: visit.id
                },
            },
            shortDescription: Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.SCHEDULE_VISIT
        });
    }


}
