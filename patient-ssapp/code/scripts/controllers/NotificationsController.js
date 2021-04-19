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
                    ...notification,
                    entitySSI: notification.ssi,
                    name: notification.title,
                    details: notification.shortDescription,
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
            let page = Constants.getPageByNotificationType(model.type)
            if (!model.viewed) {
                model.viewed = true;
                this.NotificationsService.updateNotification(model, (err, data) => {
                    if (err) {
                        return console.log(err);
                    }
                    this.navigateToPageTag(page, model.entitySSI);
                });
            } else {
                this.navigateToPageTag(page, model.entitySSI);
            }
        });
    }

}