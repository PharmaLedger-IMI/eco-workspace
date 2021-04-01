import Constants from "../Constants.js";
import EcoAdaptorApi from "../../../EcoAdaptorApi.js";

export default class TrialDataService {

    constructor(DSUStorage) {
        this.DSUStorage = DSUStorage;
        this.EcoAdaptorApi = new EcoAdaptorApi();
    }

    getSite(id, callback) {
        this.EcoAdaptorApi.getSite(id, (err, response) => {
            if (err) {
                return console.log(err);
            }
            callback(undefined, response);
        })
    }

    getEconsent(trialId, econsentId, callback) {
        this.EcoAdaptorApi.getEconsent(trialId, econsentId, (err, response) => {
            if (err) {
                return console.log(err);
            }
            callback(undefined, response);
        })
    }

    getTrial(id, callback) {
        this.EcoAdaptorApi.getTrial(id, (err, response) => {
            if (err) {
                return console.log(err);
            }
            callback(undefined, response);
        })
    }

    getNotifications(callback) {
        this.EcoAdaptorApi.getNotifications((err, response) => {
            if (err) {
                return console.log(err);
            }
            callback(undefined, response);
        })
    }

    getNotification(id, callback) {
        this.EcoAdaptorApi.getNotification(id, (err, response) => {
            if (err) {
                return console.log(err);
            }
            callback(undefined, response);
        })
    }

    updateNotification(notification, callback) {
        let notificationIndex = Constants.notifications.findIndex(notif => notif.id === notification.id)
        if (notificationIndex === -1) {
            return callback(`Notification with id ${notification.id} not exist.`);
        }
        Constants.notifications[notificationIndex] = JSON.parse(JSON.stringify(notification));
        callback(undefined, JSON.parse(JSON.stringify(notification)));
    }

    getSites(callback) {
        this.EcoAdaptorApi.getSites((err, response) => {
            if (err) {
                return console.log(err);
            }
            callback(undefined, response);
        })
    }

    getEconsents(trialId) {
        this.EcoAdaptorApi.getEconsents(trialId, (err, response) => {
            if (err) {
                return console.log(err);
            }
            callback(undefined, response);
        })
    }

    getTrials(callback) {
        this.EcoAdaptorApi.getTrials((err, response) => {
            if (err) {
                return console.log(err);
            }
            callback(undefined, response);
        })
    }


}
