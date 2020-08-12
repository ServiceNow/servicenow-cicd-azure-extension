try {
    const task = require('./task'), pipeline = require('./AzureDevopsPipeline');
    task.init(pipeline);
    task.run().then(res=> pipeline.success(res)).catch(e => pipeline.fail(e));
} catch (e) {
    console.error('The error is:', e);
    process.exit(1);
}