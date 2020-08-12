try {
	let taskName = process.argv[2] || '';
	if('AppInstall AppPublish AppRollback PluginActivate PluginRollback SCApply TestRun'.split(' ').indexOf(taskName) === -1) {
		throw new Error('Task is not set');
	}
    console.log('\x1b[34mTest mode!\x1b[0m\n')
    const task = require('../Tasks/' + taskName + '/task'), pipeline = require('./testPipeline');
    task.init(pipeline);
    task.run().catch(() => process.exit(1));
} catch (e) {
    console.error('The error is:', e);
    process.exit(1);
}