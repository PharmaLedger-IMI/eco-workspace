const fileService = require("../utils/fileService");

$$.flow.describe('EcoAdaptor', {

    init: function (domainConfig) {

        const endpointURL = new URL(domainConfig.option.endpoint);
        console.log("I am in init method iotadopter"+domainConfig);
        this.commandData = {};
        this.commandData.apiEndpoint = endpointURL.hostname;
        this.commandData.apiPort = endpointURL.port;
        this.commandData.protocol = endpointURL.protocol.replace(':', "");

    },

    listPatients: function (callback) {
        console.log("List patients");
        fileService.readClusters(callback);
    },



    addPatient: function (jsonData, callback) {
        const body = {
            patientName: jsonData.patientName
        };
        console.log("addPatient", body);
        return callback(undefined, body);
    }
});
