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
    test('Publish_autodetect', async() => {
        await appPublishTask.init(new Pipeline({
            url:"cicdazureappauthor.service-now.com",
            scope: "x_sofse_cicdazurea",
            versionFormat: "autodetect"
        }), new Transport(transportOptions.shift()));
        
        const ver = await appPublishTask.run();
        expect(ver).toEqual('1.3.37');
    });

    test('Publish_exact', async() => {
        await appPublishTask.init(new Pipeline({
            url:"cicdazureappauthor.service-now.com",
            scope: "x_sofse_cicdazurea",
            versionFormat: "exact",
            version: "1.2.3"
        }), new Transport(transportOptions.shift()));

        const ver = await appPublishTask.run();
        expect(ver).toEqual('1.2.3');
    });

    test('Publish_detect', async() => {
        // Mock getCurrVersionFromFS()
        const mockedGetCurrVersionFromFS = jest.fn(() => '1.2.3');
        appPublishTask.__set__('getCurrVersionFromFS', mockedGetCurrVersionFromFS);

        await appPublishTask.init(new Pipeline({
            url:"cicdazureappauthor.service-now.com",
            scope: "x_sofse_cicdazurea",
            versionFormat: "detect",
            increment_by: 2,
        }), new Transport(transportOptions.shift()));

        const ver = await appPublishTask.run();
        expect(ver).toEqual('1.2.5');
    });

    test('Publish_detect_no_incr', async() => {
        try {
            // Mock getCurrVersionFromFS()
            const mockedGetCurrVersionFromFS = jest.fn(() => '1.2.3');
            appPublishTask.__set__('getCurrVersionFromFS', mockedGetCurrVersionFromFS);
            console.log('Mocked function output:', mockedGetCurrVersionFromFS());

            await appPublishTask.init(new Pipeline({
                url:"cicdazureappauthor.service-now.com",
                scope: "x_sofse_cicdazurea",
                versionFormat: "detect_without_autoincrement",
            }), new Transport(transportOptions.shift()));

            const ver = await appPublishTask.run().catch(err => {
                console.error('appPublishTask.run() failed:', err);
                throw err;
            });

            console.log('Publish_detect_no_incr output:', ver);
            expect(ver).toEqual('1.2.3');

        } catch (error) {
            console.error('Test failed with error:', error);
            throw error;
        }
    });
    
    test('Publish_template', async() => {
        // Mock getBuildId()
        const mockedGetBuildId = jest.fn(() => 'abc_3');
        appPublishTask.__set__('getBuildId', mockedGetBuildId);

        await appPublishTask.init(new Pipeline({
            url:"cicdazureappauthor.service-now.com",
            scope: "x_sofse_cicdazurea",
            versionFormat: "template",
            versionTemplate: "1.2"
        }), new Transport(transportOptions.shift()));

        const ver = await appPublishTask.run();
        expect(ver).toEqual('1.2.3');
    });
    
    test('Install', async() => {
        await appInstallTask.init(new Pipeline({
            url:"cicdazureappclient.service-now.com",
            scope: "x_sofse_cicdazurea",
        }), new Transport(transportOptions.shift()));
        
        await appInstallTask.run();
    });

    test('Rollback', async() => {
        await appRollbackTask.init(new Pipeline({
            url:"cicdazureappclient.service-now.com",
            scope: "x_sofse_cicdazurea",
        }), new Transport(transportOptions.shift()));
        
        await appRollbackTask.run();
    });
});
