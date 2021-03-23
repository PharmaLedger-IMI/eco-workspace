function EcoAdapter(server) {
    console.log("IotAdapter called")
    require('./strategies/EcoAdapter');

    const TrialsFacade = require('./trials');
    const SitesFacade = require('./sites');
    const NotificationsFacade = require('./notifications');
    // const AdapterPostExample = require('./post-example');

    const { responseModifierMiddleware, requestBodyJSONMiddleware } = require('../privatesky/modules/apihub/utils/middlewares');

    server.use(`/ecoAdapter/*`, responseModifierMiddleware);

    server.get(`/ecoAdapter/trials`, TrialsFacade.getTrials);
    server.get(`/ecoAdapter/trials/:trialId`, TrialsFacade.getTrial);
    server.get(`/ecoAdapter/trials/:trialId/econsents`, TrialsFacade.getEconsents);
    server.get(`/ecoAdapter/trials/:trialId/econsents/:econsentId`, TrialsFacade.getEconsent);

    server.get(`/ecoAdapter/sites`, SitesFacade.getSites);
    server.get(`/ecoAdapter/sites/:siteId`, SitesFacade.getSiteBy);

    server.get(`/ecoAdapter/notifications`, NotificationsFacade.getNotifications);
    server.get(`/ecoAdapter/notifications/:notificationId`, NotificationsFacade.getNotificationBy);

    // server.put(`/ecoAdapter/trials/{trialId}/econsents/{econsendId}/sign`, requestBodyJSONMiddleware);
    //
    // server.put(`/ecoAdapter/trials/{trialId}/econsents/{econsendId}/withdraw`, requestBodyJSONMiddleware);
    // server.put(`/ecoAdapter/trials/{trialId}/econsents/{econsendId}/withdraw`, AdapterPostExample);
    //
    // server.put(`/ecoAdapter/notifications/{notificationId}`, requestBodyJSONMiddleware);
    // server.put(`/ecoAdapter/notifications/{notificationId}`, AdapterPostExample);
}

module.exports = EcoAdapter;