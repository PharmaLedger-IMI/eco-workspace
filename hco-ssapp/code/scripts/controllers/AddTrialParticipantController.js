const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        name: {
            label: 'Trial Participant Name',
            name: 'name',
            required: true,
            placeholder: 'Please insert the trial participant name...',
            value: '',
        },
        lastName: {
            label: 'Trial Participant Last Name',
            name: 'lastName',
            required: true,
            placeholder: 'Please insert the trial participant last name',
            value: '',
        },
        did: {
            label: 'DID',
            name: 'did',
            required: true,
            placeholder: 'Please insert the trial participant did',
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
