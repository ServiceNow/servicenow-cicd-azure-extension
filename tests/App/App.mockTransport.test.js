const rewire = require('rewire');
const transportOptions = [];
for( let i =1; i<=7; i++) {
    transportOptions.push(require(`./mocktransport${i}.transport.json`));
}

const Pipeline = require('../pipeline');
const Transport = require('../transport');


Pipeline.defaults({
    auth: "login:password",
    url: "somedomain.service-now.com"
});


const appPublishTask = rewire('../../src/lib/AppPublish');
const appInstallTask = require('../../src/lib/AppInstall');
const appRollbackTask = require('../../src/lib/AppRollback');
// const app = rewire('../../src/lib/AppPublish');

describe('Application actions: publish, install and rollback using mock server', () => {
    test('Publish_autodetect', done => {
        appPublishTask.init(new Pipeline({
            url:"cicdazureappauthor.service-now.com",
            scope: "x_sofse_cicdazurea",
            versionFormat: "autodetect"
        }), new Transport(transportOptions.shift()));
        
        return appPublishTask.run().then(ver => expect(ver).toEqual('1.3.37')).then(() => done()).catch(err => done(err||''));
    });

    test('Publish_exact', done => {
        appPublishTask.init(new Pipeline({
            url:"cicdazureappauthor.service-now.com",
            scope: "x_sofse_cicdazurea",
            versionFormat: "exact",
            version: "1.2.3"
        }), new Transport(transportOptions.shift()));

        return appPublishTask.run().then(ver => expect(ver).toEqual('1.2.3')).then(() => done()).catch(err => done(err||''));
    });

    test('Publish_detect', done => {
        // Mock getCurrVersionFromFS()
        const mockedGetCurrVersionFromFS = jest.fn(() => '1.2.3');
        appPublishTask.__set__('getCurrVersionFromFS', mockedGetCurrVersionFromFS);

        appPublishTask.init(new Pipeline({
            url:"cicdazureappauthor.service-now.com",
            scope: "x_sofse_cicdazurea",
            versionFormat: "detect",
            increment_by: 2,
        }), new Transport(transportOptions.shift()));

        return appPublishTask.run().then(ver => expect(ver).toEqual('1.2.5')).then(() => done()).catch(err => done(err||''));
    });

    test('Publish_detect_no_incr', done => {
        // Mock getCurrVersionFromFS()
        const mockedGetCurrVersionFromFS = jest.fn(() => '1.2.3');
        appPublishTask.__set__('getCurrVersionFromFS', mockedGetCurrVersionFromFS);

        appPublishTask.init(new Pipeline({
            url:"cicdazureappauthor.service-now.com",
            scope: "x_sofse_cicdazurea",
            versionFormat: "detect_without_autoincrement",
        }), new Transport(transportOptions.shift()));

        return appPublishTask.run().then(ver => expect(ver).toEqual('1.2.3')).then(() => done()).catch(err => done(err||''));
    });
    
    test('Publish_template', done => {
        // Mock getBuildId()
        const mockedGetBuildId = jest.fn(() => 'abc_3');
        appPublishTask.__set__('getBuildId', mockedGetBuildId);

        appPublishTask.init(new Pipeline({
            url:"cicdazureappauthor.service-now.com",
            scope: "x_sofse_cicdazurea",
            versionFormat: "template",
            versionTemplate: "1.2"
        }), new Transport(transportOptions.shift()));

        return appPublishTask.run().then(ver => expect(ver).toEqual('1.2.3')).
            then(() => {
                return done();
            }).catch(err => done(err||''));
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
