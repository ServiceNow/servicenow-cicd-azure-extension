const APIService = require('./ServiceNowCICDRestAPIService');

let API, pipeline;
module.exports = {
    init: (_pipeline, transport) => {
        pipeline = _pipeline;
        API = new APIService(pipeline.url(), pipeline.auth(), transport);
    },
    run: () => {
        let options = {}, payload = '';
        'scan_type target_table target_sys_id combo_sys_id suite_sys_id app_scope_sys_ids update_set_sys_ids'
            .split(' ')
            .forEach(name => {
                const val = pipeline.get(name);
                if (val) {
                    options[name] = val;
                }
            });
            
            switch (options.scan_type) {
                case 'full':
                    url = 'instance_scan/full_scan'
                    break;
                case 'point':
                    url = 'instance_scan/point_scan';
                    break
                case 'suiteCombo':
                    url = `instance_scan/suite_scan/combo/${options.combo_sys_id}`
                    break
                case 'suiteScoped':
                    // requires body-payload
                    payload = JSON.stringify({app_scope_sys_ids: options.app_scope_sys_ids.split(',')});
                    url = `instance_scan/suite_scan/${options.suite_sys_id}/scoped_apps`
                    break
                case 'suiteUpdate':
                    // requires body-payload
                    payload = JSON.stringify({update_set_sys_ids: options.update_set_sys_ids.split(',')});
                    url = `instance_scan/suite_scan/${options.suite_sys_id}/update_sets`
                    break
                default:
                    process.stderr.write('Wrong ScanType provided.\n');
                    return Promise.reject();
            }

        console.log(`Start ${options.scan_type} instance scan`);
        return API
            .scanInstance(url, options, payload)
            .then(function (response) {
                console.log('\x1b[32mSuccess\x1b[0m\n');
                if (response.status_message) {
                    console.log('Status message: ' + response.status_message);
                    return response.status_message;
                }
            })
            .catch(err => {
                process.stderr.write('\x1b[31mScan failed\x1b[0m\n');
                process.stderr.write('The error is:' + err);
                return Promise.reject(err);
            })
    }
}
