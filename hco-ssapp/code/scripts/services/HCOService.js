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

    mountTrial = (trialSSI, callback) => {
        this.mountSubEntity(trialSSI, 'trial', callback);
    }

    mountVisit = (visitSSI, callback) => {
        this.mountSubEntity(visitSSI, 'visit', callback);
    }

    mountSite = (siteSSI, callback) => {
        this.mountSubEntity(siteSSI, 'site', callback);
    }

    mountIFC = (ifcSSI, callback) => {
        this.mountSubEntity(ifcSSI, 'ifc', callback);
    }

    mountTC = (tcSSI, callback) => {
        this.mountSubEntity(tcSSI, 'tc', callback);
    }

    cloneIFCs = (trialSSI,callback) => {
        if (this.ssi == null) {
            return callback(this.PATH + ' was not initialized yet.');
        }
        this.getEntities(this.PATH + '/' + this.ssi + '/site', (err, sites) => {
            if (err) {
                return callback(err);
            }
            if (sites.length === 0) {
                return callback(undefined, []);
            }
            let clonedICFS = [];
            let site = sites.find(site => site.trialKeySSI === trialSSI);
            let siteConsents = site.consents;
            let icfsPath = this.PATH + '/' + this.ssi + '/icfs'+"/"+trialSSI;
            let icfsDSUService = new DSUService(icfsPath);
            icfsDSUService.getEntities((err, existingICFS) => {
                if (err) {
                    return callback(err);
                }
                let getServiceDsu = (consent) => {
                    if (consent === undefined && siteConsents.length === 0) {
                        return callback(undefined, []);
                    }
                    let consentExist = existingICFS.find(ifc => ifc.genesisSSI === consent.uid);
                    if (consentExist !== undefined) {
                        return getServiceDsu(siteConsents.pop());
                    }
                    consent = {
                        ...consent,
                        genesisSSI: consent.uid
                    }
                    this.cloneDSU(consent.genesisSSI, icfsPath + '/', (err, cloneDetails) => {
                        if (err) {
                            return getServiceDsu(siteConsents.pop());
                        }
                        clonedICFS.push(cloneDetails);
                        if (siteConsents.length === 0) {
                            return callback(undefined, clonedICFS);
                        }
                        getServiceDsu(siteConsents.pop());
                    })
                };
                if (siteConsents.length === 0) {
                    return callback(undefined, []);
                }
                getServiceDsu(siteConsents.pop());
            });
        });
    }

    addTrialParticipant = (tp, callback) => {
        let anonymousTP = this.anonymizeParticipant(tp);
        let tpSubPath = this._getSubPath('tps');
        if (this.ssi !== null) {
            return this.getEntity(this.ssi, (err, entity) => {
                if (err) {
                    return callback(err);
                }
                this.saveEntity(anonymousTP, tpSubPath, (err, entity) => callback(err, entity));
            })
        }
        this.saveEntity(anonymousTP, tpSubPath, (err, entity) => callback(err, entity));
    }

    addTrialParticipantAsync = async (tp) => {
        return this.asyncMyFunction(this.addTrialParticipant, [tp])
    }

    anonymizeParticipant = (tp) => {
        return {
            ...tp,
            birthdate: '-',
            enrolledDate: '-',
            name: '-',
        };
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


