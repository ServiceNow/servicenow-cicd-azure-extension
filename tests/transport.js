const initdata = {
    endpoints: {
        'plugin/activate': [],
        'plugin/rollback': [],
        'progress': [],
        'testsuite/results': [],
        'app_repo/install': [],
        'app_repo/publish': [],
        'app_repo/rollback': [],
        'sc/apply_changes': [],
        'testsuite/run': []
    },
    pointers: {
        'plugin/activate': 0,
        'plugin/rollback': 0,
        'progress': 0,
        'testsuite/results': 0,
        'app_repo/install': 0,
        'app_repo/publish': 0,
        'app_repo/rollback': 0,
        'sc/apply_changes': 0,
        'testsuite/run': 0
    }
};

function Transport(_data) {
    this.data = JSON.parse(JSON.stringify(initdata));
    if (typeof _data === 'string') {
        _data = JSON.parse(_data);
    }
    Object.keys(_data).forEach(endpoint => {
        this.data.endpoints[endpoint.replace(/^\/+/, '')] = _data[endpoint];
        if(!this.data.pointers.hasOwnProperty(endpoint)) {
            this.data.pointers[endpoint] = 0;
        }
    });
    return url => {
        if (url.indexOf('https://') === 0) {
            url = url.substr(url.indexOf('/api/') + 5);
            if (url.indexOf('now/table/') !== 0) {
                return Promise.reject('Bad url');
            }
            url = 'now/table/sys_app' + (url.indexOf('/sys_app/') > 0 ? '/' : '');
        } else if (url.indexOf('plugin') === 0) {
            url = url.replace(/\/.*\//, '/');
        } else if (url.indexOf('progress') === 0) {
            url = 'progress';
        } else if (url.indexOf('testsuite/results/') === 0) {
            url = 'testsuite/results';
        }
        if (!this.data.endpoints.hasOwnProperty(url)) {
            return Promise.reject('Bad request, URL not in endpoints range');
        }
        const result = this.data.endpoints[url][this.data.pointers[url]++];
        if (result.errorMessage) {
            return Promise.reject(result);
        } else {
            return Promise.resolve(result.response || result);
        }
    }
}

module.exports = Transport;