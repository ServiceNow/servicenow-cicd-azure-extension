require('dotenv').config();

const Pipeline = require('./pipeline');
const tasks = {};
'AppInstall AppPublish AppRollback PluginActivate PluginRollback SCApply TestRun'.split(' ').forEach(task => tasks[task] = require(`../src/lib/${task}`));

Pipeline.defaults({
    auth: process.env.AUTH_STRING,
    url: process.env.HOSTNAME
});

describe('Unit test on real serverts', () => {
    describe('Install job', () => {
        test('Valid apply changes call', done => {
            tasks.SCApply.init(new Pipeline({
                "app_scope": process.env.APP_SCOPE,
                "repo_config_url": process.env.REPO_CONFIG_URL,
                "repo_config_credentials_sys_id": process.env.REPO_CONFIG_CREDENTIALS_SYS_ID,
                "repo_config_default_branch_name": "master",
                "repo_config_mid_server_sys_id": "undefined",
                "repo_config_email": "blub@blab.com",
                "repo_config_use_default_email_for_all": true,
                "repo_config_test_connection": true
            }));
            tasks.SCApply.run().then(() => done()).catch(err => done(err));
        });
        test('Publish', done => {
            tasks.AppPublish.init(new Pipeline({
                scope: process.env.APP_SCOPE,
                versionFormat: "autodetect"
            }));
            tasks.AppPublish.run().then(() => done()).catch(err => done(err || ''));
        });

        test('Install', done => {
            tasks.AppInstall.init(new Pipeline({
                scope: process.env.APP_SCOPE,
            }));
            tasks.AppInstall.run().then(() => done()).catch(err => done(err || ''));
        });
        test('Activate a plugin', done => {
            tasks.PluginActivate.init(new Pipeline({
                "pluginID": "com.servicenow_now_calendar"
            }));
            tasks.PluginActivate.run().then(() => done()).catch(err => done(err));
        });
    });
    describe('Testsuites job', () => {
        test('Run testsuite', done => {
            tasks.TestRun.init(new Pipeline({
                "test_suite_sys_id": "0a383a65532023008cd9ddeeff7b1258"
            }));
            tasks.TestRun.run().then(() => done()).catch(err => done(err));
        });

        test('Run testsuite that will fail', () => {
            tasks.TestRun.init(new Pipeline({
                "test_suite_sys_id": "73159102db125010022240ceaa961937"
            }));
            return expect(tasks.TestRun.run()).rejects.toBe('Testsuite failed');
        });
    });
    describe('Rollback job', () => {
        test('Rollback a plugin', done => {
            tasks.PluginRollback.init(new Pipeline({
                "pluginID": "com.servicenow_now_calendar"
            }));
            tasks.PluginRollback.run().then(() => done()).catch(err => done(err));
        });
        test('Rollback', done => {
            tasks.AppRollback.init(new Pipeline({
                scope: process.env.APP_SCOPE,
            }));
            tasks.AppRollback.run().then(() => done()).catch(err => done(err || ''));
        });
    });


});
