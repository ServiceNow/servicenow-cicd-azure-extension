const azureTaskLib = require('azure-pipelines-task-lib/task');
let connectedServiceName;

module.exports = {
    auth: () => {
        if (!connectedServiceName) {
            connectedServiceName = azureTaskLib.getInput("connectedServiceName", true);
        }

        return azureTaskLib.getEndpointAuthorizationParameter(connectedServiceName, "username", true) +
            ':' +
            azureTaskLib.getEndpointAuthorizationParameter(connectedServiceName, "password", true)
    },
    url: () => {
        if (!connectedServiceName) {
            connectedServiceName = azureTaskLib.getInput("connectedServiceName", true);
        }
        return azureTaskLib.getEndpointUrl(connectedServiceName, false);
    },
    get: (name, required = false) => {
        // underscore notation is translated into camelCase
        let result = azureTaskLib.getInput(name.replace(/_[a-z]/g, m => m[1].toUpperCase()), false);
        if (!result) {
            result = azureTaskLib.getVariable(name.toUpperCase());
        }
        if (!result && required) {
            throw new Error(`Input or variable "${name}" is missing`);
        }
        return result;
    },
    getVar: name => azureTaskLib.getVariable(name),
    setVar: (name, value) => {
        return azureTaskLib.setVariable(name, value, false);
    },
    success: message => azureTaskLib.setResult(azureTaskLib.TaskResult.Succeeded, message),
    fail: message => azureTaskLib.setResult(azureTaskLib.TaskResult.Failed, message),
}