const fs = require('fs');
const APIService = require('./ServiceNowCICDRestAPIService');
const path = require('path');

const defaultManifestFile = 'manifest.json';

/**
 * 
 * @param filename  string 
 * @returns         object
 */
function getPayloadFromFS(filename = '') {
    const sourceDir = process.env['BUILD_SOURCESDIRECTORY'];
    const manifestFile = filename || defaultManifestFile;
    if (sourceDir) {
        const fullpath = path.join(sourceDir, manifestFile);
        console.log('Reading payload from ' + fullpath);
        try {
            const payload = require(fullpath);

            return payload;
        } catch (error) {
            process.stderr.write(error.toString() + '\n');
        }
    } else {
        process.stderr.write('BUILD_SOURCESDIRECTORY env not found\n');
    }

    return Promise.reject();
}

let API, pipeline;
module.exports = {
    init: (_pipeline, transport) => {
        pipeline = _pipeline;
        API = new APIService(pipeline.url(), pipeline.auth(), transport);
    },
    run: () => {
        let options = {}, payload = '';
        'payload_source batch_name batch_notes batch_packages batch_file'
            .split(' ')
            .forEach(name => {
                const val = pipeline.get(name);
                if (val) {
                    options[name] = val;
                }
            });
            const url = 'app/batch/install';
            switch (options.payload_source) {
                case 'file':
                    payload = getPayloadFromFS(options.batch_file);
                    break;
                case 'pipeline':
                    payload = {
                        name: options.batch_name,
                        notes: options.batch_notes,
                        packages: JSON.parse(`[${options.batch_packages}]`)
                    };
                    break;
                default:
                    process.stderr.write('Wrong payload source is provided.\n');
                    return Promise.reject();
            }

        console.log(`Start ${payload.name} batch install`);
        return API
            .batchInstall(url, JSON.stringify(payload))
            .then(function (rollbackUrl) {
                console.log('\x1b[32mSuccess\x1b[0m\n');
                console.log('Rollback URL: ', rollbackUrl);
                pipeline.setVar('ServiceNow-CICD-Batch-Install.rollbackUrl', rollbackUrl);
                pipeline.setVar('rollbackUrl', rollbackUrl);
                
                return rollbackUrl;
            })
            .catch(err => {
                process.stderr.write('\x1b[31mBatch Install failed!\x1b[0m\n');
                err && process.stderr.write('The error is: ' + err);
                return Promise.reject(err);
            });
    }
};
