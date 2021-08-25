const CommunicationService = require('./CommunicationService.js')

class DIDService {

    constructor(controllerReference) {
        this.controllerReference = controllerReference;
    }

    getDid(callback) {
        this.getObject('environment.json', (err, envFile) => {
            if (err) {
                return callback(err);
            }
            let didPrompt = envFile.didPrompt;
            if (didPrompt === undefined || didPrompt === false) {
                return callback(undefined, undefined);
            }
            this.getObject('did.json', (err, didFile) => {
                if (err || didFile.did === undefined) {
                    return this.controllerReference.showModalFromTemplate(
                        'did-modal',
                        (event) => callback(undefined, event.detail),
                        (event) => {
                        },
                        {
                            controller: '../controllers/DIDModalController',
                            disableExpanding: true,
                            disableBackdropClosing: true,
                            disableCancelButton: true,
                            disableClosing: true,
                        });
                }
                callback(undefined, didFile.did);
            });
        });

    }

    getObject(path, callback) {
        this.controllerReference.DSUStorage.getItem(path, (err, content) => {
            if (err) {
                return callback(err, undefined);
            }
            let textDecoder = new TextDecoder("utf-8");
            let entity = JSON.parse(textDecoder.decode(content));
            callback(undefined, entity);
        })
    }
}

let didServiceInstance = null;
let communicationServiceInstance = null;

let getDid = (controllerReference, callback) => {
    if (typeof callback !== 'function') {
        callback = () => {
        };
    }
    if (didServiceInstance === null) {
        didServiceInstance = new DIDService(controllerReference);
        didServiceInstance.getDid((err, data) => {
            callback(err, data);
            didServiceInstance = null;
        });
    }
}

let getDidAsync = (controllerReference) => {
    return asyncMyFunction(getDid, [controllerReference])
}

let getCommunicationServiceInstance = (controllerReference, callback) => {
    if (communicationServiceInstance !== null) {
        return callback(undefined, communicationServiceInstance);
    }
    let localDidService = new DIDService(controllerReference);
    localDidService.getObject('environment.json', (err, envFile) => {
        let personalIdentity = {};
        if (envFile === undefined) {
            envFile = {
                did: 'mockDID',
                workspace: 'mockDomain'
            }
        }
        personalIdentity.domain = envFile.workspace;

        localDidService.getDid((err, did) => {
            if (err) {
                console.error(err);
                personalIdentity.did = envFile.did;
            } else {
                personalIdentity.did = did;
            }
            communicationServiceInstance = CommunicationService.getInstance(personalIdentity);
            return callback(undefined, communicationServiceInstance);
        });
    });
}

let getCommunicationServiceInstanceAsync = (controllerReference) => {
    return asyncMyFunction(getCommunicationServiceInstance, [controllerReference])
}

let asyncMyFunction = (func, params) => {
    func = func.bind(this)
    return new Promise((resolve, reject) => {
        func(...params, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        })
    })
}

module.exports = {
    getDid,
    getDidAsync,
    getCommunicationServiceInstance,
    getCommunicationServiceInstanceAsync
}