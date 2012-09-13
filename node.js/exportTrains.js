var fs = require('fs');
var path = require('path');
var assert = require('assert');
var planUtils = require('./plan_modules/plan_utils.js');

var config = fs.readFileSync('config.json', 'utf8');

config = JSON.parse(config);

config.planFolder   = path.resolve(config.planFolder);
config.decodeFolder = path.resolve(config.decodeFolder);

var inputFolder = config.decodeFolder;
var recursive = config.recursive;
var folderFilter = config.folderFilter;
	
var folders = [];

scan(inputFolder);
	
	
scheduleByTrain();


function scan(fol) {
	var stats = fs.statSync(fol)
	if (stats.isFile()) {
		var folder = fol.split('/');
		var filename = folder.pop();
		folder = folder.join('/');
		var filetype = filename.toLowerCase();
		var extension = filetype.split('.').pop();
		
		if (extension == 'json') {
			if (folders[folder] === undefined) folders[folder] = {folder:folder, files:{}};
			folders[folder].files[filetype] = fol;
		}
	} else if (recursive && stats.isDirectory()) {
		var f = fs.readdirSync(fol);
		for (var i = 0; i < f.length; i++) scan(fol + '/' + f[i]);
	}
}

function hashify(arr, key) {
	key = key || 'id';
	var obj = {};
	for (var i = 0; i < arr.length; ++i) {
		obj[arr[i][key]] = arr[i];
	}
	return obj;
}

function scheduleByTrain() {
	for (var f in folders) if (folders.hasOwnProperty(f)) {
		if (config.folderFilter && f.indexOf(config.folderFilter) == -1)
			continue;
		
		var folder = folders[f];
		var schedule = [];
		if (
			(folder.files['planb_data.json']) &&
			(folder.files['planbz_data.json']) &&
			(folder.files['planlauf_data.json']) &&
			(folder.files['planzug_data.json']) &&
			(folder.files['plangat_data1.json']) &&
			(folder.files['planline_data.json']) &&
			(folder.files['planatr_data1.json']) &&
			(folder.files['planatr_data2.json']) &&
			(folder.files['planatr_data3.json']) &&
			(folder.files['planatr_data5.json']) &&
			(folder.files['planbetr_list1.json']) &&
			(folder.files['planbetr_list2.json']) &&
			(folder.files['planbetr_list3.json']) &&
			(folder.files['planw_data.json']) &&
			(folder.files['plangls_data.json']) &&
			(folder.files['planatxd_data2.json']) &&
			(folder.files['plangrz_data.json'])
		)
		{
			var trainsHeader = JSON.parse(fs.readFileSync(folder.files['planzug_header.json'], 'utf8'));
			var trains = JSON.parse(fs.readFileSync(folder.files['planzug_data.json'], 'utf8'));
			var stations = hashify(JSON.parse(fs.readFileSync(folder.files['planb_data.json'], 'utf8')), 'b1_id');
			var trainRoutes = hashify(JSON.parse(fs.readFileSync(folder.files['planlauf_data.json'], 'utf8')));
			var trainTypes = hashify(JSON.parse(fs.readFileSync(folder.files['plangat_data1.json'], 'utf8')), 'gatId');
			var specialLines = hashify(JSON.parse(fs.readFileSync(folder.files['planline_data.json'], 'utf8')), 'lineId');
			var trainAttributesTrainNumbers = hashify(JSON.parse(fs.readFileSync(folder.files['planatr_data1.json'], 'utf8')));
			var trainAttributesProperties = hashify(JSON.parse(fs.readFileSync(folder.files['planatr_data2.json'], 'utf8')));
			var trainAttributesDaysValid = hashify(JSON.parse(fs.readFileSync(folder.files['planatr_data3.json'], 'utf8')));
			var trainAttributesBorderCrossings = hashify(JSON.parse(fs.readFileSync(folder.files['planatr_data5.json'], 'utf8')));
			var trainOperatorsList1 = hashify(JSON.parse(fs.readFileSync(folder.files['planbetr_list1.json'], 'utf8')), 'betr1Id');
			var trainOperatorsList2 = hashify(JSON.parse(fs.readFileSync(folder.files['planbetr_list2.json'], 'utf8')), 'betr2Id');
			var trainOperatorsList3 = hashify(JSON.parse(fs.readFileSync(folder.files['planbetr_list3.json'], 'utf8')), 'zugId');
			var daysValidBitsets = hashify(JSON.parse(fs.readFileSync(folder.files['planw_data.json'], 'utf8')));
			var borderStations = hashify(JSON.parse(fs.readFileSync(folder.files['plangrz_data.json'], 'utf8')));
			var propertyDescription = hashify(JSON.parse(fs.readFileSync(folder.files['planatxd_data2.json'], 'utf8')), 'abbreviation');
			
			var schedule = JSON.parse(fs.readFileSync(folder.files['planbz_data.json'], 'utf8'));
			var stationSchedules = {};
			for (var i in schedule) {
				stationSchedules[ schedule[i].station_id ] = stationSchedules[ station_id ] || [];
				stationSchedules[ schedule[i].station_id ].push({
					trainId: schedule[i].train_id,
					arr: schedule[i].arr,
					dep: schedule[i].dep
				});
			}
			// free memory
			schedule = [];

			var platformsRaw = JSON.parse(fs.readFileSync(folder.files['plangls_data.json'], 'utf8'));
			var platforms = {};
			for (var i in platformsRaw) {
				var p = platformsRaw[i];
				platforms[p.trainId] = platforms[p.trainId] || [];
				platforms[p.trainId][p.frequencyId] = platforms[p.trainId][p.frequencyId] || [];
				for (var j in p.platformAtStops) {
					platforms[p.trainId][p.frequencyId][p.platformAtStops[j].stopNumber] = p.platformAtStops[j].platform;
				}
			}
			// free memory
			platformsRaw = [];

			
			var validityBegin = new Date(trainsHeader.validityBegin);
			
			for (var t = 0; t < trains.length; ++t) {
				if (t % 1000 == 0)
					console.log(t);
				
				var train = trains[t];
				var route = trainRoutes[ train.laufId ];
				
				var output = '';

				var trainType = '';
				var trainNumber = '';
				
				// take number value and flags,
				// return proper train number or line name for display
				var getTrainNumber = function(number, flags) {
					var tempNumber = number;
					if (flags & 1) {
						tempNumber += 0x10000;
					}
					
					// TODO: is this constant writen in some planfile?
					if (tempNumber >= 100000) {
						return specialLines[tempNumber - 0x10000].lineName;
					}
					return tempNumber;
				};

				var getTrainType = function(trainType) {
					var trainTypeName = trainTypes[trainType].nameLong.trim();
					// TODO: need to decide when to look for operator name
					if (trainTypeName == 'DPN') {
						var operator = trainOperatorsList3[ train.id ];
						if (operator.unknown == 0) {
							var operatorLink = trainOperatorsList2[ operator.betr2Id ];
							if (operatorLink && operatorLink.betr1Id != 0) {
								trainTypeName = trainOperatorsList1[ operatorLink.betr1Id ].nameShort.trim();
							}
						}
					}
					return trainTypeName;
				};

				var getRouteSegment = function(attributes) {
					if (attributes.firstStop != attributes.lastStop)
						return stations[ route.stops[ attributes.firstStop ] ].name + ' -> ' + stations[ route.stops[ attributes.lastStop ] ].name;
					return stations[ route.stops[ attributes.lastStop ] ].name;
				};

				if (train.trainType == 0 && train.trainNumberFlags == 0) {
					assert.ok( train.atr1Flags > 1 );
					for (var i = 0; i < train.atr1Flags; ++i) {
						var attributes = trainAttributesTrainNumbers[train.trainNumber + i];
						output += getTrainType(attributes.trainType);
						output += ' ' + getTrainNumber(attributes.trainNumber, attributes.trainNumberFlags);
						output += ' (' + getRouteSegment(attributes) + ')\n';
					}
				} else {
					output += getTrainType(train.trainType);
					output += ' ' + getTrainNumber(train.trainNumber, train.trainNumberFlags);
					output += '\n' + stations[ route.stops[ 0 ] ].name + ' -> ' + stations[ route.stops[ route.stops.length - 1 ] ].name + '\n';
				}
				output += '\n';
				
				for (var s = 0; s < route.stops.length; ++s) {
					var station = stations[ route.stops[s] ];
					var timeDep = -1;
					var timeArr = -1;

					for (var j in stationSchedules[station.b1_id]) {
						if (stationSchedules[station.b1_id][j].trainId == t) {
							if (s == 0) {
								if (stationSchedules[station.b1_id][j].arr == -1) {
									timeDep = stationSchedules[station.b1_id][j].dep;
									break;
								}
							} else if (s == route.stops.length - 1) {
								if (stationSchedules[station.b1_id][j].dep == -1) {
									timeArr = stationSchedules[station.b1_id][j].arr;
									break;
								}
							} else {
								timeDep = stationSchedules[station.b1_id][j].dep;
								timeArr = stationSchedules[station.b1_id][j].arr;
								break;
							}
						}
					}

					output += _clamp('                                                           ' + station.name, 40) + '  ';
					if (timeArr != -1) {
						output += prettyTime(timeArr);
					} else {
						output += '     ';
					}
					output += ' ';
					if (timeDep != -1) {
						output += prettyTime(timeDep);
					} else {
						output += '     ';
					}
					if (platforms[train.id] && platforms[train.id][0] && platforms[train.id][0][s]) {
						output += '  ';
						output += platforms[train.id][0][s];
					}
					output += '\n';
				}
				output += '\n';
				
				var getProperty = function(code) {
					return code + ' ' + propertyDescription[code].text;
				}

				if (train.atr2Flags == 0xff) {
					output += getProperty(String.fromCharCode(train.atr2Id >> 8) + String.fromCharCode(train.atr2Id & 0xff));
				} else {
					var props = [];
					for (var i = 0; i < train.atr2Flags; ++i) {
						var prop = trainAttributesProperties[ train.atr2Id + i ];
						var propString = getProperty(prop.property);
						if (prop.firstStop != 0 || prop.lastStop != route.stops.length - 1) {
							propString += ' (' + getRouteSegment(prop) + ')';
						}
						if (prop.wId) {
							// TODO: handle validity period
						}
						props.push(propString);
					}
					output += props.join('\n');
				}
				output += '\n\n';
				
				if (train.wFlags > 1) {
					var w = [];
					for (var i = 0; i < train.wFlags; ++i) {
						var atr = trainAttributesDaysValid[ train.wId + i ];
						var wString = '';
						if (atr.wId)
							wString = prettyW(validityBegin, daysValidBitsets[ atr.wId ].days);
						else
							wString = 'jeden Tag';
						wString += ' (' + getRouteSegment( atr ) + ')';
						w.push(wString);
					}
					output += w.join('\n');
				} else if (train.wId != 0) {
					output += prettyW(validityBegin, daysValidBitsets[ train.wId ].days);
				} else {
					output += 'jeden Tag';
				}
				output += '\n\n';
				
				if (train.borderFlags) {
					output += 'Grenzuebergaenge: ';
					var getBorderName = function(offset) {
						return borderStations[ trainAttributesBorderCrossings[train.atr5Id + offset].borderId ].name
					};
					if (train.borderFlags == 1)
						output += getBorderName(0);
					else if (train.borderFlags == 2)
						output += getBorderName(0) + ',' + getBorderName(1);
					else {
						var numberOfCrossings = trainAttributesBorderCrossings[train.atr5Id].borderId;
						var crossings = [];
						for (var i = 1; i <= numberOfCrossings; ++i) {
							crossings.push(getBorderName(i));
						}
						output += crossings.join(',');
					}
					output += '\n';
				}
			
				/*
				TODO: output frequency information
				if (train.frequency.iterations != 0) {
					output.push("freq " + train.frequency.iterations + "@" + train.frequency.interval + "m");
				}
				*/
				var trainFilename = folder.folder + '/trains/' + train.id + '.txt';
				fs.writeFileSync(trainFilename, output, 'binary');
			}
		}
	}
}

function ensureFolderFor(filename) {
	var dirname = path.dirname(filename);
	if (!fs.existsSync(dirname)) {
		ensureFolderFor(dirname);
		fs.mkdirSync(dirname);
	}
}

function prettyTime(mins) {
	if (mins == -1)
		return -1;
	
	// TODO: understand and handle this bit:
	//   for the moment we just ignore it
	mins &= ~0x800;
	
	var mm = mins % 60;
	var hh = (mins - mm) / 60;
	return _clamp('00' + hh, 2) + ":" + _clamp('00' + mm, 2);
}

function prettyW(validityBegin, bitset) {
	if (bitset == 'all')
		return ['immer'];
	
	var patterns = {
		'Mo-Fr': '0lllll0',
		'Mo-Sa': '0llllll',
		'Sa,So': 'l00000l',
		'Fr,Sa': '00000ll',
		'Fr,So': 'l0000l0',
		'Sa':    '000000l',
		'So':    'l000000',
		'all':   'lllllll',
		'none':  '0000000'
	};
	
	var iDate = validityBegin;
	var i = validityBegin.getDay();
	if (i > 0) {
		iDate = new Date(validityBegin.getTime() + ((7-validityBegin.getDay()) * 86400000));
	}
	
	var dateDescription = [];
	
	var lastPattern = 0;
	
	while (i < bitset.length) {
		var week = bitset.substr(i, 7);
		
		var thisPattern = [0, 0];
		
		var differences = {};
		for (var p in patterns) {
			var pattern = patterns[p];
			differences[p] = [];
			
			for (var j = 0; j < 7; ++j) {
				if (week[j] != pattern[j]) {
					differences[p].push(new Date(validityBegin.getTime() + (i + j) * 86400000));
				}
			}
			if (differences[p].length == 0) {
				thisPattern = [p, 0];
				break;
			}
		}
		
		if (!thisPattern[0]) {
			for (var p in patterns) {
				if (differences[p].length == 1) {
					thisPattern = [p, differences[p][0]];
				}
			}
		}
		
		if (thisPattern[0]) {
			if (thisPattern != lastPattern) {
				if (thisPattern[0] == lastPattern[0]) {
					if (thisPattern[1])
						dateDescription.push(thisPattern[1].toDateString());
				} else {
					if (thisPattern[1])
						dateDescription.push([thisPattern[0], 'not', thisPattern[1].toDateString()]);
					else
						dateDescription.push([thisPattern[0], 'from', (new Date(validityBegin.getTime() + i * 86400000)).toDateString()]);
				}
				lastPattern = thisPattern;
			}
		} else {
			for (var j = 0; j < 7; ++j) {
				if (pattern[j]) {
					var d = new Date(validityBegin.getTime() + (i + j) * 86400000);
					dateDescription.push([d.toDateString()]);
				}
			}
			lastPattern = [0,0];
		}
		
		i += 7;
	}
	
	return dateDescription;
}

function _clamp(text, l) {
	return text.substr(text.length-l);
}
