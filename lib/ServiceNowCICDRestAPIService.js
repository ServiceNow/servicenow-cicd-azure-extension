const https = require('https');
const URL = require('url');

/**
 *
 * @param instance string Domain name of instance
 * @param auth string username:password
 * @param transport default is https, and can be changed to mocks
 * @constructor
 */
function ServiceNowCICDRestAPIService(instance, auth, transport = null) {
    if (
        typeof instance !== 'string' ||
        typeof auth !== 'string' ||
        instance.length < 3 ||
        auth.length < 3 ||
        auth.indexOf(':') < 1
    ) {
        throw new Error('Incorrect module usage');
    }
    instance = instance.replace(/(?:^https?:\/\/)?([^\/]+)(?:\/.*$)/, '$1');
    if (!instance.length) {
        throw new Error('Incorrect instance');
    }

    const config = {
        instance,
        auth,
        delayInProgressPolling: 200
    };
    const errCodeMessages = {
        401: 'The user credentials are incorrect.',
        403: 'Forbidden. The user is not an admin or does not have the CICD role.',
        404: 'Not found. The requested item was not found.',
        405: 'Invalid method. The functionality is disabled.',
        409: 'Conflict. The requested item is not unique.',
        500: 'Internal server error. An unexpected error occurred while processing the request.'
    };

    this.activatePlugin = activatePlugin;
    this.deActivatePlugin = deactivatePlugin;
    // this.getTSResults = getTSResults;
    this.testSuiteRun = testSuiteRun;
    this.appRepoInstall = appRepoInstall;
    this.appRepoRollback = appRepoRollback;
    this.appRepoPublish = appRepoPublish;
    this.SCApplyChanges = SCApplyChanges;

    /**
     * Activate plugin by its ID
     * @param id string
     * @returns {Promise<string>}
     */
    function activatePlugin(id) {
        const URL = 'plugin/' + id + '/activate';
        return request(URL, {method: 'POST'})
            .then(resp => getProgress(resp))
            .then(resp => resp.status_message);
    }

    /**
     * Deactivate plugin by its ID
     * @param id string
     * @returns {Promise<string>}
     */
    function deactivatePlugin(id) {
        const URL = 'plugin/' + id + '/rollback';
        return request(URL, {method: 'POST'})
            .then(resp => getProgress(resp))
            .then(resp => resp.status_message);
    }

    /**
     * Get TestSuite run results by ID
     * @param resultID string
     * @returns {Promise<string>}
     */
    function getTSResults(resultID) {
        const URL = 'testsuite/results/' + resultID;
        return request(URL);
    }

    /**
     * Run Test Suite
     * available options are:
     * test_suite_sys_id, test_suite_name, browser_name, browser_version, os_name os_version
     * required options are:
     * test_suite_sys_id|test_suite_name
     * @param options object
     * @returns {Promise<object>}
     */

    function testSuiteRun(options) {
        if (!options || !(options.test_suite_sys_id || options.test_suite_name)) {
            return Promise.reject('Please specify test_suite_name or test_suite_sys_id');
        }
        if(options.test_suite_sys_id && options.test_suite_name) {
            delete options.test_suite_name;
        }
        const URL = 'testsuite/run?' +
            'test_suite_sys_id test_suite_name browser_name browser_version os_name os_version'
                .split(' ')
                .filter(optName => options.hasOwnProperty(optName))
                .map(optName => optName + '=' + encodeURIComponent(options[optName]))
                .join('&');
        return request(URL, {method: 'POST'})
            .then(resp => getProgress(resp))
            .then(resp => getPropertyByPath(resp, 'results.id'))
            .then(resultID => resultID ? getTSResults(resultID) : Promise.reject('No result ID'))
    }

    /**
     * Install the specified application from the application repository onto the local instance
     * available options are:
     * scope, sys_id, version
     * required options are:
     * scope|sys_id
     * @param options
     * @returns {Promise<string>} If available, the previously installed version. If not available, null.
     */
    function appRepoInstall(options) {
        if (!options || !(options.scope || options.sys_id)) {
            return Promise.reject('Please specify scope or sys_id');
        }
        if(options.scope && options.sys_id) {
            delete options.scope;
        }
        const URL = 'app_repo/install?' +
            'sys_id scope version'
                .split(' ')
                .filter(optName => options.hasOwnProperty(optName))
                .map(optName => optName + '=' + encodeURIComponent(options[optName]))
                .join('&');
        return request(URL, {method: 'POST'})
            .then(resp => getProgress(resp))
            .then(resp => resp.rollback_version || (resp.results && resp.results.rollback_version));
    }

    /**
     * Initiate a rollback of a specified application to a specified version
     * available options are:
     * scope, sys_id, version
     * required options are:
     * scope|sys_id, version
     * @param options
     * @returns {Promise<object>}
     */
    function appRepoRollback(options) {
        if (!options || !(options.scope || options.sys_id) || !options.version) {
            return Promise.reject('Please specify scope or sys_id, and version');
        }
        if(options.scope && options.sys_id) {
            delete options.scope;
        }
        const URL = 'app_repo/rollback?' +
            'sys_id scope version'
                .split(' ')
                .filter(optName => options.hasOwnProperty(optName))
                .map(optName => optName + '=' + encodeURIComponent(options[optName]))
                .join('&');
        return request(URL, {method: 'POST'})
            .then(resp => getProgress(resp));
    }

    /**
     * Publish the specified application and all of its artifacts to the application repository
     * available options are:
     * scope, sys_id, version, dev_notes
     * required options are:
     * scope|sys_id
     * @param options
     * @returns {Promise<string>}
     */
    function appRepoPublish(options) {
        if (!options || !(options.scope || options.sys_id)) {
            return Promise.reject('Please specify scope or sys_id');
        }
        if(options.scope && options.sys_id) {
            delete options.scope;
        }
        const URL = 'app_repo/publish?' +
            'sys_id scope version dev_notes'
                .split(' ')
                .filter(optName => options.hasOwnProperty(optName))
                .map(optName => optName + '=' + encodeURIComponent(options[optName]))
                .join('&');
        return request(URL, {method: 'POST'})
            .then(resp => getProgress(resp));
    }

    /**
     * Start applying changes from a remote source control to a specified local application.
     * available options are:
     * app_scope, app_sys_id, branch_name
     * required options are:
     * app_scope|app_sys_id
     * @param options object
     * @returns {Promise<object>}
     */
    function SCApplyChanges(options) {
        if (!options || !(options.app_scope || options.app_sys_id)) {
            return Promise.reject('Please specify app_scope or app_sys_id');
        }
        if(options.app_scope && options.app_sys_id) {
            delete options.app_scope;
        }
        const URL = 'sc/apply_changes?' +
            'app_sys_id app_scope branch_name'
                .split(' ')
                .filter(optName => options.hasOwnProperty(optName))
                .map(optName => optName + '=' + encodeURIComponent(options[optName]))
                .join('&');
        return request(URL, {method: 'POST'})
            .then(resp => getProgress(resp));
    }

///////////////////////////////////////////////////////////////////////////////

    function wait(ms) {
        return new Promise(a => setTimeout(() => a(), ms));
    }

    /**
     * Wait until progress resolves and return result or reject on error.
     * @param response object
     * @returns {Promise<string>|<object>}
     */
    function getProgress(response) {
        let status = +response.status;
        const progressId = getPropertyByPath(response, 'links.progress.id');
        if (progressId && (status === 0 || status === 1)) {
            const progressUrl = 'progress/' + progressId;
            return request(progressUrl)
                .then(progressBody => {
                    status = +progressBody.status;
                    if (status >= 2) {
                        process.stdout.write('\n');
                        response.results = getPropertyByPath(progressBody, 'links.results');
                        if (status === 2) {
                            return Promise.resolve(response);
                        } else {
                            return Promise.reject(progressBody.error || progressBody.status_message);
                        }
                    } else {
                        process.stdout.write('.');
                        return wait(config.delayInProgressPolling).then(() => getProgress(response))
                    }
                });
        } else {
            return status === 2 ?
                Promise.resolve(response) :
                Promise.reject(response.error || response.status_message);
        }
    }

    /**
     * Make a wrapper to https request
     * @param url
     * @param options
     * @returns {Promise<string>}
     */

    function request(url, options = {}) {
        if (transport) {
            return transport(url, options);
        }

        if (url.indexOf('https://') !== 0) {
            url = `https://${config.instance}/api/sn_cicd/${url}`;
        }
        let urldata = URL.parse(url);
        options.host = urldata.host;
        options.path = urldata.path;
        options.auth = config.auth;
        if (!options.headers) {
            options.headers = {};
        }
        options.headers.accept = 'application/json';
        return httpsRequest(options)
            .catch(err => {
                // console.error(err);
                let message = err.code || (
                    err.statusCode && (
                        errCodeMessages[err.statusCode] || err.statusCode
                    )
                );
                if (
                    err.statusCode &&
                    err.statusCode === 400 &&
                    err.body &&
                    err.body.error
                ) {
                    message = err.body.error;
                }
                if (
                    err.statusCode &&
                    err.statusCode === 200 &&
                    err.body.indexOf('class="instance-hibernating-page"') > 0
                ) {
                    message = 'Instance is hibernated';
                }
                return Promise.reject(message);
            })
    }

    /**
     *
     * @param object object
     * @param path string
     * @returns value mixed
     */
    function getPropertyByPath(object, path) {
        return path.split('.').reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, object);
    }

    function httpsRequest(params, postData) {
        return new Promise(function (resolve, reject) {
            let req = https.request(params, function (res) {
                // reject on bad status
                let body = [];
                res.on('data', function (chunk) {
                    body.push(chunk);
                });
                res.on('end', function () {
                    body = Buffer.concat(body).toString();
                    let errState = res.statusCode !== 200;
                    try {
                        body = JSON.parse(body).result;
                    } catch (e) {
                        errState = true;
                    }
                    if (errState) {
                        reject({statusCode: res.statusCode, body});
                    } else {
                        resolve(body);
                    }
                });
            });
            req.on('error', function (err) {
                console.error(2, err)
                reject(err);
            });
            if (params.method === 'POST' && postData) {
                req.write(postData);
            }
            req.end();
        });
    }
}

module.exports = ServiceNowCICDRestAPIService;
