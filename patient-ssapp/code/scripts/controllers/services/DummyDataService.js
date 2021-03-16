import TrialModel from '../../models/EDIaryModel.js';

export default class DummyDataService {

    constructor(DSUStorage) {
        this.DSUStorage = DSUStorage;
    }

    sites = [
        {id: 1, name: "site 12", phone: "074328959743", address: "lorem ipsum", email: "fsd@fds.com"},
        {id: 2, name: "site 45", phone: "074328959743", address: "lorem ipsum", email: "fsd@fds.com"},
        {id: 3, name: "site 78", phone: "074328959743", address: "lorem ipsum", email: "fsd@fds.com"}
    ];

    getSites(callback) {
        callback(undefined, this.sites)
        return;
    }

    getSite(id, callback) {
        callback(undefined, this.sites.find(site => site.id === id));
        return;
    }

    getTrials() {

    }

    getEconsents() {

    }
}
