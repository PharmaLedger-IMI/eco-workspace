import NotificationMapper from "../utils/NotificationMapper.js";
const ecoServices = require('eco-services');
const DSUService = ecoServices.DSUService;

export default class NotificationsService extends DSUService {

    constructor() {
        super('/notifications');
    }

    getNotifications = (callback) => this.getEntities(callback);

    saveNotification(notification, callback) {
        notification = NotificationMapper.map(notification);
        this.saveEntity(notification, callback);
    }
}