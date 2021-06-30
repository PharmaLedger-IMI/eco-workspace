import DSUService from "./DSUService.js";

export default class TrialService extends DSUService {

    constructor(DSUStorage) {
        super(DSUStorage, '/trials');
    }

    getTrials = (callback) => this.getEntities(callback);

    getTrial = (uid, callback) => this.getEntity(uid, callback);

    saveTrial = (data, callback) => this.saveEntity(data, callback);

    mountTrial = (keySSI, callback) => this.mountEntity(keySSI, callback);

    unmountTrial = (keySSI, callback) => this.unmountEntity(keySSI, callback);

    updateTrial = (data, callback) => this.updateEntity(data, callback);

    updateTrialAsync = (data) => this.updateEntityAsync(data);

    reMountTrial = (keySSI, callback) => {
        this.unmountTrial(keySSI, () => this.mountTrial(keySSI, callback))
    };

    getEconsents = (trialSSI, callback) => this.getEntities(this._getEconsentsPath(trialSSI), callback);

    getEconsentsAsync = (trialSSI) => this.getEntitiesAsync(this._getEconsentsPath(trialSSI));

    getEconsent = (trialSSI, econsentSSI, callback) => this.getEntity(econsentSSI, this._getEconsentsPath(trialSSI), callback)

    updateEconsent = (trialSSI, data, callback) => this.updateEntity(data, this._getEconsentsPath(trialSSI), callback);

    _getEconsentsPath = (keySSI) => this.PATH + '/' + keySSI + '/consent';
}