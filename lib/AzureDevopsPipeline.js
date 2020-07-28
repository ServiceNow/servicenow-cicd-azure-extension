const azureTaskLib = require('azure-pipelines-task-lib/task');
const connectedServiceName = azureTaskLib.getInput("connectedServiceName", true);
const authUsername = azureTaskLib.getEndpointAuthorizationParameter(connectedServiceName, "username", true);
const authPassword = azureTaskLib.getEndpointAuthorizationParameter(connectedServiceName, "password", true);

    module.exports = {
        auth: azureTaskLib.getEndpointAuthorizationParameter(connectedServiceName, "username", true) +
            ':' +
            azureTaskLib.getEndpointAuthorizationParameter(connectedServiceName, "password", true),
        url: azureTaskLib.getEndpointDataParameter(connectedServiceName, "url", true),
        get: (name, required=false) => {
            // underscore notation is translated into camelCase
            name = name.replace(/_[a-z]/g, m=>m[1].toUpperCase())
            let result = azureTaskLib.getInput(name, false);
            if(!result) {
                result = azureTaskLib.getVariable(name);
            }
            if(!result && required) {
                throw new Error(`Input or variable "${name}" is missing`);
            }
            return result;
        }
    }