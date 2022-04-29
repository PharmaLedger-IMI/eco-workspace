// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const FileDownloaderService = commonServices.FileDownloaderService;
// import eventBusService from '../services/EventBusService.js';
// import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class SitePreviewConsentController extends WebcController {
  constructor(...props) {
    super(...props);
    let { trialId, trialKeySSI, trialUid, siteId, siteKeySSI, siteUid, data, history } = this.history.location.state;

    console.log(trialId, trialKeySSI, siteId, siteKeySSI, data, history);
    this.model = {
      trialId,
      trialKeySSI,
      trialUid,
      siteId,
      siteKeySSI,
      siteUid,
      consent: data,
      history,
      pdf: {
        currentPage: 1,
        pagesNo: 0,
      },
      showPageUp: false,
      showPageDown: true,
    };

    this.fileDownloaderService = new FileDownloaderService(this.DSUStorage);

    this.attachEvents();

    this.init();
  }

  async init() {
    const econsentFilePath = this.getEconsentManualFilePath(
      this.model.siteUid,
      this.model.consent.uid,
      this.model.consent.version
    );
    this.downloadFile(econsentFilePath, this.model.consent.attachment);
  }

  attachEvents() {
    this.onTagClick('navigate-to-consents', async () => {
      this.navigateToPageTag('site-consents', {
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
      });
    });

    this.onTagClick('navigate-to-history', async () => {
      this.navigateToPageTag('site-consent-history', {
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteId: this.model.siteId,
        siteKeySSI: this.model.siteKeySSI,
        siteUid: this.model.siteUid,
        data: JSON.parse(JSON.stringify(this.model.history)),
      });
    });

    this.onTagClick('navigate-to-sites', async () => {
      this.navigateToPageTag('sites', {
        id: this.model.trialId,
        keySSI: this.model.trialKeySSI,
        uid: this.model.trialUid,
      });
    });
  }

  downloadFile = async (filePath, fileName) => {
    await this.fileDownloaderService.prepareDownloadFromDsu(filePath, fileName);
    let fileBlob = this.fileDownloaderService.getFileBlob(fileName);
    this.rawBlob = fileBlob.rawBlob;
    this.mimeType = fileBlob.mimeType;
    this.blob = new Blob([this.rawBlob], {
      type: this.mimeType,
    });
    this.displayFile();
  };

  loadPdfOrTextFile = () => {
    const reader = new FileReader();
    reader.readAsDataURL(this.blob);
    reader.onloadend = () => {
      let base64data = reader.result;
      this.initPDF(base64data.substr(base64data.indexOf(',') + 1));
    };
  };

  initPDF(pdfData) {
    pdfData = atob(pdfData);
    let pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';

    this.loadingTask = pdfjsLib.getDocument({ data: pdfData });
    this.renderPage(this.model.pdf.currentPage);
  }

  renderPage = (pageNo) => {
    this.loadingTask.promise.then(
      (pdf) => {
        this.model.pdf.pagesNo = pdf.numPages;
        pdf.getPage(pageNo).then((result) => this.handlePages(pdf, result));
      },
      (reason) => console.error(reason)
    );
  };

  handlePages = (thePDF, page) => {
    const viewport = page.getViewport({ scale: 1.5 });
    let canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    let context = canvas.getContext('2d');
    console.log(viewport, page);
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    page.render({ canvasContext: context, viewport: viewport });
    document.getElementById('canvas-parent').appendChild(canvas);

    this.model.pdf.currentPage = this.model.pdf.currentPage + 1;
    let currPage = this.model.pdf.currentPage;
    if (thePDF !== null && currPage <= this.model.pdf.pagesNo) {
      thePDF.getPage(currPage).then((result) => this.handlePages(thePDF, result));
    }
  };

  displayFile = () => {
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      const file = new File([this.rawBlob], this.fileName);
      window.navigator.msSaveOrOpenBlob(file);
      this.feedbackController.setLoadingState(true);
      return;
    }

    window.URL = window.URL || window.webkitURL;
    const fileType = this.mimeType.split('/')[0];
    switch (fileType) {
      case 'image': {
        this.loadImageFile();
        break;
      }
      default: {
        this.loadPdfOrTextFile();
        break;
      }
    }
  };

  getEconsentManualFilePath(siteUid, consentUid, version) {
    return '/sites/' + siteUid + '/consent/' + consentUid + '/versions/' + version;
  }
}
