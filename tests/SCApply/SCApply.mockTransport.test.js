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
    test('Valid apply changes call', done => {
        task.init(new Pipeline({
            "app_scope": "somescope"
        }), new Transport(transportOptions1));
        return task.run().then(() => done()).catch(err => done(err));
    });

    test('Try to use unexisting scope', () => {
        task.init(new Pipeline({
            "app_scope": "somescope"
        }), new Transport(transportOptions2));
        return expect(task.run()).rejects.toBe('Invalid app scope');
    });
})