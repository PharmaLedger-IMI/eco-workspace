const commonServices = require('common-services');
const SharedStorage = commonServices.SharedStorage;
import { trialTableHeaders } from '../constants/trial.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;
const { DataSource } = WebCardinal.dataSources;

class WrapperDataSource extends DataSource {
  constructor(...props) {
    super(...props);
    this.dataModel = props[0];

    this.setPageSize(10);
    this.setRecordsNumber(this.dataModel.length);

    this.model.headerItems = [{ name: 'Computing your header...' }];
  }

  getPageDataAsync = async (startOffset, dataLengthForCurrentPage) => {
    this.setRecordsNumber(this.dataModel.length);
    let data = [];
    if (dataLengthForCurrentPage > 0) {
      data = this.dataModel.slice(startOffset, startOffset + dataLengthForCurrentPage);
      this.model.headerItems = trialTableHeaders.map((x) => ({ name: x.label }));
    } else {
      data = this.dataModel.slice(0, startOffset - dataLengthForCurrentPage);
    }

    return new Promise((resolve, reject) => {
      resolve(data);
    });
  };

  async update(data) {
    this.dataModel = data;
    this.setRecordsNumber(data.length);
    // this.model.pageNumbers.current = 1;
    await this.forceUpdate();
  }
}

export default class TableTemplateController extends WebcController {
  constructor(...props) {
    super(...props);
    this.model.dataSource = new WrapperDataSource(JSON.parse(JSON.stringify(this.model.data)));

    this.model.onChange('data', () => {
      this.model.dataSource.update(JSON.parse(JSON.stringify(this.model.data)));
    });
  }
}
