const fileService = require("../utils/fileService");

$$.flow.describe('EcoAdaptor', {

    init: function (domainConfig) {
        const endpointURL = new URL(domainConfig.option.endpoint);
        this.commandData = {};
        this.commandData.apiEndpoint = endpointURL.hostname;
        this.commandData.apiPort = endpointURL.port;
        this.commandData.protocol = endpointURL.protocol.replace(':', "");
    },

    findTrials: function (callback) {
        fileService.readTrials(callback);
    },

    findTrialBy: function (id, callback) {
        fileService.readTrial(id, callback);
    },

    findEconsents: function (trialId, callback) {
        fileService.readEconsentsBy(trialId, callback);
    },

    findEconsent: function (trialId, econsentId, callback) {
        fileService.readEconsentBy(trialId, econsentId, callback);
    },

    findSites: function (callback) {
        fileService.readSites(callback);
    },

    findSiteBy: function (id, callback) {
        fileService.readSite(id, callback);
    },

    findNotifications: function (callback) {
        fileService.readNotifications(callback);
    },

    findNotificationBy: function (id, callback) {
        fileService.readNotification(id, callback);
    },

    addPatient: function (jsonData, callback) {
        const body = {
            patientName: jsonData.patientName
        };
        console.log("addPatient", body);
        return callback(undefined, body);
    }
});
