import TrialDataService from "./services/TrialDataService.js";
import Constants from "./Constants.js";
import NotificationsService from "./services/NotificationsService.js";

const {WebcController} = WebCardinal.controllers;

export default class NotificationsController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.setModel({});
        this.model.notifications = [];

        this.TrialDataService = new TrialDataService(this.DSUStorage);
        this.NotificationsService = new NotificationsService(this.DSUStorage);

        this.NotificationsService.getNotifications((err, data) => {
            debugger
            if(err) {
                return console.log(err);
            }
            this.model.notifications.push(...data.notifications.map(notification => {
                return {
                    id: notification.uid,
                    entitySSI: notification.ssi,
                    name: notification.title,
                    details: notification.shortDescription,
                    startDate: notification.startDate,
                    viewed: notification.viewed,
                    type: notification.page,
                    icon: Constants.getIconByNotificationType(notification.page)
                }
            }));
        })

        this.attachNotificationNavigateHandler();
    }

    attachNotificationNavigateHandler(){
        this.onTagEvent('go-to-notification', 'click', (model, target, event) => {
            debugger
            let notificationId = model.id;
            let notification = this.model.notifications.find(notification => notification.id === notificationId);
            let page = Constants.getPageByNotificationType(notification.type)
            if (!notification.viewed) {
                notification.viewed = true;
                this.NotificationsService.updateNotification(notification, (err, data) => {
                    if (err) {
                        return console.log(err);
                    }
                    this.navigateToPageTag(page, notification.entitySSI);
                });
            } else {
                this.navigateToPageTag(page, notification.entitySSI);
            }
        });
    }

}