function EcoAdapter(server) {
    console.log("IotAdapter called")
    require('./strategies/EcoAdapter');

    const AdapterGetExample = require('./get-trials');
    const AdapterPostExample = require('./post-example');

    const { responseModifierMiddleware, requestBodyJSONMiddleware } = require('../privatesky/modules/apihub/utils/middlewares');

    server.use(`/ecoAdapter/*`, responseModifierMiddleware);

    server.get(`/ecoAdapter/listPatients`, AdapterGetExample);

    server.post(`/ecoAdapter/addPatient`, requestBodyJSONMiddleware);
    server.post(`/ecoAdapter/addPatient`, AdapterPostExample);
}

module.exports = EcoAdapter;