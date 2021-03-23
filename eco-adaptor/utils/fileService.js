const fs = require('fs');
const path = require('path');

const DATA_FOLDER_PATH = '../data/';
const TRIALS_PATH = DATA_FOLDER_PATH + 'trials.json';
const ECONSENTS_PATH = DATA_FOLDER_PATH + 'econsents.json';
const SITES_PATH = DATA_FOLDER_PATH + 'sites.json';
const NOTIFICATIONS_PATH = DATA_FOLDER_PATH + 'notifications.json';

const readTrials = (callback) => {
    fs.readFile(path.resolve(__dirname, TRIALS_PATH), (err, data) => {
        if (err) {
            return callback(err);
        }
        const trialFile = JSON.parse(data)
        const trials = trialFile.trials;
        if (!trials) {
            return callback(err, []);
        }
        callback(undefined, trials);
    });
};

const readTrial = (id, callback) => {
    readTrials((err, trials) => {
        if (err) {
            return callback(err);
        }
        callback(undefined, trials.find(trial => trial.id == id))
    });
}

const readEconsentsBy = (trialId, callback) => {
    fs.readFile(path.resolve(__dirname, ECONSENTS_PATH), (err, data) => {
        if (err) {
            return callback(err);
        }
        const econsentFile = JSON.parse(data)
        const econsents = econsentFile.econsents;
        if (!econsents) {
            return callback(err, []);
        }
        callback(undefined, econsents.filter(ec => ec.trialId == trialId));
    });
};

const readEconsentBy = (trialId, econsentId, callback) => {
    console.log('readEconsentBy', trialId, econsentId)
    readEconsentsBy(trialId,(err, econsents) => {
        if (err) {
            return callback(err);
        }
        callback(undefined, econsents.find(ec => ec.id == econsentId))
    });
}

const readSites = (callback) => {
    fs.readFile(path.resolve(__dirname, SITES_PATH), (err, data) => {
        if (err) {
            return callback(err);
        }
        const siteFile = JSON.parse(data)
        const sites = siteFile.sites;
        if (!sites) {
            return callback(err, []);
        }
        callback(undefined, sites);
    });
};

const readSite = (id, callback) => {
    readSites((err, sites) => {
        if (err) {
            return callback(err);
        }
        callback(undefined, sites.find(site => site.id == id))
    });
}

const readNotifications = (callback) => {
    fs.readFile(path.resolve(__dirname, NOTIFICATIONS_PATH), (err, data) => {
        if (err) {
            return callback(err);
        }
        const notificationFile = JSON.parse(data)
        const notifications = notificationFile.notifications;
        if (!notifications) {
            return callback(err, []);
        }
        callback(undefined, notifications);
    });
};

const readNotification = (id, callback) => {
    readNotifications((err, notifications) => {
        if (err) {
            return callback(err);
        }
        callback(undefined, notifications.find(notif => notif.id == id))
    });
}

module.exports = {
    readTrials,
    readTrial,
    readEconsentsBy,
    readEconsentBy,
    readSites,
    readSite,
    readNotifications,
    readNotification
}