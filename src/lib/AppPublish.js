const APIService = require('./ServiceNowCICDRestAPIService');
const fs = require('fs');
const path = require('path');

function getBuildId() {
    return process.env['BUILD_BUILDID'];
}

/**
 * @param versionType   string
 * @param options       object
 * @throws Error
 */
function checkIsAppCustomization(versionType, options) {
    if (['autodetect','detect'].includes(versionType) && 
        options.is_app_customization === true && !options.sys_id) {
        throw Error('Sys_id is not defined!');
    }
}

function getCurrVersionFromFS(options) {
    const { sys_id: sysId, scope, is_app_customization: isAppCustomization } = options;
    const sourceDir = process.env['BUILD_SOURCESDIRECTORY'];
    let version;
    if (sourceDir) {
        console.log('Looking in ' + sourceDir);
        try {
            let sourceDirContent = fs.readdirSync(sourceDir);
            if (sourceDirContent && sourceDirContent.indexOf('sn_source_control.properties')) {
                let snConfig = fs.readFileSync(path.join(sourceDir, '/sn_source_control.properties')).toString();
                let match = snConfig.match(/^path=(.*)\s*$/m);
                if (match) {
                    const projectPath = path.join(sourceDir, match[1]);
                    console.log('Trying ' + projectPath);
                    if (sysId) {
                        const filePrefix = isAppCustomization ? 'sys_app_customization_' : 'sys_app_' ;
                        const verMatch = fs
                            .readFileSync(path.join(projectPath, filePrefix + sysId + '.xml'))
                            .toString()
                            .match(/<version>([^<]+)<\/version>/);
                        if (verMatch) {
                            version = verMatch[1];
                        }
                    } else {
                        const dirContent = fs.readdirSync(projectPath);
                        if (dirContent) {
                            const escapedScope = scope.replace(/&/g, '&amp;').replace(/</g, '&lt;');
                            // use sys_app_ cause it's not customization table for sure(sys_id is not provided)
                            let apps = dirContent.filter(f => /^sys_app_[0-9a-f]{32}\.xml$/.test(f));
                            for (const app of apps) {
                                console.log('Try ' + app);
                                const fcontent = fs.readFileSync(path.join(projectPath, app)).toString();
                                if (fcontent.indexOf('<scope>' + escapedScope + '</scope>') > 0) {
                                    version = fcontent.match(/<version>([^<]+)<\/version>/)[1];
                                    break;
                                }
                            }
                        }
                    }
                }
            } else {
                process.stderr.write('sn_source_control.properties not found\n');
            }
        } catch (e) {
            process.stderr.write(e.toString() + '\n');
        }
    } else {
        process.stderr.write('BUILD_SOURCESDIRECTORY env not found\n');
    }
    return version;
}


let API, pipeline;
module.exports = {
    init: (_pipeline, transport) => {
        pipeline = _pipeline;
        API = new APIService(pipeline.url(), pipeline.auth(), transport);
    },
    run: () => {
        let options = {};
        let version;
        'scope sys_id dev_notes is_app_customization increment_by'
            .split(' ')
            .forEach(name => {
                const val = pipeline.get(name);
                if (val) {
                    if (name === 'is_app_customization') {
                        // convert 'false' to false
                        options[name] = val === 'true' ? true : false;
                    } else {
                        options[name] = val;
                    }
                }
            });
        let versionType = pipeline.get('versionFormat');
        checkIsAppCustomization(versionType, options);
        switch (versionType) {
            case "exact":
                options.version = pipeline.get('version', true);
                break;
            case "template":
                options.version = pipeline.get('versionTemplate', true) +
                    '.' + getBuildId().replace(/\D+/g, '');
                break;
            case "detect":
                console.log('Trying to get version from FS');
                let increment;
                version = getCurrVersionFromFS(options);
                if (version) {
                    if (+options.increment_by < 0) {
                        return Promise.reject('Increment_by should be positive or zero.');
                    } else {
                        increment = options.increment_by ? +options.increment_by : 0;
                    }

                    console.log('Current version is ' + version + ', incrementing by ' + increment);
                    version = version.split('.').map(digit => parseInt(digit));
                    version[2]+=increment;
                    version = version.join('.');
                    options.version = version;
                }
                break;
            case "autodetect":
                options.autodetect = true;
                break;
            default:
                process.stderr.write('No version format selected\n');
                return Promise.reject();
        }

        console.log('Start installation with version ' + (options.version || ''));
        return API
            .appRepoPublish(options)
            .then(function (version) {
                pipeline.setVar('ServiceNow-CICD-App-Publish.publishVersion', version);
                pipeline.setVar('publishVersion', version);
                console.log('\x1b[32mSuccess\x1b[0m\n');
                console.log('Publication was made with version: ' + version);
                return version;
            })
            .catch(err => {
                process.stderr.write('\x1b[31mPublication failed\x1b[0m\n');
                process.stderr.write('The error is:' + err);
                return Promise.reject(err);
            });
    }
};
