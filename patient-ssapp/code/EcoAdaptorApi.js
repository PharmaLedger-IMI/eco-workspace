const opendsu = require("opendsu");

export default class EcoAdaptorApi {

    ECO_ADAPTER_PATH = "ecoAdapter";
    TRIALS_LIST_PATH = `${this.ECO_ADAPTER_PATH}/trials`;
    SITES_LIST_PATH = `${this.ECO_ADAPTER_PATH}/sites`;
    NOTIFICATIONS_LIST_PATH = `${this.ECO_ADAPTER_PATH}/notifications`;
    TRIAL_LIST_PATH = `${this.ECO_ADAPTER_PATH}/trials/{trialId}`;
    SITE_LIST_PATH = `${this.ECO_ADAPTER_PATH}/sites/{siteId}`;
    NOTIFICATION_LIST_PATH = `${this.ECO_ADAPTER_PATH}/notifications/{notificationId}`;
    ECONSENTS_LIST_PATH = `${this.ECO_ADAPTER_PATH}/trials/{trialId}/econsents`;
    ECONSENT_LIST_PATH = `${this.ECO_ADAPTER_PATH}/trials/{trialId}/econsents/{econsentId}`;

    constructor(serverEndpoint) {
        let SERVER_ENDPOINT = serverEndpoint || window.location.origin;
        if (SERVER_ENDPOINT[SERVER_ENDPOINT.length - 1] !== "/") {
            SERVER_ENDPOINT += "/";
        }
        this.serverEndpoint = SERVER_ENDPOINT;
        const endpointURL = new URL(SERVER_ENDPOINT);
        this.apiEndpoint = endpointURL.hostname;
        this.apiPort = endpointURL.port;
    }


    getSite(siteId, callback) {
        this.makeRequest('GET', this.replaceVariablesInUrlPath(this.SITE_LIST_PATH, [siteId]), {}, callback);
    }

    getSites(callback) {
        this.makeRequest('GET', this.SITES_LIST_PATH, {}, callback);
    }

    getTrial(trialId, callback) {
        this.makeRequest('GET',  this.replaceVariablesInUrlPath(this.TRIAL_LIST_PATH, [trialId]), {}, callback);
    }

    getTrials(callback) {
        this.makeRequest('GET', this.TRIALS_LIST_PATH, {}, callback);
    }

    getNotification(notificationId, callback) {
        this.makeRequest('GET',  this.replaceVariablesInUrlPath(this.NOTIFICATION_LIST_PATH, [notificationId]), {}, callback);
    }

    getNotifications(callback) {
        this.makeRequest('GET', this.NOTIFICATIONS_LIST_PATH, {}, callback);
    }

    getEconsent(trialId, econsentId, callback) {
        debugger;
        this.makeRequest('GET',  this.replaceVariablesInUrlPath(this.ECONSENT_LIST_PATH, [trialId,econsentId]), {}, callback);
    }

    getEconsents(trialId, callback) {
        this.makeRequest('GET',  this.replaceVariablesInUrlPath(this.ECONSENTS_LIST_PATH, [trialId]), {}, callback);
    }

    makeRequest(method, path, body, callback) {
        console.log('[EcoAdapterApiCall][Request]', method, path, JSON.stringify(body));
        const bodyData = JSON.stringify(body);
        const apiHeaders = {
            'Content-Type': 'application/json',
            'Content-Length': bodyData.length
        };
        const options = {
            hostname: this.apiEndpoint,
            port: this.apiPort,
            path,
            method,
            apiHeaders
        };
        if (body && JSON.stringify(body) !== JSON.stringify({})) {
            options.body = bodyData;
        }
        let protocolInit = opendsu.loadAPI('http');
        protocolInit.fetch(this.serverEndpoint + path + "#x-blockchain-domain-request", options)
            .then(response => {
                response.json()
                    .then((data) => {
                        console.log('[EcoAdapterApiCall][Response]', method, path, response.status, response.statusCode, data);
                        if (!response.ok || response.status != 200) {
                            return callback(response);
                        }
                        callback(undefined, data);
                    })
                    .catch(error => {
                        return callback(error);
                    });
            })
            .catch(error => {
                return callback(error);
            })
    }

    replaceVariablesInUrlPath = (path, variables) => {
        if (path === undefined || variables === undefined || variables.constructor !== Array
            || !(typeof path == 'string' || path instanceof String)) {
            return path;
        }
        variables.forEach((v) => path = path.replace(/{[\d\w]+}/, v))
        return path;
    }
}

