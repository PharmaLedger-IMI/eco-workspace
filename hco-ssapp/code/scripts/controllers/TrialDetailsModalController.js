import ModalController from '../../../cardinal/controllers/base-controllers/ModalController.js';

const initModel = {
    title: {
        name: 'trial',
        label: 'Trial',
        value: 'Trial1',
    },
    date:{
        name: 'date',
        label: 'Date',
        value: 'dd.mm.yyyy',
    },
    description:{
        name: 'description',
        label: 'Description',
        value: 'Loren ipsum test test test test test test 1 ',
    }
}

export default class TrialDetailsModalController extends ModalController {
    constructor(element, history) {
        super(element, history);

        debugger;
        this.setModel(this.getParsedModel(this.model))

    }

    getParsedModel(receivedModel) {
        let model = JSON.parse(JSON.stringify(initModel));
        model = {
            ...model,
            id: receivedModel.id,

            title: {
                ...model.title,
                value: receivedModel.title
            },
            date: {
                ...model.date,
                value: receivedModel.date
            },
            description: {
                ...model.description,
                value: receivedModel.description
            }
        }
        return model;
    }


    _finishProcess(event, response) {
        event.stopImmediatePropagation();
        this.responseCallback(undefined, response);
    };


}
