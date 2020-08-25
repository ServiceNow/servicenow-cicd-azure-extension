const APIService = require('./ServiceNowCICDRestAPIService');
const messages = {
    'error': 'Error message.',
    'rolledup_test_error_count': 'Number of tests with errors',
    'rolledup_test_failure_count': 'Number of tests that failed',
    'rolledup_test_skip_count': 'Number of tests that were skipped',
    'rolledup_test_success_count': 'Number of tests that ran successfully',
    'status_detail': 'Additional information about the current state',
    'status_message': 'Description of the current state',
    'test_suite_duration': 'Amount of time that it took to execute the test suite',
    'test_suite_name': 'Name of the test suite'
};
let API, pipeline;
module.exports = {
    init: (_pipeline, transport) => {
        pipeline = _pipeline;
        API = new APIService(pipeline.url(), pipeline.auth(), transport);
    },
    run: () => {
        let options = {};
        'browser_name browser_version os_name os_version test_suite_sys_id test_suite_name'
            .split(' ')
            .forEach(name => {
                const val = pipeline.get(name);
                if (val) {
                    options[name] = val;
                }
            });
        return API
            .testSuiteRun(options)
            .catch(err => {
                process.stderr.write('\x1b[31mTestsuite run failed\x1b[0m\n');
                process.stderr.write('The error is:' + err);
                return Promise.reject(err);
            })
            .then(function (response) {
                if (response) {
                    if (response.status === '2') { //success
                        console.log('\x1b[32mSuccess\x1b[0m\n');
                    } else {
                        process.stderr.write('\x1b[31mTestsuite run failed\x1b[0m\n');
                    }

                    if (response.links && response.links.results && response.links.results.url) {
                        console.log('Link to results is: ' + response.links.results.url);
                    }
                    console.log(Object.keys(messages)
                        .filter(name => response[name])
                        .map(name => messages[name] + ': ' + response[name])
                        .join('\n')
                    );
                    if (response.status !== '2') {
                        return Promise.reject('Testsuite failed');
                    }
                }
            })

    }
}