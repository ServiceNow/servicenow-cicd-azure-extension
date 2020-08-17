const fs = require('fs');
const fse = require('fs-extra');
const archiver = require('archiver');
const path = require('path');

const tasks = [
    'AppInstall',
    'AppPublish',
    'AppRollback',
    'PluginActivate',
    'PluginRollback',
    'SCApply',
    'TestRun',
];


function getVersion(task = '') {
    if ('' === task) {
        return new Promise((resolve, reject) => {
            fs.readFile(path.join(__dirname, 'src/extension/extension.vsixmanifest'), (err, body) => {
                if (err) {
                    reject(err);
                } else {
                    let match = body.toString().match(/<Identity [^>]+Version="(\d+\.\d+\.\d+)"/);
                    if (!match) {
                        reject('Could not get version from extension.vsixmanifest');
                    } else {
                        resolve(match[1].split('.').map(d => +d));
                    }
                }
            });
        });
    } else {
        return fse
            .readJson(path.join(__dirname, 'src/extension/Tasks', task, 'task.json'))
            .then(json => [+json.version.Major, +json.version.Minor, +json.version.Patch]);
    }
}

/**
 * expects version as an array [major, minor, patch];
 *
 * @param version Array
 */
function setVersion(version) {
    const
        stringVersion = version.join('.'),
        objVersion = {
            Major: version[0],
            Minor: version[1],
            Patch: version[2]
        };
    let promises = tasks.map(task => {
        const fName = path.join(__dirname, 'src/extension/Tasks', task, 'task.json');
        return fse
            .readJson(fName)
            .then(json => {
                json.version = objVersion;
                return fse.writeJson(fName, json, {spaces: 4});
            })
    });
    promises.push(new Promise((resolve, reject) => {
        const fName = path.join(__dirname, 'src/extension/extension.vsixmanifest');
        fs.readFile(fName, (err, body) => {
            if (err) {
                reject(err);
            } else {
                body = body
                    .toString()
                    .replace(
                        /(<Identity [^>]+Version=")(\d+\.\d+\.\d+)"/,
                        '$1' + stringVersion + '"'
                    );
                fs.writeFile(fName, body, err => err ? reject(err) : resolve());
            }
        });
    }));
    return Promise.all(promises);
}

function incrementVersion() {
    return Promise
        .all(['', ...tasks].map(task => getVersion(task)))
        .then(versions => {
            let version = versions.pop();
            version.forEach(v => {
                if (
                    v[0] > version[0] ||
                    (v[0] === version[0] && v[1] > version[1]) ||
                    (v[0] === version[0] && v[1] === version[1] && v[2] > version[2])
                ) {
                    version = v;
                }
            });
            version[2]++;
            return setVersion(version);
        });
}

function build() {
    const outDir = path.join(__dirname, 'out');
    return fse.ensureDir(path.join(__dirname, 'tmp'), 0o2775)
        .then(() => fse.emptyDir(outDir))
        .then(() => fse.copy(path.join(__dirname, 'src/extension'), outDir))
        .then(() => tasks.map(task => Promise.all([
                fse.copy(path.join(__dirname, 'src/lib/AzureDevopsPipeline.js'), path.join(outDir, 'Tasks', task, 'AzureDevopsPipeline.js')),
                fse.copy(path.join(__dirname, 'src/lib/ServiceNowCICDRestAPIService.js'), path.join(outDir, 'Tasks', task, 'ServiceNowCICDRestAPIService.js')),
                fse.copy(path.join(__dirname, 'src/lib/index.js'), path.join(outDir, 'Tasks', task, 'index.js')),
                fse.copy(path.join(__dirname, `src/lib/${task}.js`), path.join(outDir, 'Tasks', task, 'task.js')),
                fse.copy(path.join(__dirname, 'src/node_modules'), path.join(outDir, 'Tasks', task, 'node_modules'))
            ]))
        )
        .then(() => createArchive())
        .then(() => fse.move(path.join(__dirname, 'tmp/servicenow.vsix'), path.join(__dirname, 'out/servicenow.vsix')));
}

function createArchive() {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(path.join(__dirname, 'tmp/servicenow.vsix'));
        const archive = archiver('zip', {
            zlib: {level: 5} // Sets the compression level.
        });
        output.on('close', () => resolve());
        output.on('end', () => resolve());

        archive.on('warning', err => reject(err));
        archive.on('error', err => reject(err));
        archive.directory(path.join(__dirname, 'out'), false);
        archive.pipe(output);
        archive.finalize();
    });
}

incrementVersion().then(() => build()).then(() => console.log('success')).catch(e => console.error(e));