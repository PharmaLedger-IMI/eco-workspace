import { countryListAlpha2 } from '../constants/countries.js';
import SitesService from '../services/SitesService.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class AddNewSiteModalController extends WebcController {
  trialCountriesArray = Object.entries(countryListAlpha2)
    .map(([k, v]) => `${v}, ${k}`)
    .join(' | ');

  countries = {
    label: 'List of countries',
    placeholder: 'Please select an option',
    required: true,
    selectOptions: this.trialCountriesArray,
    selectionType: 'multiple',
  };

  name = {
    label: 'Health Care Professional Last Name',
    name: 'name',
    required: true,
    placeholder: 'Please insert a name...',
    value: '',
  };

  id = {
    label: 'Site Number/ID',
    name: 'id',
    required: true,
    placeholder: 'Please insert an Id...',
    value: '',
  };

  did = {
    label: 'Site DID',
    name: 'did',
    required: true,
    placeholder: 'Please insert the site DID...',
    value: '',
  };

  constructor(...props) {
    super(...props);

    this.existingIds = props[0].existingIds;
    this.trialKeySSI = props[0].trialKeySSI;

    this.sitesService = new SitesService(this.DSUStorage);

    this.setModel({
      site: {
        id: this.id,
        name: this.name,
        countries: this.countries,
        did: this.did,
      },
      submitButtonDisabled: true,
    });

    this.attachAll();
  }

  attachAll() {
    const idField = this.element.querySelector('#id-field');
    idField.addEventListener('keydown', () => {
      setTimeout(() => {
        if (this.existingIds.indexOf(this.model.site.id.value) > -1) {
          this.model.site.id = {
            ...this.model.site.id,
            invalidValue: true,
          };
          return;
        }
        this.model.site.id = {
          ...this.model.site.id,
          invalidValue: null,
        };
      }, 300);
    });

    this.onTagClick('create-site', async (event) => {
      try {
        let valid = true;
        for (const x in this.model.site) {
          if (!this.model.site[x].value || this.model.site[x].value === '') {
            this.model.site[x] = {
              ...this.model.site[x],
              invalidValue: true,
            };
            setTimeout(() => {
              this.model.site[x] = {
                ...this.model.site[x],
                invalidValue: null,
              };
            }, 1000);
            valid = false;
          }
        }

        if (this.existingIds.indexOf(this.model.site.id.value) > -1) {
          valid = false;
        }

        if (!valid) return;

        this.model.submitButtonDisabled = true;
        const site = {
          name: this.model.site.name.value,
          id: this.model.site.id.value,
          did: this.model.site.did.value,
          country: this.model.site.countries.value[0],
          consents: [],
        };
        const result = await this.sitesService.createSite(site, this.trialKeySSI);
        this.model.submitButtonDisabled = false;
        this.send('confirmed', result);
      } catch (error) {
        this.send('closed', new Error('There was an issue creating the site'));
        console.log(error);
      }
    });
  }
}
