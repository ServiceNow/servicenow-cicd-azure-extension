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
    test('Activate a plugin', async() => {
        await installTask.init(new Pipeline({
            "pluginID": "com.servicenow_now_calendar"
        }), new Transport(transportOptions.shift()));
        
        await installTask.run();
    });

    test('Activate already active plugin', async() => {
        await installTask.init(new Pipeline({
            "pluginID": "com.servicenow_now_calendar"
        }), new Transport(transportOptions.shift()));
        
        await expect(installTask.run()).resolves.toBe('[WARNING] The plugin is already active, repair plugin to upgrade or fix.');
    });

    test('Try to use unexisting plugin ID', async() => {
        await installTask.init(new Pipeline({
            "pluginID": "unexistingplugin"
        }), new Transport(transportOptions.shift()));
        
        await expect(installTask.run()).rejects.toBe('Not found. The requested item was not found.');
    });

    test('Rollback a plugin', async() => {
        await rollbackTask.init(new Pipeline({
            "pluginID": "com.servicenow_now_calendar"
        }), new Transport(transportOptions.shift()));
        
        await rollbackTask.run();
    });

    test('Rollback already inactive plugin', async() => {
        await rollbackTask.init(new Pipeline({
            "pluginID": "com.servicenow_now_calendar"
        }), new Transport(transportOptions.shift()));
        
        await expect(rollbackTask.run()).rejects.toBe('Plugin is not Active on the instance, unable to rollback');
    });

    test('Try to use unexisting plugin ID', async() => {
        await rollbackTask.init(new Pipeline({
            "pluginID": "unexistingplugin"
        }), new Transport(transportOptions.shift()));
        
        await expect(rollbackTask.run()).rejects.toBe('Not found. The requested item was not found.');
    });


})