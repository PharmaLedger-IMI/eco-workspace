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

function getTrials(request, response, next) {
    let flow = getFlow();
    if (flow === null) {
        return response.send(500);
    }
    flow.findTrials((err, data) => genericCallback(response, err, data));
}

function getTrial(request, response, next) {
    let flow = getFlow();
    if (flow === null) {
        return response.send(500);
    }
    console.log(request.params)
    flow.findTrialBy(request.params.trialId, (err, data) => genericCallback(response, err, data));
}

function getEconsents(request, response, next) {
    let flow = getFlow();
    if (flow === null) {
        return response.send(500);
    }
    flow.findEconsents(request.params.trialId, (err, data) => genericCallback(response, err, data));
}

function getEconsent(request, response, next) {
    let flow = getFlow();
    if (flow === null) {
        return response.send(500);
    }
    flow.findEconsent(request.params.trialId, request.params.econsentId, (err, data) => genericCallback(response, err, data));
}

module.exports = {
    getTrials,
    getTrial,
    getEconsents,
    getEconsent
};