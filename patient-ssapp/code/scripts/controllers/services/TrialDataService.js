export default class TrialDataService {

    constructor(DSUStorage) {
        this.DSUStorage = DSUStorage;
    }

    trials = [
        {
            id: 1,
            name: "trial name 1",
            startDate: "01/05/2021",
            details: "lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
            siteId: 1,
            econsentId: 1,
            visits: [
                {
                    id: 1,
                    date: "01/05/2021"
                },
                {
                    id: 2,
                    date: "05/05/2021"
                }
            ]
        },
        {
            id: 2,
            name: "trial name 2",
            startDate: "01/05/2021",
            details: "lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
            siteId: 2,
            econsentId: 3,
            visits: [
                {
                    id: 3,
                    date: "01/05/2021"
                },
                {
                    id: 4,
                    date: "05/05/2021"
                }
            ]
        },
        {
            id: 3,
            name: "trial name 3",
            startDate: "01/05/2021",
            details: "lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
            siteId: 3,
            econsentId: 2,
            visits: [
                {
                    id: 5,
                    date: "01/05/2021"
                },
                {
                    id: 6,
                    date: "05/05/2021"
                }
            ]
        }
    ];

    sites = [
        {
            id: 1,
            name: "site 12",
            hcp: "01/05/2021",
            phone: "074328959743",
            address: "lorem ipsum",
            email: "fsd@fds.com",
            icon: 'assets/images/hospitalfirst.png'
        },
        {
            id: 2,
            name: "site 45",
            hcp: "01/05/2021",
            phone: "074328959743",
            address: "lorem ipsum",
            email: "fsd@fds.com",
            icon: 'assets/images/hospitalsecond.jpg'
        },
        {
            id: 3,
            name: "site 78",
            hcp: "01/05/2021",
            phone: "074328959743",
            address: "lorem ipsum",
            email: "fsd@fds.com",
            icon: 'assets/images/hospitalthird.png'
        }
    ];

    econsents = [
        {
            id: 1,
            name: "site 12",
            version: 1,
            file: 'something',
            documentDate: "01/05/2021",
            providedDate: "06/08/2021",
            hcpDate: "16/25/2022",
            signed: true
        },
        {
            id: 2,
            name: "site 45",
            version: 2,
            file: 'something',
            documentDate: "01/05/2021",
            providedDate: "06/08/2021",
            hcpDate: "16/25/2022",
            signed: false
        },
        {
            id: 3,
            name: "site 78",
            version: 4,
            file: 'something',
            documentDate: "01/05/2021",
            providedDate: "06/08/2021",
            hcpDate: "16/25/2022",
            signed: true
        }
    ];

    notifications = [
        {
            id: 1,
            name: "Status update",
            startDate: "01/05/2021",
            details: "lorem ipsum lorem ipsum lorem ipsum lorem",
            type: 'econsent'
        },
        {
            id: 2,
            name: "Dr responded to question",
            startDate: "01/05/2021",
            details: "lorem ipsum lorem ipsum lorem ipsum lorem",
            type: 'question'
        },
        {
            id: 3,
            name: "New trial will start soon",
            startDate: "01/05/2021",
            details: "lorem ipsum lorem ipsum lorem ipsum lorem",
            type: 'trial'
        }
    ];

    getSite(id, callback) {
        callback(undefined, this.sites.find(site => site.id === id));
    }

    getEconsent(id, callback) {
        callback(undefined, this.econsents.find(econsent => econsent.id === id));
    }

    getTrial(id, callback) {
        let trialIndex = this.trials.findIndex(trial => trial.id === id);
        if (trialIndex === -1) {
            return callback("Trial not found.", undefined);
        }
        let existingTrial = this.trials[trialIndex];
        this.getSite(existingTrial.siteId, (err, data) => {
            existingTrial.site = data;
            this.getEconsent(existingTrial.econsentId, (err, data) => {
                existingTrial.econsent = data;
                callback(undefined, existingTrial);
            });
        });
    }

    getNotifications(callback) {
        callback(undefined, this.notifications);
    }

    getSites(callback) {
        callback(undefined, this.sites);
    }

    getEconsents() {
        callback(undefined, this.econsents);
    }

    getTrials(callback) {
        let trialsCopy = JSON.parse(JSON.stringify(this.trials));
        let auxTrials = []

        let getFullTrials = (trial) => {
            if (trial === undefined) {
                return callback(undefined, auxTrials);
            }
            this.getTrial(trial.id, (err, data) => {
                auxTrials.push(data);
                getFullTrials(trialsCopy.shift())
            });
        }

        if (trialsCopy.length === 0) {
            return callback(undefined, []);
        }
        getFullTrials(trialsCopy.shift());
    }
}
