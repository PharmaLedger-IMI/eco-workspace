import DSUService from "./DSUService.js";

export default class EconsentService extends DSUService {

    constructor(DSUStorage) {
        super(DSUStorage, '/econsents');
    }

    getEconsents = (callback) => this.getEntities(callback);

    getEconsent = (uid, callback) => this.getEntity(uid, callback);

    saveEconsent = (data, callback) => this.saveEntity(data, callback);

    mountEconsent = (keySSI, callback) => this.mountEntity(keySSI, callback);

    updateEconsent = (data, callback) => this.updateEntity(data, callback);

    unmountEconsent = (uid, callback) => this.unmountEntity(data, callback);
}