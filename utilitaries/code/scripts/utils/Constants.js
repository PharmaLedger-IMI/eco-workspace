const MESSAGES = {
    HCO: {
        COMMUNICATION: {
            SPONSOR: {
                SIGN_ECONSENT: 'HCO signed econsent'
            },
            PATIENT: {
                ADD_TO_TRIAL: 'You were added to trial',
                REFRESH_TRIAL: 'Trial needs to be refreshed.'
            }
        },
        FEEDBACK: {
            SUCCESS: {
                ADD_TRIAL_PARTICIPANT: 'Trial participant added successfully!'
            },
            ERROR: {
                ADD_TRIAL_PARTICIPANT: 'ERROR: There was an issue creating the trial participant'
            }
        }
    }
}

const ECO_STATUSES = {
    TO_BE_SIGNED :'Acknowledgement required',
    WITHDRAW :'TP Withdrawed',
    CONTACT: 'Reconsent required'
}

const TRIAL_PARTICIPANT_STATUS = {
    ENROLLED :'Enrolled',
    WITHDRAW :'Withdrawed',
    DECLINED: 'Declined',
    SCREENED: 'Screened'
}
export default {
    MESSAGES,
    ECO_STATUSES,
    TRIAL_PARTICIPANT_STATUS
};