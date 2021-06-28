import DSUService from "./DSUService.js";

export default class SiteService extends DSUService {

    constructor(DSUStorage) {
        super(DSUStorage, '/site');
    }

    getSite = (uid, callback) => this.getEntity(uid, callback);

    saveSite = (data, callback) => this.saveEntity(data, callback);

    mountSite = (keySSI, callback) => this.mountEntity(keySSI, callback);

    unmountSite = (keySSI, callback) => this.unmountEntity(keySSI, callback);

    updateSite = (data, callback) => this.updateEntity(data, callback);

    reMountSite = (keySSI, callback) => {
        this.unmountSite(keySSI, () => this.mountSite(keySSI, callback))
    };

    getEconsents = (trialSSI, callback) => this.getEntities(this._getEconsentsPath(trialSSI), callback);

    getEconsentsAsync = (trialSSI) => this.getEntitiesAsync(this._getEconsentsPath(trialSSI));

    getEconsent = (trialSSI, econsentSSI, callback) => this.getEntity(econsentSSI, this._getEconsentsPath(trialSSI), callback)

    updateEconsent = (trialSSI, data, callback) => this.updateEntity(data, this._getEconsentsPath(trialSSI), callback);

    _getEconsentsPath = (keySSI) => this.PATH + '/' + keySSI + '/consent';
}
