import TrialsService from '../services/TrialsService.js';
import SitesService from '../services/SitesService.js';
import { trialStatusesEnum, trialStagesEnum } from '../constants/trial.js';
import { countryStatusesEnum, countryStagesEnum } from '../constants/countries.js';
import { siteStatusesEnum, siteStagesEnum } from '../constants/site.js';
import eventBusService from '../services/EventBusService.js';
import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

const commonServices = require('common-services');
const SharedStorage = commonServices.SharedStorage;

export default class TrialOverviewController extends WebcController {
  constructor(...props) {
    super(...props);

    this.storageService = SharedStorage.getSharedStorage(this.DSUStorage);
    this.trialService = new TrialsService(this.DSUStorage);
    this.sitesService = new SitesService(this.DSUStorage);

    let { id, keySSI } = this.history.location.state;
    this.keySSI = keySSI;
    this.trialId = id;

    this.setModel({});

    this.attachEvents();

    this.init();

    eventBusService.addEventListener(Topics.RefreshTrialDetails, async (data) => {
      this.init();
    });
  }

  async init() {
    const trialStages = _.map(trialStagesEnum, (x) => x);
    const countryStages = _.map(countryStagesEnum, (x) => x);
    const countryStatuses = _.map(countryStatusesEnum, (x) => x);
    const siteStages = _.map(siteStagesEnum, (x) => x);
    const siteStatuses = _.map(siteStatusesEnum, (x) => x);

    const trial = await this.trialService.getTrialFromDB(this.trialId);
    const sites = await this.sitesService.getSites(trial.keySSI);

    const countries = sites.map((x) => x.country).filter((value, index, self) => self.indexOf(value) === index);
    const sitesByCountry = countries.map((x) =>
      sites
        .filter((y) => y.country === x)
        .sort((a, b) =>
          a.id.toUpperCase() < b.id.toUpperCase() ? -1 : a.id.toUpperCase() > b.id.toUpperCase() ? 1 : 0
        )
    );

    let maxSiteIndexCompleted = -1;
    const sitesData = {
      stage: siteStages.map((x, idx) => ({
        text: x,
        number: sites.reduce((previous, site) => {
          const result = previous + (site.stage === x ? 1 : 0);
          if (result > 0) maxSiteIndexCompleted = idx;
          return result;
        }, 0),
        filledIn: false,
      })),
      statuses: siteStatuses.map((x, idx) => ({
        text: x,
        number: sites.reduce((previous, site) => previous + (site.status === x ? 1 : 0), 0),
      })),
    };

    sitesData.stage = sitesData.stage.map((x, idx) => (idx <= maxSiteIndexCompleted ? { ...x, filledIn: true } : x));

    let maxCountryIndexCompleted = -1;
    const countriesData = {
      stage: countryStages.map((x, idx) => ({
        text: x,
        numberOfCountries: sitesByCountry
          .map((sites) => sites.reduce((acc, current) => acc + (current.stage === x ? 1 : 0), 0))
          .reduce((acc, current) => {
            const result = acc + (current > 0 ? 1 : 0);
            if (result > 0) maxCountryIndexCompleted = idx;
            return result;
          }, 0),
        filledIn: false,
      })),
      statuses: countryStatuses.map((x, idx) => ({
        text: x,
        number: sitesByCountry
          .map((sites) => sites.reduce((acc, current) => acc + (current.status === x ? 1 : 0), 0))
          .reduce((acc, current) => acc + (current > 0 ? 1 : 0), 0),
      })),
    };

    countriesData.stage = countriesData.stage.map((x, idx) =>
      idx <= maxCountryIndexCompleted ? { ...x, filledIn: true } : x
    );

    this.model.data = {
      trial: {
        status: trial.status,
        stage: trialStages.map((x, idx) => ({
          text: x,
          filledIn: trialStages.indexOf(trial.stage) >= idx,
        })),
      },
      countries: countriesData,
      sites: sitesData,
      exists: true,
    };
    return;
  }

  attachEvents() {
    return;
  }
}
