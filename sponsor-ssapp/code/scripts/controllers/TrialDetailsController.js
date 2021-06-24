// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

import getSharedStorage from '../services/SharedDBStorageService.js';
import SitesService from '../services/SitesService.js';
import TrialsService from '../services/TrialsService.js';
import { menuOptions } from '../constants/trialDetails.js';
import { countryListAlpha2 } from '../constants/countries.js';
import { siteStatusesEnum } from './../constants/site.js';
import CommunicationService from '../services/CommunicationService.js';

export default class TrialDetailsController extends WebcController {
  constructor(...props) {
    super(...props);

    this.storageService = getSharedStorage(this.DSUStorage);
    this.sitesService = new SitesService(this.DSUStorage);
    this.trialsService = new TrialsService(this.DSUStorage);
    this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.SPONSOR_IDENTITY);

    let { id, keySSI } = this.history.location.state;

    const menu = _.map(menuOptions, (x, idx) => ({
      name: x,
      selected: false,
      selectedOption: _.map(menuOptions, (x) => false),
      data: false,
      loading: true,
    }));

    this.model = {
      id,
      dataLoaded: false,
      trial: null,
      menu: menu,
    };

    this.feedbackEmitter = null;

    this.attachEvents();
    this.init();
  }

  async init() {
    await this.getTrial();
    // await this.getSites();
    return;
  }

  async getTrial() {
    this.model.trial = await this.trialsService.getTrialFromDB(this.model.id);
  }

  async getSites() {
    if (!this.model.trial) {
      await this.getTrial();
    }
    const sites = (await this.sitesService.getSites(this.model.trial.keySSI)).map((x) => ({
      ...x,
      active: x.status === siteStatusesEnum.Active,
      terminated: !(x.status === siteStatusesEnum.Cancelled),
      onHold: x.status === siteStatusesEnum.OnHold,
    }));
    const countries = sites.map((x) => x.country).filter((value, index, self) => self.indexOf(value) === index);
    let previousSelectedState = {};

    if (this.model.sites) {
      this.model.sites.forEach((x) => (previousSelectedState[x.country] = x.selected));
    }

    this.model.sites = countries.map((x) => {
      return {
        country: countryListAlpha2[x],
        sites: sites.filter((y) => y.country === x),
        selected: previousSelectedState[countryListAlpha2[x]] || false,
        active: !sites
          .filter((y) => y.country === x)
          .map((x) => x.onHold)
          .every((x) => x === true),
        terminated: false,
      };
    });

    this.model.sites.sort((a, b) => {
      return a.country.toUpperCase() < b.country.toUpperCase()
        ? -1
        : a.country.toUpperCase() > b.country.toUpperCase()
        ? 1
        : 0;
    });

    this.model.menu.find((x) => x.name === menuOptions.CountriesSites).data = this.model.sites;

    console.log(JSON.stringify(this.model.sites, null, 2));
  }

  attachEvents() {
    this.onTagClick('select-menu', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      const option = this.model.menu.find((x) => x.name === data);
      const index = this.model.menu.indexOf(option);

      if (option.selectedOption[index] === false) {
        this.model.menu.forEach((x) => (x.name !== data ? this.resetMenu(x) : this.onSelectMenu(x, index)));
      } else {
        option.selected = false;
        option.selectedOption[index] = false;
      }
    });

    this.onTagClick('select-country', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      await this.getSites();
      this.model.sites.forEach((x) => (x.country === data ? (x.selected = !x.selected) : (x.selected = false)));
    });

    this.onTagClick('country-on-hold', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      const selectedCountry = this.model.sites.find((x) => x.country === data);
      for (const site of selectedCountry.sites) {
        await this.changeSiteStatus(siteStatusesEnum.OnHold, site.id);
      }

      await this.getSites();
    });

    this.onTagClick('country-resume', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      const selectedCountry = this.model.sites.find((x) => x.country === data);
      for (const site of selectedCountry.sites) {
        await this.changeSiteStatus(siteStatusesEnum.Active, site.id);
      }

      await this.getSites();
    });

    this.onTagClick('country-terminate', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      const selectedCountry = this.model.sites.find((x) => x.country === data);
      for (const site of selectedCountry.sites) {
        await this.changeSiteStatus(siteStatusesEnum.Cancelled, site.id);
      }

      await this.getSites();
    });

    this.onTagClick('site-edit', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      console.log('Terminate ', data);
      // TODO
    });

    this.onTagClick('site-on-hold', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      console.log('SITE ON HOLD:', data);
      await this.changeSiteStatus(siteStatusesEnum.OnHold, data);
      await this.getSites();
      this.showFeedbackToast('Result', 'Site status changed successfully', 'toast');
    });

    this.onTagClick('site-resume', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      await this.changeSiteStatus(siteStatusesEnum.Active, data);
      await this.getSites();
      this.showFeedbackToast('Result', 'Site status changed successfully', 'toast');
    });

    this.onTagClick('site-terminate', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      await this.changeSiteStatus(siteStatusesEnum.Cancelled, data);
      await this.getSites();
      this.showFeedbackToast('Result', 'Site status changed successfully', 'toast');
    });

    this.on('openFeedback', (e) => {
      this.feedbackEmitter = e.detail;
    });

    this.onTagClick('add-site', async (event) => {
      this.showModalFromTemplate(
        'add-new-site',
        (event) => {
          const response = event.detail;
          this.getSites();
          this.showFeedbackToast('Result', 'Site added successfully', 'toast');
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showFeedbackToast('Result', 'ERROR: There was an issue creating the new site', 'toast');
          }
        },
        {
          controller: 'AddNewSiteModalController',
          disableExpanding: false,
          disableBackdropClosing: false,
          existingIds: this.model.sites.map((x) => x.id) || [],
          trialKeySSI: this.model.trial.keySSI,
        }
      );
    });
    return;
  }

  resetMenu(menu) {
    menu.selected = false;
    menu.selectedOption.fill(false);
    menu.data = false;
    menu.loading = true;
  }

  activateMenu(menu, idx, data) {
    menu.data = data;
    menu.selected = true;
    menu.selectedOption[idx] = true;
    menu.loading = false;
  }

  async onSelectMenu(menu, idx) {
    switch (menu.name) {
      case menuOptions.TrialDetails:
        await this.getTrial();
        const trial = JSON.parse(JSON.stringify(this.model.trial));
        this.activateMenu(menu, idx, trial);
        break;
      case menuOptions.CountriesSites:
        await this.getSites();
        this.activateMenu(menu, idx, this.model.sites);
        break;
      case menuOptions.Consents:
        menu.loading = false;
        menu.selected = true;
        menu.selectedOption[idx] = true;
        menu.data = [];
        break;
      case menuOptions.VisitsProcedures:
        menu.loading = false;
        menu.selected = true;
        menu.selectedOption[idx] = true;
        menu.data = [];
        break;
      default:
        break;
    }
  }

  async changeSiteStatus(status, id) {
    const updated = await this.sitesService.changeSiteStatus(status, id, this.model.trial.keySSI);
    this.sendMessageToHco('site-status-change', updated.keySSI, 'Status was updated');
  }

  showFeedbackToast(title, message, alertType) {
    if (typeof this.feedbackEmitter === 'function') {
      this.feedbackEmitter(message, title, alertType);
    }
  }

  sendMessageToHco(operation, ssi, shortMessage, did = CommunicationService.identities.HCO_IDENTITY) {
    this.CommunicationService.sendMessage(did, {
      operation: operation,
      ssi: ssi,
      shortDescription: shortMessage,
    });
  }
}
