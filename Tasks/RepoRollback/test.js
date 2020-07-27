try {
    console.log('\x1b[34mTest mode!\x1b[0m\n')
    const task = require('./task'), pipeline = require('../../lib/testPipeline');
    task.init(pipeline);
    task.run().catch(()=>process.exit(1));
} catch (e) {
    console.error('The error is:', e);
    process.exit(1);
}