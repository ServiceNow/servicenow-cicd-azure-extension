const Pipeline = require('../pipeline');
const Transport = require('../transport');

Pipeline.defaults({
    auth:"login:password",
    url: "somedomain.service-now.com"
});
const transportOptions1 = require('./mocktransport1.transport.json');
const transportOptions2 = require('./mocktransport2.transport.json');

const task = require('../../src/lib/SCApply');


describe('Apply changes for remote, using the mock server', () => {
    test('Valid apply changes call', async() => {
        await task.init(new Pipeline({
            "app_scope": "somescope"
        }), new Transport(transportOptions1));
        await task.run();
    });

    test('Try to use unexisting scope', async() => {
        await task.init(new Pipeline({
            "app_scope": "somescope"
        }), new Transport(transportOptions2));
        await expect(task.run()).rejects.toBe('Invalid app scope');
    });
})