require.config({
	paths: {
		scratchcard: 'http://cdn.viihive.com/assets/js/scratch/scratchcard-standalone.min'
	}
});

require(['scratchcard'], function init(Scratchcard) {
	'use strict';

	// Retrieve the target element
	var element = document.getElementById('scratchcard');

	// Build the painter
	var painter = new Scratchcard.Painter({color: '#aeaeae', thickness : 25});

	painter.reset = function reset(ctx, width, height) {
		ctx.fillStyle = this.options.color;
		ctx.globalCompositeOperation = 'source-over';

		ctx.fillRect(0, 0, width, height);
	};

	// Build the scratchcard
	var scratchcard;
	try {
		scratchcard = new Scratchcard(element, {
			realtime: false,
			painter: painter
		});
	} catch (error) {
		alert(error);
		throw error;
	}

	// Listen for progress events
	scratchcard.on('progress', function onProgress(progress) {
		// console.log('Progress:', progress);
		if ((progress > 0.999) && (progress < 1)) {
			scratchcard.complete();
		}
	});

	// Expose the scratchcard instance for debug/tests
	window.scratchcard = scratchcard;
});
