const ecoServices = require('eco-services');
const DSUService = ecoServices.DSUService;

export default class HCOService extends DSUService {

    ssi = null;

    constructor() {
        super('/hco_dsu');
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
        this.getEntities((err, hcoDSUs) => {
            if (err) {
                return callback(err);
            }
            if (typeof hcoDSUs !== 'undefined' && hcoDSUs.length > 0) {
                let hcoDSU = hcoDSUs[0];
                classThis.ssi = hcoDSU.uid;
                return this.fillObjectWithVolatileSubItems(hcoDSU, (err, data) => callback(err, data))
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
                entity.volatile[item.objectName] = item;
            })
            callback(undefined, entity);
        })
    }

    getOrCreateAsync = async () => {
        return this.asyncMyFunction(this.getOrCreate, [])
    }

    mountSite = (siteSSI, callback) => {
        this.mountSubEntity(siteSSI, 'site', callback);
    }

    mountSubEntity = (subEntitySSI, subEntityName, callback) => {
        if (this.ssi != null) {
            return this.mountEntity(subEntitySSI, this._getSubPath(subEntityName), callback);
        }
        this.getOrCreate((err, entity) => {
            if (err) {
                return callback(err);
            }
            this.mountEntity(subEntitySSI, this._getSubPath(subEntityName), callback);
        })
    }

    _getSubPath = (subItem) => {
        return this.PATH + '/' + this.ssi + '/' + subItem;
    }
}


