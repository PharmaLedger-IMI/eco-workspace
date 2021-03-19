export default class Constants {
    static notificationTypes = {
        ECONSENT: {
            name: 'econsent',
            icon: 'assets/images/document_black.png'
        },
        QUESTION: {
            name: 'question',
            icon: 'assets/images/question_black.png'
        },
        TRIAL: {
            name: 'trial',
            icon: 'assets/images/hospital_black.png'
        },
    }

    static getIconByNotificationType = (notificationType) => {
        debugger
        if (!(typeof notificationType === 'string')) {
            return undefined;
        }
        let notification = Object.keys(this.notificationTypes)
            .find(key => this.notificationTypes[key].name.toLowerCase() === notificationType.toLowerCase());
        if (!notification) {
            return undefined;
        }
        return this.notificationTypes[notification].icon;
    }

}