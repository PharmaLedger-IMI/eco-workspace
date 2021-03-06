import NotificationMapper from "../utils/NotificationMapper.js";
import DSUService from "./DSUService.js";

export default class NotificationsService extends DSUService {

    constructor(DSUStorage) {
        super(DSUStorage, '/notifications');
    }

    getNotifications = (callback) => this.getEntities(callback);

    saveNotification(notification, callback) {
        notification = NotificationMapper.map(notification);
        this.saveEntity(notification, callback);
    }
}