import SharedStorage from "./SharedStorage.js";

const TABLE_NAMES = {
    PATIENT: {
        NOTIFICATIONS: "notifications",
        TRIAL_PARTICIPANT: "notifications",
        VISITS: "notifications",
        TRIALS: "notifications",
    },
    HCO: {
        NOTIFICATIONS: "notifications",
        TRIAL_PARTICIPANT_REPOSITORY: "trials_participants",
        VISITS: "visits",
        TRIALS: "notifications",
        QUESTIONS:"questions"
    }
}

class BaseRepository {


    constructor(DSUStorage, tableName) {
        this.StorageService = SharedStorage.getInstance(DSUStorage);
        this.tableName = tableName;
    }

    create = (key, question, callback) =>
        this.StorageService.insertRecord(this.tableName, key, question, callback);

    createAsync = (key, question) =>
        this.StorageService.insertRecordAsync(this.tableName, key, question);

    findBy = (trialKey, callback) => this.StorageService.getRecord(this.tableName, trialKey, callback);

    findAll = (callback) => this.StorageService.getAllRecords(this.tableName, callback);

    findAllAsync = async () => this.StorageService.getAllRecordsAsync(this.tableName);

    filter = (query, sort, limit, callback) => this.StorageService.filter(this.tableName, query, sort, limit, callback);

    filterAsync = async (query, sort, limit) =>
        this.StorageService.filterAsync(this.tableName, query, sort, limit);

    update = (key, question, callback) =>
        this.StorageService.updateRecord(this.tableName, key, question, callback);

    updateAsync = (key, question) =>
        this.StorageService.updateRecordAsync(this.tableName, key, question);

}


const getInstance = (DSUStorage) => {
    if (typeof window.baseRepository === "undefined" || window.baseRepository.tableName != tableName) {
        window.baseRepository = new BaseRepository(DSUStorage, tableName);
    }
    return window.baseRepository;
}
let toBeReturnedObject = {
    getInstance,
    TABLE_NAMES
}

module.exports = toBeReturnedObject;