const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        number: {
            label: 'Trial Participant Number',
            name: 'number',
            required: true,
            placeholder: 'Please insert the trial participant number...',
            value: '',
        },
        birthdate: {
            label: "Birth Date:",
            name: "date",
            required: true,
            dataFormat: "MM YYYY",
            placeholder: "MM YYYY",
            value: ''
        },
        gender: {
            label: "Select your gender",
            required: true,
            options: [
                {
                    label: "Male",
                    value: 'M'
                },
                {
                    label: "Female",
                    value: "F"
                }
            ],
            value: ''
        }
    }
}

export default class AddTrialParticipantController extends WebcController {

    constructor(element, history) {
        super(element, history);
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
                    number: this.model.number.value,
                    birthdate: this.model.birthdate.value,
                    gender: this.model.gender.value,
                };
                this.send('confirmed', trialParticipant);
            }
        )
    }

}
