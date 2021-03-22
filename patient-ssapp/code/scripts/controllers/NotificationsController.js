import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';
import TrialDataService from "./services/TrialDataService.js";
import Constants from "./Constants.js";

export default class NotificationsController extends ContainerController {
    constructor(element, history) {
        super(element, history);

        this.setModel({});

        this.TrialDataService = new TrialDataService(this.DSUStorage);
        this.TrialDataService.getNotifications((err, data) => {
            if(err) {
                return console.log(err);
            }
            this.model.notifications = data.map(notification => {
                return {
                    ...notification,
                    icon: Constants.getIconByNotificationType(notification.type)
                }
            });
        })

        this.attachNotificationNavigateHandler();
    }

    attachNotificationNavigateHandler(){
        this.on('go-to-notification', (event) => {
            let notificationId = event.data;
            let notification = this.model.notifications.find(notification => notification.id === notificationId);
            let page = Constants.getPageByNotificationType(notification.type)
            if (!notification.viewed) {
                notification.viewed = true;
                this.TrialDataService.updateNotification(notification, (err, data) => {
                    if (err) {
                        return console.log(err);
                    }
                    this.History.navigateToPageByTag(page, notification.entityId);
                });
            } else {
                this.History.navigateToPageByTag(page, notification.entityId);
            }
        });
    }

}