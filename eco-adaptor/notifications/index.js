function getFlow(receivedDomain = "default") {
    const domainConfig = require("../utils").getClusterDomainConfig(receivedDomain);
    if (!domainConfig) {
        console.log('Deployment Domain not found : ', receivedDomain);
        return null;
    }
    let flow = $$.flow.start(domainConfig.type);
    flow.init(domainConfig)
    return flow;
}

let genericCallback = (response, err, result) => {
    if (err) {
        if (err.code === 'EACCES') {
            return response.send(409);
        }
        return response.send(500);
    }
    response.send(200, result);
};

function getNotifications(request, response, next) {
    let flow = getFlow();
    if (flow === null) {
        return response.send(500);
    }
    flow.findNotifications((err, data) => genericCallback(response, err, data));
}

function getNotificationBy(request, response, next) {
    let flow = getFlow();
    if (flow === null) {
        return response.send(500);
    }
    flow.findNotificationBy(request.params.notificationId, (err, data) => genericCallback(response, err, data));
}

module.exports = {
    getNotifications,
    getNotificationBy
};