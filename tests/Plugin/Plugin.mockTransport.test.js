const transportOptions = [];
for( let i =1; i<=6; i++) {
    transportOptions.push(require(`./mocktransport${i}.transport.json`));
}

const Pipeline = require('../pipeline');
const Transport = require('../transport');

Pipeline.defaults({
    auth:"login:password",
    url: "somedomain.service-now.com"
});

const installTask = require('../../src/lib/PluginActivate');
const rollbackTask = require('../../src/lib/PluginRollback');


describe('Activate and rollback plugin using mock transport', () => {
    test('Activate a plugin', done => {
        installTask.init(new Pipeline({
            "pluginID": "com.servicenow_now_calendar"
        }), new Transport(transportOptions.shift()));
        return installTask.run().then(() => done()).catch(err => done(err));
    });

    test('Activate already active plugin', () => {
        installTask.init(new Pipeline({
            "pluginID": "com.servicenow_now_calendar"
        }), new Transport(transportOptions.shift()));
        return expect(installTask.run()).resolves.toBe('[WARNING] The plugin is already active, repair plugin to upgrade or fix.');
    });

    test('Try to use unexisting plugin ID', () => {
        installTask.init(new Pipeline({
            "pluginID": "unexistingplugin"
        }), new Transport(transportOptions.shift()));
        return expect(installTask.run()).rejects.toBe('Not found. The requested item was not found.');
    });

    test('Rollback a plugin', done => {
        rollbackTask.init(new Pipeline({
            "pluginID": "com.servicenow_now_calendar"
        }), new Transport(transportOptions.shift()));
        return rollbackTask.run().then(() => done()).catch(err => done(err));
    });

    test('Rollback already inactive plugin', () => {
        rollbackTask.init(new Pipeline({
            "pluginID": "com.servicenow_now_calendar"
        }), new Transport(transportOptions.shift()));
        return expect(rollbackTask.run()).rejects.toBe('Plugin is not Active on the instance, unable to rollback');
    });

    test('Try to use unexisting plugin ID', () => {
        rollbackTask.init(new Pipeline({
            "pluginID": "unexistingplugin"
        }), new Transport(transportOptions.shift()));
        return expect(rollbackTask.run()).rejects.toBe('Not found. The requested item was not found.');
    });


})