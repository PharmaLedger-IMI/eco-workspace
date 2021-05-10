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
        if (!consent) {
            return undefined;
        }
        return this.consentStatuses[consent];
    }

    static map(consentStatus) {
        debugger
        let status = this.getStatus(consentStatus.name);
        consentStatus.details = status.details;
        consentStatus.valueNumber = status.valueNumber;
        return consentStatus;
    }

    static isSigned(actions) {
        if (actions) {
            if (actions[actions.length - 1].name.toLowerCase() === this.consentStatuses['signed'].name.toLowerCase()) {
                return true;
            }
        }
        return false;
    }

    static isWithdraw(actions) {
        if (actions) {
            if (actions[actions.length - 1].name.toLowerCase() === this.consentStatuses['withdraw'].name.toLowerCase()) {
                return true;
            }
        }
        return false;
    }

    static isDeclined(actions) {
        if (actions) {
            if (actions[actions.length - 1].name.toLowerCase() === this.consentStatuses['decline'].name.toLowerCase()) {
                return true;
            }
        }
        return false;
    }
}