const APIService = require('./ServiceNowCICDRestAPIService');

let API, pipeline;
module.exports = {
    init: (_pipeline, transport) => {
        pipeline = _pipeline;
        API = new APIService(pipeline.url(), pipeline.auth(), transport);
    },
    run: () => {
        let options = {};
        'scope sys_id version auto_upgrade_base_app base_app_version'
            .split(' ')
            .forEach(name => {
                const val = pipeline.get(name);
                if (val) {
                    options[name] = val;
                }
            });
        if (!options.version) {
            let envVersion = pipeline.getVar('ServiceNow-CICD-App-Publish.publishVersion');
            if (!envVersion) {
                pipeline.getVar('publishVersion');
            }
            if (envVersion) {
                options.version = envVersion;
            }
        }
        if (options.version) {
            console.log('Installing with version: ' + options.version);
        }
        return API
            .appRepoInstall(options)
            .then(function (version) {
                console.log('\x1b[32mSuccess\x1b[0m\n');
                if (version) {
                    pipeline.setVar('ServiceNow-CICD-App-Install.rollbackVersion', version);
                    console.log('Installed version is: ' + version);
                    pipeline.setVar('rollbackVersion', version);
                    console.log('Rollback version is: ' + version);
                    return version;
                }
            })
            .catch(err => {
                process.stderr.write('\x1b[31mInstallation failed\x1b[0m\n');
                process.stderr.write('The error is:' + err);
                return Promise.reject(err);
            })
    }
}
