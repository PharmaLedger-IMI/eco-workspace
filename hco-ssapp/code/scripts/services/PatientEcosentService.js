import DSUService from "./DSUService.js";

export default class PatientEcosentService extends DSUService {

    constructor(DSUStorage, ecoID) {
        super(DSUStorage, '/econsents/'+ecoID);
    }

    getEconsentsAsync = (trialSSI) => this.getEntitiesAsync(this._getEconsentsPath(trialSSI));

    getEconsent = (trialSSI,  callback) => this.getEntity(econsentSSI, this._getEconsentsPath(trialSSI), callback)

    mountEcosent = ( keySSI, callback) => this.mountEntity(keySSI, callback);

    getEconsentAsync = (trialSSI, econsentSSI) => this.getEntityAsync(econsentSSI, this._getEconsentsPath(trialSSI));

    updateEconsent = (trialSSI, data, callback) => this.updateEntity(data, this._getEconsentsPath(trialSSI), callback);

    _getEconsentsPath = (keySSI) => this.PATH + '/' + keySSI + '/consent';




}