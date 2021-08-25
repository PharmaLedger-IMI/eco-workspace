const ecoServices = require('eco-services');
const SharedStorage = ecoServices.SharedStorage;

class QuestionsRepository {

    constructor(DSUStorage) {
        this.StorageService = SharedStorage.getInstance(DSUStorage);
        this.tableName = 'questions';
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

export default {
    getInstance: (DSUStorage) => {
        if (typeof window.questionRepositoryInstance === "undefined") {
            window.questionRepositoryInstance = new QuestionsRepository(DSUStorage);
        }
        return window.questionRepositoryInstance;
    }
}
