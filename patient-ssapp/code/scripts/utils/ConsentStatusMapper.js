export default class ConsentStatusMapper {

    static consentStatuses = {
        required: {
            name: 'Required',
            valueNumber: 2,
            details: 'Main Consent Signed',
            isSet: false,
        },
        entered: {
            name: 'Entered',
            valueNumber: 2,
            details: 'Main Consent Signed',
            isSet: false,
        },
        enrolled: {
            name: 'Enrolled',
            valueNumber: 3,
            details: 'Tp Seem eligible for the trial',
            isSet: false,

        },
        completed: {
            name: 'Completed',
            valueNumber: 4,
            details: 'Tp has completed the planed treatment',
            isSet: false,
        },
        withdraw: {
            name: 'Withdraw',
            valueNumber: 4,
            details: 'Tp has withdraw the consent',
            isSet: false,
        },
        withdrawIntention: {
            name: 'Withdraw Intention',
            valueNumber: 4,
            details: 'Tp intent to withdraw the consent',
            isSet: false,
        },
        decline: {
            name: 'Declined',
            valueNumber: 4,
            details: 'Tp has declined the consent',
            isSet: false,
        },
        signed: {
            name: 'Signed',
            valueNumber: 2,
            details: 'Main Consent Signed',
            isSet: false,
        },
    }

    static getStatus = (consentStatus) => {
        if (!(typeof consentStatus === 'string')) {
            return undefined;
        }
        let consent = Object.keys(this.consentStatuses)
            .find(key => this.consentStatuses[key].name.toLowerCase() === consentStatus.toLowerCase());
        return !consent ? undefined : this.consentStatuses[consent];
    }

    static map(consentStatus) {
        let status = this.getStatus(consentStatus.name);
        consentStatus.details = status.details;
        consentStatus.valueNumber = status.valueNumber;
        return consentStatus;
    }

    static isSigned = (actions) => this.actionHasLastStatus(actions, 'signed')

    static isWithdraw = (actions) => this.actionHasLastStatus(actions, 'withdraw')

    static isWithdrawIntention = (actions) => this.actionHasLastStatus(actions, 'withdraw-intention')

    static isDeclined = (actions) => this.actionHasLastStatus(actions, 'decline');

    static isRequired = (actions) => this.actionHasLastStatus(actions, 'required');

    static actionHasLastStatus(actions, status) {
        let latestActionStatusIndex = this.getLatestStatusIndexIfActionsAreValid(actions);
        if (latestActionStatusIndex === -1) {
            return false;
        }
        return actions[latestActionStatusIndex].name.toLowerCase() === status;
    }

    static getLatestStatusIndexIfActionsAreValid(actions) {
        if (actions === undefined || actions.length === 0) {
            return -1;
        }
        return actions.length === 1 ? 0 : actions.length - 1;
    }
}