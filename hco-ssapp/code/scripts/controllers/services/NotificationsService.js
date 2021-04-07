import NotificationModel from "../../models/NotificationModel.js";

export default class NotificationsService {

    NOTIFICATION_PATH = "/notifications";

    constructor(DSUStorage) {
        this.DSUStorage = DSUStorage;
    }

    getServiceModel(callback) {
        this.DSUStorage.call('listDSUs', this.NOTIFICATION_PATH, (err, dsuList) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            let notifications = [];
            let getServiceDsu = (dsuItem) => {
                this.DSUStorage.getItem(this._getDsuStoragePath(dsuItem.identifier), (err, content) => {
                    if (err) {
                        notifications.slice(0);
                        callback(err, undefined);
                        return;
                    }
                    let textDecoder = new TextDecoder("utf-8");
                    let not = JSON.parse(textDecoder.decode(content));
                    notifications.push(not);

                    if (dsuList.length === 0) {
                        const model = new NotificationModel()._getWrapperData();
                        model.notifications = notifications;
                        callback(undefined, model);
                        return;
                    }
                    getServiceDsu(dsuList.shift());
                })
            };


            if (dsuList.length === 0) {
                const model = new NotificationModel()._getWrapperData();
                callback(undefined, model);
                return;
            }
            getServiceDsu(dsuList.shift());
        })

    }

    getNotification(uid, callback) {
        this.DSUStorage.getItem(this._getDsuStoragePath(uid), (err, content) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            let textDecoder = new TextDecoder("utf-8");
            let not = JSON.parse(textDecoder.decode(content));
            callback(undefined, not);
        })
    }

    saveNotification(data, callback) {
        this.DSUStorage.call('createSSIAndMount', this.NOTIFICATION_PATH, (err, keySSI) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            data.KeySSI = keySSI;
            data.uid = keySSI;
            this.updateNotification(data, callback);
        })
    }

    mountNotification(keySSI, callback) {
        this.DSUStorage.call('mount', this.NOTIFICATION_PATH, keySSI, (err) => {
            if (err) {
                return callback(err, undefined);
            }

            this.getNotification(keySSI, (err, org) => {
                if (err) {
                    return callback(err, undefined);
                }
                callback(undefined, org);
            })


        })
    }

    updateNotification(data, callback) {
        this.DSUStorage.setObject(this._getDsuStoragePath(data.uid), data, (err) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            callback(undefined, data);
        })
    }

    unmountNotification(uid, callback) {
        let unmountPath = this.NOTIFICATION_PATH + '/' + uid;
        this.DSUStorage.call('notificationUnmount', unmountPath, (err, result) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            callback(undefined, result);
        });
    }

    _getDsuStoragePath(keySSI) {
        return this.NOTIFICATION_PATH + '/' + keySSI + '/data.json';
    }
}