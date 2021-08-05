const MESSAGES = {
    HCO: {
        COMMUNICATION: {
            SPONSOR: {
                SIGN_ECONSENT: 'HCO signed econsent',
                VISIT_CONFIRMED : 'HCO confirmed a visit'
            },
            PATIENT: {
                ADD_TO_TRIAL: 'You were added to trial',
                REFRESH_TRIAL: 'Trial needs to be refreshed.',
                SCHEDULE_VISIT : 'A visit was scheduled.',
                VISIT_DECLINED: 'A visit was declined by the patient',
                VISIT_ACCEPTED: 'A visit was accepted by the patient'
            },
            TYPE :{
                ADD_TO_TRIAL : 'add-to-trial',
                SCHEDULE_VISIT: 'schedule-visit',
                VISIT_RESPONSE: 'visit-response',
                VISIT_CONFIRMED: 'visit-confirmed'
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
    CONTACT: 'Reconsent required',
    DECLINED: 'TP Declined'
}

const NOTIFICATIONS_TYPE  = {

    TRIAL_UPDATES: 'Trial Updates',
    WITHDRAWS: 'Withdraws',
    CONSENT_UPDATES: 'Consent Updates',
    MILESTONES_REMINDERS : 'Milestones Reminders',
    TRIAL_SUBJECT_QUESTIONS: 'Trial Subject Questions'
}

const TRIAL_PARTICIPANT_STATUS = {
    ENROLLED :'Enrolled',
    WITHDRAW :'Withdrawed',
    DECLINED: 'Declined',
    SCREENED: 'Screened',
    PLANNED: 'Planned'
}
export default {
    MESSAGES,
    ECO_STATUSES,
    TRIAL_PARTICIPANT_STATUS,
    NOTIFICATIONS_TYPE
};