import SharedStorage from "../services/SharedStorage.js";

class VisitsAndProceduresRepository {

    constructor(DSUStorage) {
        this.StorageService = SharedStorage.getInstance(DSUStorage);
        this.tableName = 'visits';
    }

    create = (key, visit, callback) =>
        this.StorageService.insertRecord(this.tableName, key, visit, callback);

    createAsync = (key, visit) =>
        this.StorageService.insertRecordAsync(this.tableName, key, visit);

    findBy = (trialKey, callback) => this.StorageService.getRecord(this.tableName, trialKey, callback);

    findAll = (callback) => this.StorageService.getAllRecords(this.tableName, callback);

    findAllAsync = async () => this.StorageService.getAllRecordsAsync(this.tableName);

    filter = (query, sort, limit, callback) => this.StorageService.filter(this.tableName, query, sort, limit, callback);

    filterAsync = async (query, sort, limit) =>
        this.StorageService.filterAsync(this.tableName, query, sort, limit);

    update = (key, visit, callback) =>
        this.StorageService.updateRecord(this.tableName, key, visit, callback);

    updateAsync = (key, visit) =>
        this.StorageService.updateRecordAsync(this.tableName, key, visit);

    delete = (key,callback) => this.StorageService.deleteRecord(this.tableName, key, callback);

}

export default {
    getInstance: (DSUStorage) => {
        if (typeof window.visitsInstance === "undefined") {
            window.visitsInstance = new VisitsAndProceduresRepository(DSUStorage);
        }
        return window.visitsInstance;
    }
}