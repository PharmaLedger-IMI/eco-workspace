import DSUService from "./DSUService.js";

export default class TrialService extends DSUService {

    constructor(DSUStorage) {
        super(DSUStorage, '/trials');
    }

    getTrials = (callback) => this.getEntities(callback);

    getTrial = (uid, callback) => this.getEntity(uid, callback);

    saveTrial = (data, callback) => this.saveEntity(data, callback);

    mountTrial = (keySSI, callback) => this.mountEntity(keySSI, callback);

    updateTrial = (data, callback) => this.updateEntity(data, callback);

    getEconsents = (trialSSI, callback) => this.getEntities(callback, this._getEconsentsPath(trialSSI));

    getEconsent = (trialSSI, econsentSSI, callback) => this.getEntity(econsentSSI, callback, this._getEconsentsPath(trialSSI))

    updateEconsent = (trialSSI, data, callback) => this.updateEntity(data, callback, this._getEconsentsPath(trialSSI));

    _getEconsentsPath = (keySSI) => this.PATH + '/' + keySSI + '/consent';
}