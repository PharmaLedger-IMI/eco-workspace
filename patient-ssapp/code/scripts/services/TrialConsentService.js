const ecoServices = require('eco-services');
const DSUService = ecoServices.DSUService;

export default class TrialConsentService extends DSUService {

    ssi = null;

    constructor() {
        super('/trial_consent');
    }

    getOrCreate = (callback) => {
        let classThis = this;
        if (this.ssi !== null) {
            return this.getEntity(this.ssi, (err, entity) => {
                if (err) {
                    return callback(err);
                }
                this.fillObjectWithVolatileSubItems(entity, (err, data) => callback(err, data))
            })
        }
        this.getEntities((err, trialConsents) => {
            if (err) {
                return callback(err);
            }
            if (typeof trialConsents !== 'undefined' && trialConsents.length > 0) {
                let trialConsent = trialConsents[0];
                classThis.ssi = trialConsent.uid;
                return this.fillObjectWithVolatileSubItems(trialConsent, (err, data) => callback(err, data))
            }
            this.saveEntity({}, (err, entity) => {
                if (err) {
                    return callback(err);
                }
                classThis.ssi = entity.uid;
                this.fillObjectWithVolatileSubItems(entity, (err, data) => callback(err, data))
            })
        })
    }

    fillObjectWithVolatileSubItems = (entity, callback) => {
        this.getEntities(this.PATH + '/' + entity.uid, (err, subEntities) => {
            if (err) {
                return callback(err);
            }
            entity.volatile = {};
            subEntities.forEach((item) => {
                if (entity.volatile[item.objectName] === undefined) {
                    entity.volatile[item.objectName] = [];
                }
                entity.volatile[item.objectName].push(item);
            })
            callback(undefined, entity);
        })
    }

    getOrCreateAsync = async () => {
        return this.asyncMyFunction(this.getOrCreate, [])
    }

    mountIFCAsync = async (ifcSSI) => {
        return await this.mountSubEntityAsync(ifcSSI, 'ifc');
    }

    mountHCODSU = (hcoDsuSSI, callback) => {
        this.mountSubEntity(hcoDsuSSI, 'hco_dsu', callback);
    }

    mountVisit = (visitSSI, callback) => {
        this.mountSubEntity(visitSSI, 'visit', callback);
    }

    mountSubEntity = (subEntitySSI, subEntityName, callback) => {
        if (this.ssi != null) {
            return this.mountEntity(subEntitySSI, this._getSubPath(subEntityName), () => this.getOrCreate(callback));
        }
        this.getOrCreate((err, entity) => {
            if (err) {
                return callback(err);
            }
            this.mountEntity(subEntitySSI, this._getSubPath(subEntityName), () => this.getOrCreate(callback));
        })
    }

    mountSubEntityAsync = async (subEntitySSI, subEntityName) => {
        if (this.ssi != null) {
            await this.mountEntityAsync(subEntitySSI, this._getSubPath(subEntityName));
            return await this.getOrCreateAsync();
        }
        await this.getOrCreateAsync();
        await this.mountEntityAsync(subEntitySSI, this._getSubPath(subEntityName));
        return await this.getOrCreateAsync();
    }

    saveEconsentFile = (file, path, callback) => {
        this.letDSUStorageInit().then(() => {
            this.DSUStorage.uploadFile(path, file, undefined, (err, keySSI) => {
                    if (err) {
                        return callback(err, undefined);
                    }
                    callback(err, keySSI);
                }
            );
        });
    }

    _getSubPath = (subItem) => {
        return this.PATH + '/' + this.ssi + '/' + subItem;
    }
}