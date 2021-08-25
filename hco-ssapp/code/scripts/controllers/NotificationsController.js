import NotificationsRepository from "../repositories/NotificationsRepository.js";
import Constants from "../utils/Constants.js";

const {WebcController} = WebCardinal.controllers;


let getInitModel = () => {
    return {
        notifications: [],
        notTypes: {
            trialUpdates: false,
            withdraws: false,
            consentUpdates: false,
            milestones: false,
            questions: false
        }
    };
};

export default class NotificationsController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel(getInitModel());

        this._initServices(this.DSUStorage);
        this._initNotifications();
        this._initHandlers();
    }

    _initHandlers() {
        this._attachHandlerBack();
        this._attachHandlerNavigateToNotificationsList();
    }


    _initServices(DSUStorage) {
        this.NotificationsRepository = NotificationsRepository.getInstance(DSUStorage);
    }

    _initNotifications() {
        this.model.notTypes.trialUpdates = true;
        this.model.notTypes.consentUpdates = true;

        this.NotificationsRepository.findAll((err, data) => {
            if (err) {
                return console.log(err);
            }
            this.model.notifications = data;

            this.model.notTypes.trialUpdates = this.model.notifications.filter(not => not.type === Constants.NOTIFICATIONS_TYPE.TRIAL_UPDATES)?.length > 0;
            this.model.notTypes.withdraws = this.model.notifications.filter(not => not.type === Constants.NOTIFICATIONS_TYPE.WITHDRAWS)?.length > 0;
            this.model.notTypes.consentUpdates = this.model.notifications.filter(not => not.type === Constants.NOTIFICATIONS_TYPE.CONSENT_UPDATES)?.length > 0;
            this.model.notTypes.milestones = this.model.notifications.filter(not => not.type === Constants.NOTIFICATIONS_TYPE.MILESTONES_REMINDERS)?.length > 0;
            this.model.notTypes.questions = this.model.notifications.filter(not => not.type === Constants.NOTIFICATIONS_TYPE.TRIAL_SUBJECT_QUESTIONS)?.length > 0;
        });
    }

    _attachHandlerNavigateToNotificationsList() {
        this.onTagEvent('notifications', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('notifications-list', {
                notType: target.textContent,
            });
        });
    }

    _newNotificationsForTypes(notificationType) {

    }

    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }

}
