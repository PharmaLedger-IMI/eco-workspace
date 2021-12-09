// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

const commonServices = require('common-services');
const Constants = commonServices.Constants;
import getSharedStorage from '../services/SharedDBStorageService.js';
import SitesService from '../services/SitesService.js';
import TrialsService from '../services/TrialsService.js';
import { menuOptions } from '../constants/trialDetails.js';
import { countryListAlpha2 } from '../constants/countries.js';
import { siteStatusesEnum } from './../constants/site.js';
const CommunicationService = commonServices.CommunicationService;
import ConsentService from '../services/ConsentService.js';
import eventBusService from '../services/EventBusService.js';
import { Topics } from '../constants/topics.js';
import VisitsService from '../services/VisitsService.js';

export default class TrialDetailsController extends WebcController {
  constructor(...props) {
    super(...props);

    this.storageService = getSharedStorage(this.DSUStorage);
    this.sitesService = new SitesService(this.DSUStorage);
    this.trialsService = new TrialsService(this.DSUStorage);
    this.visitsService = new VisitsService(this.DSUStorage);
    this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.SPONSOR_IDENTITY);
    this.consentService = new ConsentService(this.DSUStorage);

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

    const result = countries.map((x) => {
      return {
        country: countryListAlpha2[x],
        sites:
          sites && sites.length > 0
            ? sites
                .filter((y) => y.country === x)
                .sort((a, b) =>
                  a.id.toUpperCase() < b.id.toUpperCase() ? -1 : a.id.toUpperCase() > b.id.toUpperCase() ? 1 : 0
                )
            : false,
        selected: previousSelectedState[countryListAlpha2[x]] || false,
        active: !sites
          .filter((y) => y.country === x)
          .map((x) => x.onHold)
          .every((x) => x === true),
        terminated: false,
      };
    });

    result.sort((a, b) => {
      return a.country.toUpperCase() < b.country.toUpperCase()
        ? -1
        : a.country.toUpperCase() > b.country.toUpperCase()
        ? 1
        : 0;
    });
    this.model.sites = result;
    this.model.menu.find((x) => x.name === menuOptions.CountriesSites).data = result;
  }

  attachEvents() {
    this.onTagClick('select-menu', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      const menu = JSON.parse(JSON.stringify(this.model.menu));
      const option = menu.find((x) => x.name === data);
      const index = menu.indexOf(option);
      if (option.selectedOption[index] === false) {
        menu.forEach((x) => (x = this.resetMenu(x)));
        this.model.menu = menu;
        this.onSelectMenu(menu[index], index);
      } else {
        this.model.menu[index] = this.resetMenu(JSON.parse(JSON.stringify(this.model.menu[index])));
      }
    });

    this.onTagClick('select-country', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      await this.getSites();
      let menuData = JSON.parse(
        JSON.stringify(this.model.menu.find((x) => x.name === menuOptions.CountriesSites).data)
      );
      menuData = menuData.map((x) => (x.country === data ? { ...x, selected: true } : { ...x, selected: false }));
      this.model.menu.find((x) => x.name === menuOptions.CountriesSites).data = menuData;
    });

    this.onTagClick('country-on-hold', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      const selectedCountry = this.model.sites.find((x) => x.country === data);
      for (const site of selectedCountry.sites) {
        await this.changeSiteStatus(siteStatusesEnum.OnHold, site.id);
      }

      await this.getSites();
      eventBusService.emitEventListeners(Topics.RefreshTrialDetails, null);
    });

    this.onTagClick('country-resume', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      const selectedCountry = this.model.sites.find((x) => x.country === data);
      for (const site of selectedCountry.sites) {
        await this.changeSiteStatus(siteStatusesEnum.Active, site.id);
      }

      await this.getSites();
      eventBusService.emitEventListeners(Topics.RefreshTrialDetails, null);
    });

    this.onTagClick('country-terminate', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      const selectedCountry = this.model.sites.find((x) => x.country === data);
      for (const site of selectedCountry.sites) {
        await this.changeSiteStatus(siteStatusesEnum.Cancelled, site.id);
      }

      await this.getSites();
      eventBusService.emitEventListeners(Topics.RefreshTrialDetails, null);
    });

    this.onTagClick('site-edit', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      // TODO
    });

    this.onTagClick('site-on-hold', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      await this.changeSiteStatus(siteStatusesEnum.OnHold, data);
      await this.getSites();
      this.showFeedbackToast('Result', 'Site status changed successfully', 'toast');
      eventBusService.emitEventListeners(Topics.RefreshTrialDetails, null);
    });

    this.onTagClick('site-resume', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      await this.changeSiteStatus(siteStatusesEnum.Active, data);
      await this.getSites();
      this.showFeedbackToast('Result', 'Site status changed successfully', 'toast');
      eventBusService.emitEventListeners(Topics.RefreshTrialDetails, null);
    });

    this.onTagClick('site-terminate', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      await this.changeSiteStatus(siteStatusesEnum.Cancelled, data);
      await this.getSites();
      this.showFeedbackToast('Result', 'Site status changed successfully', 'toast');
      eventBusService.emitEventListeners(Topics.RefreshTrialDetails, null);
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
          this.sendMessageToHco(Constants.MESSAGES.HCO.ADD_SITE, response.keySSI, 'Site added', response.did);
          this.showFeedbackToast('Result', 'Site added successfully', 'toast');
          eventBusService.emitEventListeners(Topics.RefreshTrialDetails, null);
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

    this.onTagClick('add-trial-consent', async (model, target, event) => {
      const data = target.getAttribute('data-custom');

      const selectedSite = JSON.parse(JSON.stringify(this.model.menu))
        .find((x) => x.name === menuOptions.Consents)
        .data.site.find((x) => x.selected === true)
        .sites.find((x) => x.selected === true);

      const { consents } = await this.visitsService.getTrialVisits(this.model.trial.keySSI);

      this.showModalFromTemplate(
        'add-new-consent',
        async (event) => {
          const response = event.detail;
          await this.getConsents();
          this.showFeedbackToast('Result', 'Consent added successfully', 'toast');
          this.sendMessageToHco(Constants.MESSAGES.HCO.ADD_CONSENT, response.keySSI, 'Trial consent', selectedSite.did);

          eventBusService.emitEventListeners(Topics.RefreshTrialConsents, null);
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showFeedbackToast('Result', 'ERROR: There was an issue creating the new consent', 'toast');
          }
        },
        {
          controller: 'AddNewConsentModalController',
          disableExpanding: true,
          disableBackdropClosing: false,
          isUpdate: false,
          existingIds: this.model.consents.map((x) => x.id) || [],
          site: selectedSite,
          consents,
        }
      );
    });

    this.onTagClick('select-consent-country', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      // await this.getSites();
      const newSiteData = JSON.parse(JSON.stringify(this.model.menu))
        .find((x) => x.name === menuOptions.Consents)
        .data.site.map((x) => ({
          ...x,
          selected: x.country === data ? (x.selected = !x.selected) : (x.selected = false),
        }));

      this.model.setChainValue('menu.2.data.site', newSiteData);
    });

    this.onTagClick('select-consent-site', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      const newSiteData = JSON.parse(JSON.stringify(this.model.menu))
        .find((x) => x.name === menuOptions.Consents)
        .data.site.map((x) => ({
          ...x,
          sites: x.sites.map((y) => ({ ...y, selected: y.id === data ? !y.selected : false })),
        }));
      this.model.setChainValue('menu.2.data.site', newSiteData);
    });

    this.onTagClick('select-consent', async (model, target, event) => {
      const data = target.getAttribute('data-custom');

      const siteData = JSON.parse(JSON.stringify(this.model.menu)).find((x) => x.name === menuOptions.Consents).data
        .site;
      const selectedSite = siteData.find((x) => x.selected === true).sites.find((x) => x.selected === true);

      const selectedCountryIdx = siteData.findIndex((x) => x.selected === true);
      const selectedSiteIdx = siteData.find((x) => x.selected === true).sites.findIndex((x) => x.selected === true);

      selectedSite.consents.forEach((x) => {
        if (x.id === data) x.selected = !x.selected;
        else x.selected = false;
      });

      this.model.setChainValue(`menu.2.data.site.${selectedCountryIdx}.sites.${selectedSiteIdx}`, selectedSite);
    });

    this.onTagClick('add-version', async (model, target, event) => {
      const data = target.getAttribute('data-custom');

      const selectedSite = JSON.parse(JSON.stringify(this.model.menu))
        .find((x) => x.name === menuOptions.Consents)
        .data.site.find((x) => x.selected === true)
        .sites.find((x) => x.selected === true);

      const selectedConsent = selectedSite.consents.find((x) => x.selected === true);

      this.showModalFromTemplate(
        'add-new-consent',
        (event) => {
          const response = event.detail;
          this.getConsents();
          this.showFeedbackToast('Result', 'Consent added successfully', 'toast');
          this.sendMessageToHco('add-econsent-version', response.keySSI, 'New consent version', selectedSite.did);
          eventBusService.emitEventListeners(Topics.RefreshTrialConsents, null);
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showFeedbackToast('Result', 'ERROR: There was an issue creating the new consent', 'toast');
          }
        },
        {
          controller: 'AddNewConsentModalController',
          disableExpanding: true,
          disableBackdropClosing: false,
          site: selectedSite,
          isUpdate: selectedConsent,
          existingVersions: selectedSite.consents.filter((x) => x.id === event.data).map((x) => x.version) || [],
        }
      );
    });
  }

  resetMenu(menu) {
    menu.selected = false;
    menu.selectedOption.fill(false);
    menu.data = false;
    menu.loading = true;
    return menu;
  }

  activateMenu(menu, idx, data) {
    menu.data = data;
    menu.selected = true;
    menu.selectedOption[idx] = true;
    menu.loading = false;
    return menu;
  }

  async onSelectMenu(menu, idx) {
    switch (menu.name) {
      case menuOptions.TrialDetails:
        await this.getTrial();
        const trial = JSON.parse(JSON.stringify(this.model.trial));
        this.model.menu[idx] = JSON.parse(JSON.stringify(this.activateMenu(menu, idx, trial)));
        break;
      case menuOptions.CountriesSites:
        await this.getSites();
        this.model.menu[idx] = JSON.parse(
          JSON.stringify(
            this.activateMenu(
              menu,
              idx,
              this.model.sites && this.model.sites.length > 0 && JSON.parse(JSON.stringify(this.model.sites))
            )
          )
        );
        break;
      case menuOptions.Consents:
        const data = await this.getConsents();
        this.model.menu[idx] = this.resetMenu(JSON.parse(JSON.stringify(this.model.menu[idx])));
        this.model.menu[idx] = JSON.parse(JSON.stringify(this.activateMenu(menu, idx, data)));
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

  async getConsents() {
    await this.getSites();
    // const consents = await this.consentService.getTrialConsents(this.model.trial.keySSI);
    const consents = [];
    this.model.consents = [];

    if (!this.model.trial) {
      await this.getTrial();
    }
    const sites = (await this.sitesService.getSites(this.model.trial.keySSI)).map((x) => ({
      ...x,
    }));

    const existingData = JSON.parse(JSON.stringify(this.model.menu.find((x) => x.name === menuOptions.Consents).data));
    if (existingData && existingData.length > 0) {
      //TODO: get state
    }
    const countries = sites.map((x) => x.country).filter((value, index, self) => self.indexOf(value) === index);
    let previousSelectedState = {};

    const sitesData = countries.map((x) => {
      return {
        country: countryListAlpha2[x],
        sites:
          sites && sites.length > 0
            ? sites
                .filter((y) => y.country === x)
                .sort((a, b) =>
                  a.id.toUpperCase() < b.id.toUpperCase() ? -1 : a.id.toUpperCase() > b.id.toUpperCase() ? 1 : 0
                )
                .map((z) => ({ ...z, selected: false, consents: z.consents }))
            : false,
        selected: previousSelectedState[countryListAlpha2[x]] || false,
      };
    });

    sitesData.sort((a, b) => {
      return a.country.toUpperCase() < b.country.toUpperCase()
        ? -1
        : a.country.toUpperCase() > b.country.toUpperCase()
        ? 1
        : 0;
    });
    // this.model.menu.find((x) => x.name === menuOptions.Consents).data = sitesData;

    const data = { trial: JSON.parse(JSON.stringify(consents)), site: sitesData };
    this.model.menu.find((x) => x.name === menuOptions.Consents).data = data;
    return JSON.parse(JSON.stringify(data));
  }

  async changeSiteStatus(status, id) {
    const updated = await this.sitesService.changeSiteStatus(status, id, this.model.trial.keySSI);

    console.log({
      operation: 'site-status-change',
      data: {
        site: updated.keySSI,
        status: status,
      },
      shortDescription: 'Status was updated',
    });
    this.CommunicationService.sendMessage(updated.did, {
      operation: 'site-status-change',
      data: {
        site: updated.keySSI,
        status: status,
      },
      shortDescription: 'Status was updated',
    });
  }

  // getSiteConsents(consents) {
  //   const result = JSON.parse(JSON.stringify(this.model.consents)).map((x) => {
  //     return consents.find((y) => y.id === x.id) || x;
  //   });
  //   return JSON.parse(JSON.stringify(result.map((x) => ({ ...x, selected: false }))));
  // }

  showFeedbackToast(title, message, alertType) {
    if (typeof this.feedbackEmitter === 'function') {
      this.feedbackEmitter(message, title, alertType);
    }
  }

  sendMessageToHco(operation, ssi, shortMessage, did) {
    console.log({
      operation: operation,
      data: ssi,
      shortDescription: shortMessage,
    });
    this.CommunicationService.sendMessage(did, {
      operation: operation,
      ssi: ssi,
      trialSSI: this.model.trial.keySSI,
      shortDescription: shortMessage,
    });
  }
}
