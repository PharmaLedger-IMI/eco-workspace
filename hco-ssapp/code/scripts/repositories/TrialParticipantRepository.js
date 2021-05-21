import SharedStorage from "../services/SharedStorage.js";

class TrialParticipantRepository {

    constructor(DSUStorage) {
        this.StorageService = SharedStorage.getInstance(DSUStorage);
        this.tableName = 'trials_participants';
    }

    create = (key, trialParticipant, callback) =>
        this.StorageService.insertRecord(this.tableName, key, trialParticipant, callback);

    createAsync = (key, trialParticipant) =>
        this.StorageService.insertRecordAsync(this.tableName, key, trialParticipant);

    findBy = (trialKey, callback) => this.StorageService.getRecord(this.tableName, trialKey, callback);

    findAll = (callback) => this.StorageService.getAllRecords(this.tableName, callback);

    findAllAsync = async () => this.StorageService.getAllRecordsAsync(this.tableName);

    update = (key, trialParticipant, callback) =>
        this.StorageService.updateRecord(this.tableName, key, trialParticipant, callback);

    updateAsync = (key, trialParticipant) =>
        this.StorageService.updateRecordAsync(this.tableName, key, trialParticipant);

}

export default {
    getInstance: (DSUStorage) => {
        if (typeof window.trialParticipantRepositoryInstance === "undefined") {
            window.trialParticipantRepositoryInstance = new TrialParticipantRepository(DSUStorage);
        }
        return window.trialParticipantRepositoryInstance;
    }
}
