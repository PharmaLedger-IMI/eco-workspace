const getSharedStorage = require('../services/SharedStorage.js');

const TABLE_NAMES = {
    ALL: {
        DID_IDENTITIES: 'did_identities'
    },
    PATIENT: {
        NOTIFICATIONS: "notifications",
        TRIAL_PARTICIPANT: "trials_participant",
        ECOSESENT_STATUSES: "econsents_statuses",
        VISITS: "visits",
        QUESTIONS: "questions"
    },
    HCO: {
        NOTIFICATIONS: "notifications",
        TRIAL_PARTICIPANTS: "trials_participants",
        VISITS: "visits",
        TRIALS: "trials",
        QUESTIONS: "questions"
    }
}

class BaseRepository {

    constructor(tableName) {
        this.StorageService = getSharedStorage.getInstance();
        this.tableName = tableName;
    }

    create = (key, value, callback) => this.StorageService.insertRecord(this.tableName, key, value, callback);

    createAsync = (key, value) => this.StorageService.insertRecordAsync(this.tableName, key, value);

    findBy = (key, callback) => this.StorageService.getRecord(this.tableName, key, callback);

    findByAsync = async (key) => this.StorageService.getRecordAsync(this.tableName, key);

    findAll = (callback) => this.StorageService.getAllRecords(this.tableName, callback);

    findAllAsync = async () => this.StorageService.getAllRecordsAsync(this.tableName);

    filter = (query, sort, limit, callback) => this.StorageService.filter(this.tableName, query, sort, limit, callback);

    filterAsync = async (query, sort, limit) => this.StorageService.filterAsync(this.tableName, query, sort, limit);

    update = (key, value, callback) => this.StorageService.updateRecord(this.tableName, key, value, callback);

    updateAsync = (key, value) => this.StorageService.updateRecordAsync(this.tableName, key, value);
}

const getInstance = (tableName, DSUStorage) => {
    if (!allTables.includes(tableName)) {
        throw  new Error(`The table ${tableName} does not exists!`);
    }
    return new BaseRepository(tableName, DSUStorage);
}

let toBeReturnedObject = {
    getInstance,
    identities: TABLE_NAMES
}

const allTables = [];

Object.keys(TABLE_NAMES).forEach(workspaceKey => {
    let workspace = TABLE_NAMES[workspaceKey];
    allTables.push(...Object.values(workspace));
})

module.exports = toBeReturnedObject;