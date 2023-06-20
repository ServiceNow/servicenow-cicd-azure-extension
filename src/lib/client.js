const wait = require('./wait');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { CookieJar } = require('tough-cookie');
const { HttpCookieAgent, HttpsCookieAgent } = require('http-cookie-agent/http');

/**
 * Rest Client
 * @param {*} param0
 * @param {*} param1
 * @returns
 */
const client = function ({ baseURL, auth, httpsProxyHost, httpsProxyPort, httpProxyHost, httpProxyPort, certFilePath, errCodeMessages = {}, sleepTime = 3000, maxTransactionIteration = 500 } = {}, { cookie = false } = {}) {

    const axiosConfig = {
        responseType: 'json',
        baseURL,
        headers: {
            'User-Agent': 'sncicd_extint_azure',
            'content-type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(auth).toString('base64'),
        }
    };

    let httpProxy = httpProxyHost;
    let httpsProxy = httpsProxyHost;
    if (httpProxy || httpsProxy) {

        const host = httpsProxy || httpProxy;
        const port = httpsProxyPort || httpProxyPort || 8080;

        console.info('REST client with proxy support %s:%s', host, port);

        axiosConfig.proxy = {
            protocol: (httpsProxy) ? 'https' : 'http',
            host,
            port
        }

    }

    const agentConfig = {
        rejectUnauthorized: false
    }
    let jar;
    if (cookie) {
        console.info('REST client with cookie support');

        if (cookie === true) {
            jar = new CookieJar();
        } else {
            jar = cookie;
        }
        agentConfig.cookies = { jar }
    }

    axiosConfig.httpAgent = new HttpCookieAgent(agentConfig);
    axiosConfig.httpsAgent = new HttpsCookieAgent(agentConfig);

    if (certFilePath) {
        const certFile = path.resolve(certFilePath);
        if (fs.existsSync(certFile)) {
            console.info('REST client with certificate support');
            agentConfig.ca = fs.readFileSync(certFile);
        } else {
            console.warn('Certificate file not found: %s', certFile);
        }
    }

    const instance = axios.create(axiosConfig);

    const catchErr = (e) => {

        if (e.response) {
            const statusCode = e.response.status;
            const message = errCodeMessages[statusCode] || e.response.statusText;

            if (e.response.data) {
                //const error = e.response.data.result?.error || e.response.data.result || e.response.data;
                try {
                    throw Error(`${statusCode}: ${message} - ${JSON.stringify(e.response.data)}`);
                } catch (e) {
                    throw Error(`${statusCode}: ${message}`);
                }

            }

            if (message) {
                throw Error(`${statusCode}: ${message}`);
            }
        }
        throw Error(e);
    }

    const get = async (...args) => {
        try {
            return await instance.get(...args);
        } catch (e) {
            catchErr(e);
        }
    }
    const post = async (...args) => {
        try {
            return await instance.post(...args);
        } catch (e) {
            catchErr(e);
        }
    }

    const put = async (...args) => {
        try {
            return await instance.put(...args);
        } catch (e) {
            catchErr(e);
        }
    }
    const patch = async (...args) => {
        try {
            return await instance.patch(...args);
        } catch (e) {
            catchErr(e);
        }
    }

    const deleteRecord = async (...args) => {
        try {
            return await instance.delete(...args);
        } catch (e) {
            catchErr(e);
        }
    }

    const awaitResult = async (response) => {

        console.info('Awaiting result for %j', response.data);

        if (isDevStudioTransaction(response)) {
            const awaitResponse = await awaitResultDevStudio(response);
            // bring the response into the same shape as the 'awaitResultDevOps()' function does
            const { sysId: progressId, state: status, name: status_label, message: status_message, detailMessage: status_detail, result, errorMessage: error, percentComplete: percent_complete, viewDetailsLink, historyRecordSysId } = awaitResponse.data.result;
            const data = {
                result: {
                    links: {
                        progress: {
                            id: progressId,
                            url: `${baseURL}/api/sn_devstudio/v1/vcs/transactions/${progressId}`
                        }
                    },
                    status,
                    status_label,
                    status_message,
                    status_detail,
                    error,
                    percent_complete,
                    result: (() => {
                        let out = result;
                        try {
                            out = JSON.parse(result)
                        } catch (e) {
                            console.warn(`result is not JSON: ${result}`)
                        }
                        return out;
                    })()
                }
            }
            if (viewDetailsLink && historyRecordSysId) {
                data.result.links.results = {
                    id: historyRecordSysId,
                    url: `${baseURL}${viewDetailsLink}`
                }
            }
            awaitResponse.data = data;

            return awaitResponse;
        }

        return awaitResultDevOps(response)

    }

    const isDevStudioTransaction = (response) => {
        const result = response.data.result;
        // calls to 'sn_devstudio'
        return (result.progressId || (result.sysId && result.state))
    }

    const awaitResultDevStudio = async (response, counter = 0) => {


        const result = response.data.result;

        // the initial request has no state field, set it to default '0'
        result.state = result.state || 0;
        const status = parseInt(result.state, 10);

        // the initial request has 'progressId' the next ones 'sysId' instead
        const progressId = result.progressId || result.sysId;
        const progressUrl = `api/sn_devstudio/v1/vcs/transactions/${progressId}`;

        const percentage = result.percentComplete || '0';
        const detailMessage = result.detailMessage || '-';

        console.info('%s% complete. Detail message: %s', percentage, detailMessage);

        if (!progressId) {
            throw new Error('No progressId found in response')
        }

        /* 0 = Pending
           1 = Running
           2 = Successful
           3 = Failed
           4 = Cancelled */
        if (status == 2) {
            return response;
        }

        if (status > 2) {
            throw new Error(`Request failed - Status: ${status} - ${detailMessage}`)
        }

        if (counter >= maxTransactionIteration) {
            throw new Error(`Transaction did not complete within ${(sleepTime * counter / 1000)} seconds`)
        }

        await wait(sleepTime);

        response = await get(progressUrl);

        // increase counter
        counter += 1;

        return awaitResultDevStudio(response, counter);
    }

    const awaitResultDevOps = async (response, counter = 0) => {

        const result = response.data.result;
        const status = parseInt(result.status, 10);
        const progressUrl = result?.links?.progress?.url;
        const resultsUrl = result?.links?.results?.url;
        if (!progressUrl)
            return response;

        /* 0 = Pending
           1 = Running
           2 = Successful
           3 = Failed
           4 = Cancelled */

        if (status > 2) {
            if (resultsUrl) {
                result.url = resultsUrl;
            }
            //console.error(`${result.status}: ${result.status_label} - ${result.status_message} - ${result.status_detail}. URL:${resultsUrl}`);
            return response;
        }

        if (counter >= maxTransactionIteration) {
            throw new Error(`Transaction did not complete within ${(sleepTime * counter / 1000)} seconds`)
        }

        if (status === 2) {
            // automatically load results
            if (resultsUrl) {
                return get(resultsUrl)
            }
            return response;
        }

        if (status === 1) {
            const percentage = result.percent_complete;
            if (typeof percentage !== 'undefined') {
                console.info(`${percentage}% complete... (${counter}/${maxTransactionIteration})`);
            }
        }

        await wait(sleepTime);

        response = await get(progressUrl);
        //console.debug('REST Response: %j', response.data)

        // increase counter
        counter += 1;

        return awaitResultDevOps(response, counter);

    }

    const list = async (tableName, ...args) => {
        return get(`/api/now/table/${tableName}`, ...args);
    }
    const first = async (tableName, ...args) => {
        return (await get(`/api/now/table/${tableName}`, ...args)).data.result[0];
    }

    const read = async (tableName, sysId, ...args) => {
        return get(`/api/now/table/${tableName}/${sysId}`, ...args);
    }

    const create = async (tableName, ...args) => {
        console.info(`POST to: ${baseURL}/api/now/table/${tableName}`);
        return post(`/api/now/table/${tableName}`, ...args);
    }

    const write = async (tableName, sysId, payload, ...args) => {
        return put(`/api/now/table/${tableName}/${sysId}`, payload, ...args);
    }

    const remove = async (tableName, sysId, ...args) => {
        return deleteRecord(`/api/now/table/${tableName}/${sysId}`, ...args);
    }

    const update = async (tableName, sysId, payload, ...args) => {
        return patch(`/api/now/table/${tableName}/${sysId}`, payload, ...args);
    }



    return {
        instance,
        get,
        post,
        put,
        patch,
        delete: deleteRecord,

        postProgress: async (...args) => {
            const response = await post(...args);
            console.info('Request complated, waiting for result...');
            return awaitResult(response);
        },
        putProgress: async (...args) => {
            const response = await put(...args);
            console.info('Request complated, waiting for result...');
            return awaitResult(response);
        },
        getProgress: async (...args) => {
            const response = await get(...args);
            console.info('Request complated, waiting for result...');
            return awaitResult(response);
        },

        list,
        first,
        create,
        read,
        write,
        remove,
        update,
        getJar: () => {
            return jar;
        }
    };
};


module.exports = client;

