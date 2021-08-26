const INIT_MODEL = {
    title: 'Please create your desired DID',
    did: {
        name: 'did',
        required: true,
        placeholder: 'Public identifier',
        value: '',
    },
    confirmedDid: '',
    errorMessage: null,
    successMessage: null
}

const MESSAGES = {
    SUCCESS: 'DID created successfully. You can now share your identity with your friends.',
    ERROR: 'DID does not match the requirements. Please try another one.'
}

const CSS = {
    MODAL_PARENT: {
        display: 'block',
        position: 'fixed',
        zIndex: 999,
        paddingTop: '15%',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        overflow: 'auto',
        backgroundColor: 'rgba(0,0,0,0.4)'
    },
    MODAL_CONTENT: {
        margin: 'auto',
        padding: '20px',
        border: '1px solid #888',
        width: '30%',
        maxWidth: '400px',
        minWidth: '350px',
        height: 'auto',
        backgroundColor: '#fefefe',
        borderRadius: '10px'
    },
    MODAL_HEADER: {
        fontSize: '22px',
        textAlign: 'center'
    },
    MODAL_TOP: {
        margin: '20px 0'
    },
    MODAL_MIDDLE: {
        fontSize: '16px',
        display: 'flex',
        justifyContent: 'center'
    },
    MODAL_FOOTER: {
        margin: '20px 0',
        display: 'flex',
        justifyContent: 'center'
    },
    MODAL_BUTTON: {
        height: 'auto',
        padding: '10px 20px',
        textAlign: 'center',
        textDecoration: 'none',
        textTransform: 'uppercase',
        verticalAlign: 'center',
        fontSize: '16px',
        width: '40%',
        backgroundColor: 'white',
        color: '#008798',
        border: '1px solid #008798',
        borderRadius: '5px'
    }
}

const DID_PATTERN = /^([a-z0-9:@._-]{5,})$/;

module.exports = {
    INIT_MODEL,
    MESSAGES,
    CSS,
    DID_PATTERN
}