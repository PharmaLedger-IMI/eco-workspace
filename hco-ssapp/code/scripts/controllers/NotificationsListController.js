import NotificationsRepository from "../repositories/NotificationsRepository.js";

const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        notifications: [],
        notType: ''
    };
};

export default class NotificationsListController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel(getInitModel());
        this.model.notificationType = this.history.win.history.state.state.notType;
        this._initServices(this.DSUStorage);
        this._initNotifications();
        this._initHandlers();
    }

    _initHandlers() {
        this._attachHandlerBack();
        this._attachHandlerTrialParticipants();
    }

    _initServices(DSUStorage) {
        this.NotificationsRepository = NotificationsRepository.getInstance(DSUStorage);
    }

    _initNotifications() {

        this.NotificationsRepository.findAll((err, data) => {

            if (err) {
                return console.log(err);
            }

            this.model.notifications = data.filter(not => not.type.trim() === this.model.notificationType.trim())
        });
    }

    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }

    _attachHandlerTrialParticipants() {
        this.onTagEvent('goToAction', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            if (model.recommendedAction === 'view trial') {
                this.navigateToPageTag('trial-participants', model.ssi);
            }
            if (model.recommendedAction === 'view trial participants') {
                this.navigateToPageTag('trial-participants', model.ssi);
            }

            if (model.recommendedAction === 'view visits') {

                this.navigateToPageTag('visits-procedures', {
                    trialSSI: this.model.ssi,
                    tpUid: this.model.tpUid,
                });
            }

        });
    }


}
