const ecoServices = require('eco-services');
const DSUService = ecoServices.DSUService;

export default class TrialService extends DSUService {

    constructor() {
        super('/trials');
    }

    getTrials = (callback) => this.getEntities(callback);

    getTrial = (uid, callback) => this.getEntity(uid, callback);

    saveTrial = (data, callback) => this.saveEntity(data, callback);

    mountTrial = (keySSI, callback) => this.mountEntity(keySSI, callback);

    mountTrialAsync = (keySSI) => this.mountEntityAsync(keySSI);

    reMountTrialAsync = async (keySSI) => {
        await this.unmountEntityAsync(keySSI);
        await this.mountEntityAsync(keySSI);
    };

    getTrialAsync = (uid) => this.getEntityAsync(uid);

    updateTrial = (data, callback) => this.updateEntity(data, callback);
    updateTrialAsync = (data) => this.updateEntityAsync(data);

    getEconsents = (trialSSI, callback) => this.getEntities(this._getEconsentsPath(trialSSI), callback);

    getEconsentsAsync = (trialSSI) =>this.getEntitiesAsync(this._getEconsentsPath(trialSSI));

    getEconsent = (trialSSI, econsentSSI, callback) => this.getEntity(econsentSSI, this._getEconsentsPath(trialSSI), callback)

    updateEconsent = (trialSSI, data, callback) => this.updateEntity(data, this._getEconsentsPath(trialSSI), callback);

    _getEconsentsPath = (keySSI) => this.PATH + '/' + keySSI + '/consent';


}