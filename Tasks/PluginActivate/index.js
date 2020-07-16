"use strict";
let promise;
try {
    const azureTaskLib = require('azure-pipelines-task-lib/task');
    const connectedServiceName = azureTaskLib.getInput("connectedServiceName", true) || "ServiceNow DevOps";
    const pluginID = azureTaskLib.getInput("pluginID", true);
    const serviceURL = azureTaskLib.getEndpointDataParameter(connectedServiceName, "url", false);
    const authUsername = azureTaskLib.getEndpointAuthorizationParameter(connectedServiceName, "username", false);
    const authPassword = azureTaskLib.getEndpointAuthorizationParameter(connectedServiceName, "password", false);
    const APIService = require('./ServiceNowCICDRestAPIService');
    // const serviceURL = 'dev60470.service-now.com', authUsername = 'admin', authPassword='J7GX5T2tFvWXkPx', pluginID = 'com.glide.web_service_a ggregate';
    const API = new APIService(serviceURL, authUsername + ':' + authPassword);

    promise = API.activatePlugin(pluginID);
} catch (e) {
    errHandler(e);
}

promise.then(function (status) {
    console.log('\x1b[32mSuccess\x1b[0m\nPlugin has been activated.');
    if (status) {
        console.log('Status is: ' + status);
    }
}).catch(errHandler);


function errHandler(err) {
    console.error('\x1b[31mPlugin activation failed\x1b[0m\n');
    console.error('The error is:', err);
    process.exit(1);
}