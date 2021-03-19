export default class ListTrialsService {
  SERVICE_PATH = '/trials';

  constructor(DSUStorage) {
    this.DSUStorage = DSUStorage;
  }

  getTrials() {
    return [
      {
        id: 1,
        name: 'trial 1',
        progress: 20,
        status: 1,
        enrolled: 250,
        total: 500,
        countries: ['GR', 'RO'],
        started: new Date().toISOString().slice(0, 10),
      },
      {
        id: 2,
        name: 'trial 2',
        progress: 22,
        status: 0,
        enrolled: 350,
        total: 500,
        countries: ['IT'],
        started: new Date().toISOString().slice(0, 10),
      },
      {
        id: 3,
        name: 'trial 3',
        progress: 33,
        status: 2,
        enrolled: 250,
        total: 600,
        countries: ['FR', 'ES'],
        started: new Date().toISOString().slice(0, 10),
      },
      {
        id: 4,
        name: 'trial 4',
        progress: 20,
        status: 1,
        enrolled: 250,
        total: 500,
        countries: ['GR'],
        started: new Date().toISOString().slice(0, 10),
      },
      {
        id: 5,
        name: 'trial 5',
        progress: 20,
        status: 0,
        enrolled: 250,
        total: 500,
        countries: ['RO'],
        started: new Date().toISOString().slice(0, 10),
      },
      {
        id: 6,
        name: 'trial 6',
        progress: 20,
        status: 2,
        enrolled: 250,
        total: 500,
        countries: ['GR', 'RO'],
        started: new Date().toISOString().slice(0, 10),
      },
      {
        id: 7,
        name: 'trial 7',
        progress: 20,
        status: 0,
        enrolled: 250,
        total: 500,
        countries: ['RO'],
        started: new Date().toISOString().slice(0, 10),
      },
      {
        id: 8,
        name: 'trial 8',
        progress: 20,
        status: 1,
        enrolled: 250,
        total: 500,
        countries: ['GR'],
        started: new Date().toISOString().slice(0, 10),
      },
    ];
  }
}
