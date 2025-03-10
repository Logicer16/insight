'use strict';
const got = require('got');
const async = require('async');
const Insight = require('.');

// Messaged on each debounced `track()`
// Gets the queue, merges is with the previous and tries to upload everything
// If it fails, it will save everything again
process.on('message', message => {
	const insight = new Insight(message);
	const {config} = insight;
	const q = config.get('queue') || {};

	Object.assign(q, message.queue);
	config.delete('queue');

	async.forEachSeries(Object.keys(q), (element, cb) => {
		const parts = element.split(' ');
		const id = parts[0];
		const payload = q[element];

		try {
			got(insight._getRequestObj(id, payload));
		} catch (error) {
			cb(error);
			return;
		} finally {
			cb();
		}
	}, error => {
		if (error) {
			const q2 = config.get('queue') || {};
			Object.assign(q2, q);
			config.set('queue', q2);
		}

		process.exit();
	});
});
