const Pipeline = require('./pipeline');
const tasks = {};
'AppInstall AppPublish AppRollback PluginActivate PluginRollback SCApply TestRun'.split(' ').forEach(task => tasks[task] = require(`../src/lib/${task}`));

Pipeline.defaults({
    auth: process.env.AUTH_STRING || ''
});

describe('Unit test on real servers', () => {
    describe('Install job', () => {
        // test('Valid apply changes call', done => {
        //     tasks.SCApply.init(new Pipeline({
        //         url: "cicdazureappauthor.service-now.com",
        //         "app_scope": "x_sofse_cicdazurea"
        //     }));
        //     return tasks.SCApply.run().then(() => done()).catch(err => done(err));
        // });
        test('Publish', async() => {
            await tasks.AppPublish.init(new Pipeline({
                url: "cicdazureappauthor.service-now.com",
                scope: "x_sofse_cicdazurea",
                versionFormat: "autodetect"
            }));
            
            await tasks.AppPublish.run();
        });
        test('Install', async() => {
            await tasks.AppInstall.init(new Pipeline({
                url: "cicdazureappclient.service-now.com",
                scope: "x_sofse_cicdazurea",
            }));
            await tasks.AppInstall.run();
        });
        test('Activate a plugin', async() => {
            await tasks.PluginActivate.init(new Pipeline({
                url: "cicdazureappclient.service-now.com",
                "pluginID": "com.servicenow_now_calendar"
            }));
            await tasks.PluginActivate.run();
        });
    });
    describe('Testsuites job', () => {
        test('Run testsuite', async() => {
            await tasks.TestRun.init(new Pipeline({
                url: "cicdazureappclient.service-now.com",
                "test_suite_sys_id": "0a383a65532023008cd9ddeeff7b1258"
            }));
            await tasks.TestRun.run();
        });

        test('Run testsuite that will fail', async() => {
            await tasks.TestRun.init(new Pipeline({
                url: "cicdazureappclient.service-now.com",
                "test_suite_sys_id": "73159102db125010022240ceaa961937"
            }));
            await expect(tasks.TestRun.run()).rejects.toBe('Testsuite failed');
        });
    });
    describe('Rollback job', () => {
        test('Rollback a plugin', async() => {
            await tasks.PluginRollback.init(new Pipeline({
                url: "cicdazureappclient.service-now.com",
                "pluginID": "com.servicenow_now_calendar"
            }));
            await tasks.PluginRollback.run();
        });
        test('Rollback', async() => {
            await tasks.AppRollback.init(new Pipeline({
                url: "cicdazureappclient.service-now.com",
                scope: "x_sofse_cicdazurea",
            }));
            await tasks.AppRollback.run();
        });
    });


});
