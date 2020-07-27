
try {
    const task = require('./task'), pipeline = require('./AzureDevopsPipeline');
    task.init(pipeline);
    task.run().catch(()=>process.exit(1));
} catch (e) {
    console.error('The error is:', e);
    process.exit(1);
}