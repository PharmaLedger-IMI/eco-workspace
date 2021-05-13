import DSUService from './DSUService.js';

export default class DSUServiceAsync extends DSUService {
  PATH = '/';

  constructor(DSUStorage, path) {
    super(DSUStorage, path);
    this.DSUStorage = DSUStorage;
    this.PATH = path;
  }

  getEntitiesAsync(path = this.PATH) {
    return new Promise((resolve, reject) => {
      this.getEntities((err, entities) => {
        if (err) {
          reject(new Error(err));
        }
        resolve(entities);
      }, (path = this.PATH));
    });
  }

  getEntityAsync(uid, path = this.PATH) {
    return new Promise((resolve, reject) => {
      this.getEntity(
        uid,
        (err, entity) => {
          if (err) {
            reject(new Error(err));
          }
          resolve(entity);
        },
        (path = this.PATH)
      );
    });
  }

  saveEntityAsync(entity, path = this.PATH) {
    return new Promise((resolve, reject) => {
      this.saveEntity(
        entity,
        (err, entity) => {
          if (err) {
            reject(new Error(err));
          }
          resolve(entity);
        },
        (path = this.PATH)
      );
    });
  }

  updateEntityAsync(entity, path = this.PATH) {
    return new Promise((resolve, reject) => {
      this.updateEntity(
        entity,
        (err, entity) => {
          if (err) {
            reject(new Error(err));
          }
          resolve(entity);
        },
        (path = this.PATH)
      );
    });
  }

  mountEntityAsync(keySSI, path = this.PATH) {
    return new Promise((resolve, reject) => {
      this.mountEntity(
        keySSI,
        (err, entity) => {
          if (err) {
            reject(new Error(err));
          }
          resolve(entity);
        },
        path
      );
    });
  }

  unmountEntityAsync(uid, path = this.PATH) {
    return new Promise((resolve, reject) => {
      this.unmountEntity(
        uid,
        (err, entity) => {
          if (err) {
            reject(new Error(err));
          }
          resolve(entity);
        },
        path
      );
    });
  }
}
