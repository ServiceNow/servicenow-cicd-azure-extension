const APIService = require('./ServiceNowCICDRestAPIService');

let API, pipeline;
module.exports = {
    init: (_pipeline, transport) => {
        pipeline = _pipeline;
        API = new APIService(pipeline.url(), pipeline.auth(), transport);
    },
    run: () => {
        let options = {};
        'scope sys_id version'
            .split(' ')
            .forEach(name => {
                const val = pipeline.get(name);
                if (val) {
                    options[name] = val;
                }
            });
        return API
            .appRepoInstall(options)
            .then(function (status) {
                console.log('\x1b[32mSuccess\x1b[0m\n');
                if(status) {
                    pipeline.setVar('rollbackVersion', status);
                    console.log('Rollback version is: ' + status);
                }
            })
            .catch(err => {
                console.error('\x1b[31mInstallation failed\x1b[0m\n');
                console.error('The error is:', err);
                return Promise.reject();
            })
    }
}