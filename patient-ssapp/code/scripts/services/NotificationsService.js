import NotificationMapper from "../utils/NotificationMapper.js";
import DSUService from "./DSUService.js";
export default class NotificationsService  extends DSUService {

    constructor(DSUStorage) {
        super(DSUStorage, '/notifications');
    }

    getNotifications = (callback) => this.getEntities(callback);

    getNotification = (uid, callback) => this.getEntity(uid, callback);

    saveNotification(notification, callback) {
        notification = NotificationMapper.map(notification);
        this.saveEntity(notification, callback);
    }

    mountNotification = (keySSI, callback) => this.mountEntity(keySSI, callback);

    updateNotification = (data, callback) => this.updateEntity(data, callback);
}