const APIService = require('./ServiceNowCICDRestAPIService');
const fs = require('fs');
const path = require('path');

function getCurrVersionFromFS(sysId, scope) {
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
                        const verMatch = fs
                            .readFileSync(path.join(projectPath, 'sys_app_' + sysId + '.xml'))
                            .toString()
                            .match(/<version>([^<]+)<\/version>/);
                        if (verMatch) {
                            version = verMatch[1];
                        }
                    } else {
                        const dirContent = fs.readdirSync(projectPath);
                        if (dirContent) {
                            const escapedScope = scope.replace(/&/g, '&amp;').replace(/</g, '&lt;');
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
                console.error('sn_source_control.properties not found')
            }
        } catch (e) {
            console.error(e);
        }
    } else {
        console.error('BUILD_SOURCESDIRECTORY env not found');
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
        'scope sys_id dev_notes'
            .split(' ')
            .forEach(name => {
                const val = pipeline.get(name);
                if (val) {
                    options[name] = val;
                }
            });
        let versionType = pipeline.get('versionFormat');
        switch (versionType) {
            case "exact":
                options.version = pipeline.get('version', true);
                break;
            case "template":
                options.version = pipeline.get('versionTemplate', true) + '.' + process.env['BUILD_BUILDNUMBER'];
                break;
            case "detect":
                console.log('Trying to get version from FS')
                version = getCurrVersionFromFS(options.sys_id, options.scope);
                if (version) {
                    console.log('Current version is ' + version + ', incrementing');
                    version = version.split('.').map(digit => parseInt(digit));
                    version[2]++;
                    version = version.join('.');
                    options.version = version;
                }
                break;
            default:
                console.error('No version format selected');
                return Promise.reject();
        }

        console.log('Start installation with version ' + (options.version || ''));
        return API
            .appRepoPublish(options)
            .then(function () {
                pipeline.setVar('ServiceNow-CICD-App-Publish.publishVersion', options.version);
                console.log('\x1b[32mSuccess\x1b[0m\n');
                console.log('Publication was made with version: ' + options.version);
            })
            .catch(err => {
                console.error('\x1b[31mInstallation failed\x1b[0m\n');
                console.error('The error is:', err);
                return Promise.reject();
            })
    }
}