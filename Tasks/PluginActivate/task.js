const APIService = require('./ServiceNowCICDRestAPIService');
let API, pipeline;
module.exports = {
    init: (_pipeline, transport) => {
        pipeline = _pipeline;
        API = new APIService(pipeline.url(), pipeline.auth(), transport);
    },
    run: () => {
        return API
            .activatePlugin(pipeline.get('pluginID', true))
            .then(function (status) {
                console.log('\x1b[32mSuccess\x1b[0m\nPlugin has been activated.');
                if (status) {
                    console.log('Status is: ' + status);
                }
            })
            .catch(err => {
                console.error('\x1b[31mPlugin activation failed\x1b[0m\n');
                console.error('The error is:', err);
                return Promise.reject();
            })
    }
}