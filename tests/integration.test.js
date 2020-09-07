const Pipeline = require('./pipeline');
const tasks = {};
'AppInstall AppPublish AppRollback PluginActivate PluginRollback SCApply TestRun'.split(' ').forEach(task => tasks[task] = require(`../src/lib/${task}`));

Pipeline.defaults({
    auth: process.env.AUTH_STRING || ''
});

describe('Unit test on real serverts', () => {
    describe('Install job', () => {
        // test('Valid apply changes call', done => {
        //     tasks.SCApply.init(new Pipeline({
        //         url: "cicdazureappauthor.service-now.com",
        //         "app_scope": "x_sofse_cicdazurea"
        //     }));
        //     return tasks.SCApply.run().then(() => done()).catch(err => done(err));
        // });
        test('Publish', done => {
            tasks.AppPublish.init(new Pipeline({
                url: "cicdazureappauthor.service-now.com",
                scope: "x_sofse_cicdazurea",
                versionFormat: "autodetect"
            }));
            return tasks.AppPublish.run().then(() => done()).catch(err => done(err || ''));
        });

        test('Install', done => {
            tasks.AppInstall.init(new Pipeline({
                url: "cicdazureappclient.service-now.com",
                scope: "x_sofse_cicdazurea",
            }));
            return tasks.AppInstall.run().then(() => done()).catch(err => done(err || ''));
        });
        test('Activate a plugin', done => {
            tasks.PluginActivate.init(new Pipeline({
                url: "cicdazureappclient.service-now.com",
                "pluginID": "com.servicenow_now_calendar"
            }));
            return tasks.PluginActivate.run().then(() => done()).catch(err => done(err));
        });
    });
    describe('Testsuites job', () => {
        test('Run testsuite', done => {
            tasks.TestRun.init(new Pipeline({
                url: "cicdazureappclient.service-now.com",
                "test_suite_sys_id": "0a383a65532023008cd9ddeeff7b1258"
            }));
            return tasks.TestRun.run().then(() => done()).catch(err => done(err));
        });

        test('Run testsuite that will fail', () => {
            tasks.TestRun.init(new Pipeline({
                url: "cicdazureappclient.service-now.com",
                "test_suite_sys_id": "73159102db125010022240ceaa961937"
            }));
            return expect(tasks.TestRun.run()).rejects.toBe('Testsuite failed');
        });
    });
    describe('Rollback job', () => {
        test('Rollback a plugin', done => {
            tasks.PluginRollback.init(new Pipeline({
                url: "cicdazureappclient.service-now.com",
                "pluginID": "com.servicenow_now_calendar"
            }));
            return tasks.PluginRollback.run().then(() => done()).catch(err => done(err));
        });
        test('Rollback', done => {
            tasks.AppRollback.init(new Pipeline({
                url: "cicdazureappclient.service-now.com",
                scope: "x_sofse_cicdazurea",
            }));
            return tasks.AppRollback.run().then(() => done()).catch(err => done(err || ''));
        });
    });


});
