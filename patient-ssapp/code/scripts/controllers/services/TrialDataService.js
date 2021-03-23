import Constants from "../Constants.js";
import EcoAdaptorApi from "../../../EcoAdaptorApi.js";

export default class TrialDataService {

    constructor(DSUStorage) {
        this.DSUStorage = DSUStorage;
        this.EcoAdaptorApi = new EcoAdaptorApi();
    }

    getSite(id, callback) {
        callback(undefined, JSON.parse(JSON.stringify(Constants.sites.find(site => site.id === id))));
    }

    getEconsent(id, callback) {
        callback(undefined, JSON.parse(JSON.stringify(Constants.econsents.find(econsent => econsent.id === id))));
    }

    getTrial(id, callback) {
        let trialIndex = Constants.trials.findIndex(trial => trial.id === id);
        if (trialIndex === -1) {
            return callback("Trial not found.", undefined);
        }
        let existingTrial = Constants.trials[trialIndex];
        this.getSite(existingTrial.siteId, (err, data) => {
            existingTrial.site = data;
            this.getEconsent(existingTrial.econsentId, (err, data) => {
                existingTrial.econsent = data;
                callback(undefined, JSON.parse(JSON.stringify(existingTrial)));
            });
        });
    }

    getNotifications(callback) {
        callback(undefined, JSON.parse(JSON.stringify(Constants.notifications)));
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
        this.EcoAdaptorApi.getSites((err, sites) => {
            debugger
            if (err) {
                return console.log(err);
            }
            callback(undefined, sites);
        })
    }

    getEconsents() {
        callback(undefined, JSON.parse(JSON.stringify(Constants.econsents)));
    }

    getTrials(callback) {
        let trialsCopy = JSON.parse(JSON.stringify(Constants.trials));
        let auxTrials = []

        let getFullTrials = (trial) => {
            if (trial === undefined) {
                return callback(undefined, JSON.parse(JSON.stringify(auxTrials)));
            }
            this.getTrial(trial.id, (err, data) => {
                auxTrials.push(data);
                getFullTrials(trialsCopy.shift())
            });
        }

        if (trialsCopy.length === 0) {
            return callback(undefined, []);
        }
        getFullTrials(trialsCopy.shift());
    }


}
