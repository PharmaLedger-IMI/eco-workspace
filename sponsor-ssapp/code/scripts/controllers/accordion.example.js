// // eslint-disable-next-line no-undef
// const { WebcController } = WebCardinal.controllers;

// import getSharedStorage from '../services/SharedDBStorageService.js';
// import SitesService from '../services/SitesService.js';
// import TrialsService from '../services/TrialsService.js';
// import { menuOptions } from '../constants/trialDetails.js';

// export default class TrialDetailsController extends WebcController {
//   constructor(...props) {
//     super(...props);

//     this.storageService = getSharedStorage(this.DSUStorage);
//     this.sitesService = new SitesService(this.DSUStorage);
//     this.trialsService = new TrialsService(this.DSUStorage);

//     let { id, keySSI } = this.history.location.state;

//     const menu = _.map(menuOptions, (x, idx) => ({
//       name: x,
//       selected: false,
//       selectedOption: _.map(menuOptions, (x) => false),
//       data: false,
//       loading: true,
//     }));

//     this.model = {
//       id,
//       dataLoaded: false,
//       trial: null,
//       menu: menu,
//     };

//     this.feedbackEmitter = null;

//     this.attachEvents();
//     this.init();
//   }

//   async init() {
//     await this.getTrial();
//     await this.getSites();
//     return;
//   }

//   async getTrial() {
//     this.model.trial = await this.trialsService.getTrialFromDB(this.model.id);
//   }

//   async getSites() {
//     this.model.sites = await this.sitesService.getSites(this.model.trial.keySSI);
//   }

//   attachEvents() {
//     this.onTagClick('select-menu', async (model, target, event) => {
//       const data = target.getAttribute('data-custom');
//       const option = this.model.menu.find((x) => x.name === data);
//       const index = this.model.menu.indexOf(option);

//       if (option.selectedOption[index] === false) {
//         this.model.menu.forEach((x) => (x.name !== data ? this.resetMenu(x) : this.onSelectMenu(x, index)));
//       } else {
//         option.selected = false;
//         option.selectedOption[index] = false;
//       }
//     });

//     this.on('openFeedback', (e) => {
//       this.feedbackEmitter = e.detail;
//     });

//     this.onTagClick('add-site', async (event) => {
//       this.showModalFromTemplate(
//         'add-new-site',
//         (event) => {
//           const response = event.detail;
//           this.getSites();
//           this.showFeedbackToast('Result', 'Site added successfully', 'toast');
//         },
//         (event) => {
//           const error = event.detail || null;
//           if (error instanceof Error) {
//             console.log(error);
//             this.showFeedbackToast('Result', 'ERROR: There was an issue creating the new site', 'toast');
//           }
//         },
//         {
//           controller: 'AddNewSiteModalController',
//           disableExpanding: false,
//           disableBackdropClosing: false,
//           existingIds: this.model.sites.map((x) => x.id) || [],
//           trialKeySSI: this.model.trial.keySSI,
//         }
//       );
//     });
//     return;
//   }

//   resetMenu(menu) {
//     menu.selected = false;
//     menu.selectedOption.fill(false);
//     menu.data = false;
//     menu.loading = true;
//   }

//   activateMenu(menu, idx, data) {
//     menu.data = data;
//     menu.selected = true;
//     menu.selectedOption[idx] = true;
//     menu.loading = false;
//   }

//   async onSelectMenu(menu, idx) {
//     switch (menu.name) {
//       case menuOptions.TrialDetails:
//         const trial = JSON.parse(JSON.stringify(this.model.trial));
//         this.activateMenu(menu, idx, trial);
//         break;
//       case menuOptions.CountriesSites:
//         const sites = await this.sitesService.getSites(this.model.trial.keySSI);
//         this.activateMenu(menu, idx, sites);
//         break;
//       case menuOptions.Consents:
//         menu.loading = false;
//         menu.selected = true;
//         menu.selectedOption[idx] = true;
//         menu.data = [];
//         break;
//       case menuOptions.VisitsProcedures:
//         menu.loading = false;
//         menu.selected = true;
//         menu.selectedOption[idx] = true;
//         menu.data = [];
//         break;
//       default:
//         break;
//     }
//   }

//   showFeedbackToast(title, message, alertType) {
//     if (typeof this.feedbackEmitter === 'function') {
//       this.feedbackEmitter(message, title, alertType);
//     }
//   }
// }

// <webc-container controller="TrialDetailsController" data-view-model="@">
//   <link rel="stylesheet" href="assets/css/trial-details.css" />

//   <div data-for="@menu">
//     <div data-tag="select-menu" data-custom="@name" class="accordion-item">
//       <div data-if="@selected">
//         <container slot="true">
//           <div data-if="@selectedOption.0">
//             <h5 class="d-flex flex-row bold align-items-center m-2 p-2">
//               <i class="fas fa-angle-down"></i>
//               <div class="ml-2">{{ @name }}</div>
//             </h5>
//             <div data-if="@loading" class="ml-5">
//               <container slot="false">
//                 <div data-if="@data">
//                   <div class="row m-2">
//                     <div class="col-md-3">Trial Code</div>
//                     <div class="col-md-3">{{ @data.id }}</div>
//                   </div>
//                   <div class="row m-2">
//                     <div class="col-md-3">Trial Sponsor</div>
//                     <div class="col-md-3">{{ @data.sponsor }}</div>
//                   </div>
//                   <div class="row m-2">
//                     <div class="col-md-3">Trial Name</div>
//                     <div class="col-md-3">{{ @data.name }}</div>
//                   </div>
//                 </div>
//               </container>
//             </div>
//           </div>
//           <div data-if="@selectedOption.1">
//             <h5 class="d-flex flex-row bold align-items-center m-2 p-2">
//               <i class="fas fa-angle-down"></i>
//               <div class="ml-2">{{ @name }}</div>
//               <button class="btn btn-primary ml-auto" data-tag="add-site">Add Site</button>
//             </h5>
//             <div data-if="@loading" class="ml-5">
//               <container slot="false">
//                 <div data-if="@data">Countries and Sites</div>
//               </container>
//             </div>
//           </div>
//           <div data-if="@selectedOption.2">
//             <h5 class="d-flex flex-row bold align-items-center m-2 p-2">
//               <i class="fas fa-angle-down"></i>
//               <div class="ml-2">{{ @name }}</div>
//             </h5>
//             <div data-if="@loading" class="ml-5">
//               <container slot="false">
//                 <div data-if="@data">Consents</div>
//               </container>
//             </div>
//           </div>
//           <div data-if="@selectedOption.3">
//             <h5 class="d-flex flex-row bold align-items-center m-2 p-2">
//               <i class="fas fa-angle-down"></i>
//               <div class="ml-2">{{ @name }}</div>
//             </h5>
//             <div data-if="@loading" class="ml-5">
//               <container slot="false">
//                 <div data-if="@data">Visits</div>
//               </container>
//             </div>
//           </div>
//         </container>
//         <container slot="false">
//           <h5 class="d-flex flex-row bold align-items-center m-2 p-2">
//             <i class="fas fa-angle-right"></i>
//             <div class="ml-2">{{ @name }}</div>
//           </h5>
//         </container>
//       </div>
//     </div>
//   </div>
//   <psk-list-feedbacks messages-to-display="5" time-alive="3000"> </psk-list-feedbacks>
// </webc-container>
