const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        name: {
            label: 'Name and Surname',
            name: 'name',
            required: true,
            placeholder: 'Please insert the trial participant full name ..',
            value: '',
        },

        did: {
            label: 'Public Identifier',
            name: 'did',
            required: true,
            placeholder: 'Please insert the trial PUBLIC identifier',
            value: '',
        },
        birthdate: {
            label: 'Birth Date:',
            name: 'date',
            required: true,
            dataFormat: 'MM YYYY',
            placeholder: 'MM YYYY',
            type: 'month',
            value: '',
        },
        didParent1: {
            label: 'Parent 1 Public Identifier',
            name: 'did',
            required: true,
            placeholder: 'Please insert the parent 1 PUBLIC identifier',
            value: '',
        },
        didParent2: {
            label: 'Parent 2 Public Identifier',
            name: 'did',
            required: true,
            placeholder: 'Please insert the parent 2 PUBLIC identifier',
            value: '',
        },
        attachment : {
            label: 'Select files',
            listFiles: true,
            filesAppend: false,
            files: [],
        },

        gender: {
            label: 'Select your gender',
            required: true,
            options: [
                {
                    label: 'Male',
                    value: 'M',
                },
                {
                    label: 'Female',
                    value: 'F',
                },
            ],
            value: '',
        },

    };
};

export default class AddTrialParticipantController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel(getInitModel());
        this._initHandlers();
    }

    _initHandlers() {
        this._attachHandlerSubmit();
    }

    _attachHandlerSubmit() {
        this.onTagEvent('tp:submit', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            const trialParticipant = {
                name: this.model.name.value,
                lastName: this.model.lastName.value,
                did: this.model.did.value,
                birthdate: this.model.birthdate.value,
                gender: this.model.gender.value,
            };
            this.send('confirmed', trialParticipant);
        });
    }
}
