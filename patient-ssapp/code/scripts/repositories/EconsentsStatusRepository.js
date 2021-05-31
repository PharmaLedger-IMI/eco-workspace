import SharedStorage from "../services/SharedStorage.js";

class EconsentsStatusRepository {

    constructor(DSUStorage) {
        this.StorageService = SharedStorage.getInstance(DSUStorage);
        this.tableName = 'econsents_statuses';
    }

    create = (key, trialParticipant, callback) =>
        this.StorageService.insertRecord(this.tableName, key, trialParticipant, callback);

    createAsync = (key, trialParticipant) =>
        this.StorageService.insertRecordAsync(this.tableName, key, trialParticipant);

    findBy = (trialKey, callback) => this.StorageService.getRecord(this.tableName, trialKey, callback);

    findAll = (callback) => this.StorageService.getAllRecords(this.tableName, callback);

    findAllAsync = async () => this.StorageService.getAllRecordsAsync(this.tableName);

    filter = (query, sort, limit, callback) => this.StorageService.filter(this.tableName, query, sort, limit, callback);

    filterAsync = async (query, sort, limit) =>
        this.StorageService.filterAsync(this.tableName, query, sort, limit);

    update = (key, trialParticipant, callback) =>
        this.StorageService.updateRecord(this.tableName, key, trialParticipant, callback);

    updateAsync = (key, trialParticipant) =>
        this.StorageService.updateRecordAsync(this.tableName, key, trialParticipant);

}

export default {
    getInstance: (DSUStorage) => {
        if (typeof window.econsentsStatusRepositoryInstance === "undefined") {
            window.econsentsStatusRepositoryInstance = new EconsentsStatusRepository(DSUStorage);
        }
        return window.econsentsStatusRepositoryInstance;
    }
}
