export default class Constants {
    static notificationTypes = {
        ECONSENT: {
            name: 'econsent',
            icon: 'assets/images/document_black.png',
            page: 'econsent'
        },
        QUESTION: {
            name: 'question',
            icon: 'assets/images/question_black.png',
            page: 'question'
        },
        TRIAL: {
            name: 'trial',
            icon: 'assets/images/hospital_black.png',
            page: 'trial'
        },
    }

    static getNotificationType = (notificationType) => {
        if (!(typeof notificationType === 'string')) {
            return undefined;
        }
        let notification = Object.keys(this.notificationTypes)
            .find(key => this.notificationTypes[key].name.toLowerCase() === notificationType.toLowerCase());
        if (!notification) {
            return undefined;
        }
        return this.notificationTypes[notification];
    }

    static getIconByNotificationType = (notificationType) => {
        let notification = this.getNotificationType(notificationType);
        return notification === undefined ? notification : notification.icon;
    }

    static getPageByNotificationType = (notificationType) => {
        let notification = this.getNotificationType(notificationType);
        return notification === undefined ? notification : notification.page;
    }

    // TO BE REMOVED AFTER OPENDSU INTEGRATION:

    static trials = [
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

    static sites = [
        {
            id: 1,
            name: "site 12",
            hcp: "01/05/2021",
            phone: "074328959743",
            address: "lorem ipsum",
            email: "fsd@fds.com"
        },
        {
            id: 2,
            name: "site 45",
            hcp: "01/05/2021",
            phone: "074328959743",
            address: "lorem ipsum",
            email: "fsd@fds.com"
        },
        {
            id: 3,
            name: "site 78",
            hcp: "01/05/2021",
            phone: "074328959743",
            address: "lorem ipsum",
            email: "fsd@fds.com"
        }
    ];

    static econsents = [
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

    static notifications = [
        {
            id: 1,
            name: "Status update",
            startDate: "01/05/2021",
            details: "lorem ipsum lorem ipsum lorem ipsum lorem",
            type: 'econsent',
            entityId: 2,
            viewed: false
        },
        {
            id: 2,
            name: "Dr responded to question",
            startDate: "01/05/2021",
            details: "lorem ipsum lorem ipsum lorem ipsum lorem",
            type: 'question',
            entityId: 3,
            viewed: true
        },
        {
            id: 3,
            name: "New trial will start soon",
            startDate: "01/05/2021",
            details: "lorem ipsum lorem ipsum lorem ipsum lorem",
            type: 'trial',
            entityId: 1,
            viewed: false
        }
    ]
}