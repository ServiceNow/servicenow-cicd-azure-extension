const APIService = require('./ServiceNowCICDRestAPIService');

let API, pipeline;
module.exports = {
    init: (_pipeline, transport) => {
        pipeline = _pipeline;
        API = new APIService(pipeline.url(), pipeline.auth(), transport);
    },
    run: () => {
        let options = {};
        'app_scope app_sys_id branch_name repo_config_url repo_config_credentials_sys_id repo_config_default_branch_name repo_config_mid_server_sys_id repo_config_email repo_config_use_default_email_for_all repo_config_test_connection'
            .split(' ')
            .forEach(name => {
                const val = pipeline.get(name);
                if (val) {
                    options[name] = val;
                }
            });
        return API
            .SCApplyChanges(options)
            .then(function (response) {
                process.stdout.write('\x1b[32mSuccess\x1b[0m\n');
                if (response.status_message) {
                    process.stdout.write('Status is: ' + response.status_message);
                    return response.status_message;
                }
            })
            .catch(err => {
                process.stderr.write('\x1b[31mInstallation failed\x1b[0m\n');
                process.stderr.write('The error is:' + err);
                return Promise.reject(err);
            })
    }
}
