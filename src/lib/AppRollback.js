const APIService = require('./ServiceNowCICDRestAPIService');

let API, pipeline;
module.exports = {
    init:(_pipeline, transport) =>{
        pipeline = _pipeline;
        API = new APIService(pipeline.url(), pipeline.auth(), transport);
    },
    run: () => {
        let options = {};
        'scope sys_id version'
            .split(' ')
            .forEach(name=> {
                const val = pipeline.get(name);
                if(val) {
                    options[name] = val;
                }
            });
        if(!options.version) { // try to get envvar
            options.version = pipeline.getVar('ServiceNow-CICD-App-Install.rollbackVersion');
        }
        if(!options.version) { // try to get envvar
            options.version = pipeline.getVar('rollbackVersion');
        }
        if(options.version) {
            console.log(`Using version ${options.version} to rollback application.`)
        }
        const forceRollback = pipeline.get('autodetectVersion') === 'yes';
        if(!options.version && forceRollback) { //
            console.log('Trying to detect rollback version automatically.');
            options.version = '9999.9999.9999';
        }
        return API
            .appRepoRollback(options, forceRollback)
            .then(function (status) {
                console.log('\x1b[32mSuccess\x1b[0m\n');
                console.log('Successfully rolled back to version: ' + status)
            })
            .catch(err=>{
                console.error('\x1b[31mRollback failed\x1b[0m\n');
                console.error('The error is:', err);
                return Promise.reject();
            })
    }
}