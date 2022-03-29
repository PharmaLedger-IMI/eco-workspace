import ConsentService from '../services/ConsentService.js';
import VisitsService from '../services/VisitsService.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class AddNewTrialConsentModalController extends WebcController {
  consentsTemplate = {
    label: 'Select consent',
    placeholder: 'Please select a consent',
    required: true,
    selectOptions: [],
    disabled: false,
  };

  attachment = {
    label: 'Select files',

    listFiles: true,
    filesAppend: false,
    files: [],
  };

  file = null;

  constructor(...props) {
    super(...props);

    this.consents = props[0].consents || null;

    let { id, keySSI, uid } = this.history.location.state;

    this.id = id;
    this.keySSI = keySSI;
    this.uid = uid;

    this.consentsService = new ConsentService(this.DSUStorage);
    this.visitsService = new VisitsService(this.DSUStorage);

    this.setModel({
      consents: {
        ...this.consentsTemplate,
        selectOptions: this.consents.map((x) => ({ value: x.id, label: x.name })),
      },
      visits: { attachment: this.attachment },
    });

    this.attachAll();
  }

  attachAll() {
    this.on('add-file', (event) => {
      if (event.data) this.file = event.data;
    });

    this.model.addExpression(
      'consentsArrayNotEmpty',
      () =>
        !!(
          this.model.consents.selectOptions &&
          Array.isArray(this.model.consents.selectOptions) &&
          this.model.consents.selectOptions.length > 0
        ),
      'consents.selectOptions'
    );

    this.on('add-file', (event) => {
      if (event.data) this.file = event.data;
    });

    this.onTagClick('create-visits', async () => {
      try {
        Papa.parse(this.file[0], {
          complete: async (results, file) => {
            console.log(results, file);

            if (results.data && results.data.length > 0) {
              const dataArray = results.data;
              const visitNamesIdx = dataArray.findIndex((x) => x[0] === 'Visit');
              if (visitNamesIdx && visitNamesIdx >= 0) {
                const length = dataArray[visitNamesIdx].length;

                const titles = dataArray[visitNamesIdx - 1].filter((x) => x !== '');
                const visits = dataArray[visitNamesIdx].slice(1, length);
                const week = dataArray[visitNamesIdx + 1].slice(1, length);
                const day = dataArray[visitNamesIdx + 2].slice(1, length);
                const visitWindow = dataArray[visitNamesIdx + 3].slice(1, length);

                let procedures = dataArray.slice(visitNamesIdx + 4, dataArray.length);

                procedures = procedures.filter((x) => x[0] && x[0] !== '' && x[0] !== ' ');

                const result = visits.map((visit, idx) => {
                  const uuid = uuidv4();
                  return {
                    id: idx,
                    uuid,
                    name: visit,
                    week: parseInt(week[idx]),
                    day: parseInt(day[idx]),
                    titles,
                    visitWindow:
                      visitWindow[idx] !== 'X'
                        ? {
                            windowFrom: parseInt(visitWindow[idx].split('/')[0]),
                            windowTo: parseInt(visitWindow[idx].split('/')[1]),
                          }
                        : null,
                    procedures: procedures.map((procedure, procedureIdx) => ({
                      name: procedure[0],
                      uuid: uuidv4(),
                      checked: procedure[idx + 1] === 'X' ? true : false,
                      id: procedureIdx,
                    })),
                  };
                });

                if (this.model.consents.value && this.model.consents.value !== '') {
                  const outcome = await this.visitsService.updateTrialVisits(
                    this.keySSI,
                    result,
                    this.model.consents.value
                  );
                  this.send('confirmed', outcome);
                } else {
                  throw new Error('No consent is selected');
                }
              }
            }
          },
        });

        // setTimeout(() => {
        //   this.model.consent[x] = {
        //     ...this.model.consent[x],
        //     invalidValue: null,
        //   };
        // });
      } catch (error) {
        this.send('closed', new Error('There was an issue creating the visits'));
        console.log(error);
      }
    });
  }
}
