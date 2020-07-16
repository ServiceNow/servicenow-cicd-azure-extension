const https = require('https');
const URL = require('url');

function ServiceNowCICDRestAPIService(instance, auth) {
    if (
        typeof instance !== 'string' ||
        typeof auth !== 'string' ||
        instance.length < 3 ||
        auth.length < 3 ||
        auth.indexOf(':') < 1
    ) {
        throw new Error('Incorrect module usage');
    }
    instance = instance.replace(/(?:^https?\:\/\/)?([^\/]+)(?:\/.*$)/, '$1');
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

    function wait(ms) {
        return new Promise(a => setTimeout(() => a(), ms));
    }


    function getProgress(response) {
        let status = +getPropertyByPath(response, 'result.status');
        const progressId = getPropertyByPath(response, 'result.links.progress.id');
        if (progressId && (status === 0 || status === 1)) {
            const progressUrl = 'progress/' + progressId;
            return request(progressUrl)
                .then(progressBody => {
                    status = +getPropertyByPath(progressBody, 'result.status');
                    if (status >= 2) {
                        response.results = getPropertyByPath(progressBody, 'result.links.results');
                        if (status === 2) {
                            return Promise.resolve(response);
                        } else {
                            return Promise.reject(response);
                        }
                    } else {
                        console.log('Progress: ' + getPropertyByPath(progressBody, 'result.percent_complete')+'%');
                        return wait(config.delayInProgressPolling).then(() => getProgress(response))
                    }
                });
        } else {
            return Promise.resolve(response);
        }
    }

    function activatePlugin(id) {
        const URL = 'plugin/' + id + '/activate';
        return request(URL, {method: 'POST'})
            .then(resp => getProgress(resp))
            .then(resp => getPropertyByPath(resp, 'result.status_message'));
    }

    function deactivatePlugin(id) {
        const URL = 'plugin/' + id + '/rollback';
        return request(URL, {method: 'POST'})
            .then(resp => getProgress(resp))
            .then(resp => getPropertyByPath(resp, 'result.status_message'));
    }

    /**
     * Make a wrapper to https request
     * @param url
     * @param options
     * @returns {Promise<string>}
     */

    function request(url, options = {}) {
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
            var req = https.request(params, function (res) {
                // reject on bad status
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    return reject({statusCode: res.statusCode});
                }
                let body = [];
                res.on('data', function (chunk) {
                    body.push(chunk);
                });
                res.on('end', function () {
                    body = Buffer.concat(body).toString();
                    try {
                        body = JSON.parse(body);
                    } catch (e) {
                        reject({statusCode: res.statusCode, body});
                    }
                    resolve(body);
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
