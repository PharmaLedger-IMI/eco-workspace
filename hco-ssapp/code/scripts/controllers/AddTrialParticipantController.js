const {WebcController} = WebCardinal.controllers;


export default class AddTrialParticipantController extends WebcController {

    number = {
        label: 'Trial Participant Number',
        name: 'number',
        required: true,
        placeholder: 'Please insert the trial participant number...',
        value: '',
    };

    birthdate= {
        label: "Please indicate the date of the activity",
        name: "date",
        required: true,
        dataFormat: "DD MM YYYY",
        placeholder: "DD MM YYYY",
        value: ''
    };
    gender = {
        label: "Select your gender",
        required: true,
        options: [{
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
    constructor(element, history) {
        super(element, history);


        debugger;
        this.setModel({

            tp: {

                number: this.number,
                birthdate: this.birthdate,
                gender: this.gender,
            },

        });
        this._attachHandlerSubmit();
    }

    _attachHandlerSubmit() {

        debugger;
        this.onTagEvent('tp:submit', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                debugger;
                console.log(this.model.tp.birthdate.value);
                const tp = {
                    number: this.model.tp.number.value,
                    birthdate: this.model.tp.birthdate.value,
                    gender: this.model.tp.gender.value,

                };
                this.send('confirmed', tp);

            }
        )
    }



}
