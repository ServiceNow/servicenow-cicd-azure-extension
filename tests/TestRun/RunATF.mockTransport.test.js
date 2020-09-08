const Pipeline = require('../pipeline');
const Transport = require('../transport');

Pipeline.defaults({
    auth:"login:password",
    url: "somedomain.service-now.com"
});
const transportOptions1 = require('./mocktransport1.transport.json');
const transportOptions2 = require('./mocktransport2.transport.json');
const transportOptions3 = require('./mocktransport3.transport.json');

const task = require('../../src/lib/TestRun');


describe('Run testsuite using real endpoint', () => {
    test('Run testsuite', done => {
        task.init(new Pipeline({
            "test_suite_sys_id": "0a383a65532023008cd9ddeeff7b1258"
        }), new Transport(transportOptions1));
        return task.run().then(() => done()).catch(err => done(err));
    });

    test('Run testsuite that will fail', () => {
        task.init(new Pipeline({
            "test_suite_sys_id": "73159102db125010022240ceaa961937"
        }), new Transport(transportOptions2));
        return expect(task.run()).rejects.toBe('Testsuite failed');
    });

    test('Try to use unexisting testsuite', () => {
        task.init(new Pipeline({
            "test_suite_sys_id": "nonexistingssyid"
        }), new Transport(transportOptions3));
        return expect(task.run()).rejects.toBe('Not found. The requested item was not found.');
    });
})