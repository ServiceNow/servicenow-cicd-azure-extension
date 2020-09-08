const transportOptions = [];
for( let i =1; i<=3; i++) {
    transportOptions.push(require(`./mocktransport${i}.transport.json`));
}

const Pipeline = require('../pipeline');
const Transport = require('../transport');


Pipeline.defaults({
    auth: "login:password",
    url: "somedomain.service-now.com"
});


const appPublishTask = require('../../src/lib/AppPublish');
const appInstallTask = require('../../src/lib/AppInstall');
const appRollbackTask = require('../../src/lib/AppRollback');

describe('Application actions: publish, install and rollback using mock server', () => {

    test('Publish', done => {
        appPublishTask.init(new Pipeline({
            url:"cicdazureappauthor.service-now.com",
            scope: "x_sofse_cicdazurea",
            versionFormat: "autodetect"
        }), new Transport(transportOptions.shift()));
        return appPublishTask.run().then(() => done()).catch(err => done(err||''));
    });
    test('Install', done => {
        appInstallTask.init(new Pipeline({
            url:"cicdazureappclient.service-now.com",
            scope: "x_sofse_cicdazurea",
        }), new Transport(transportOptions.shift()));
        return appInstallTask.run().then(() => done()).catch(err => done(err||''));
    });

    test('Rollback', done => {
        appRollbackTask.init(new Pipeline({
            url:"cicdazureappclient.service-now.com",
            scope: "x_sofse_cicdazurea",
        }), new Transport(transportOptions.shift()));
        return appRollbackTask.run().then(() => done()).catch(err => done(err||''));
    });
});
