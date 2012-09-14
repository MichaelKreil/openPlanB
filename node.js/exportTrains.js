var fs = require('fs');
var path = require('path');
var assert = require('assert');
var utils = require('./schedule_utils.js');
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
				stationSchedules[ schedule[i].station_id ] = stationSchedules[ schedule[i].station_id ] || [];
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
							if (s === 0) {
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

					output += utils._clamp('                                                           ' + station.name, 40) + '  ';
					if (timeArr != -1) {
						output += utils.prettyTime(timeArr);
					} else {
						output += '     ';
					}
					output += ' ';
					if (timeDep != -1) {
						output += utils.prettyTime(timeDep);
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
				};

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
							wString = utils.prettyW(validityBegin, daysValidBitsets[ atr.wId ].days);
						else
							wString = 'jeden Tag';
						wString += ' (' + getRouteSegment( atr ) + ')';
						w.push(wString);
					}
					output += w.join('\n');
				} else if (train.wId !== 0) {
					output += utils.prettyW(validityBegin, daysValidBitsets[ train.wId ].days);
				} else {
					output += 'jeden Tag';
				}
				output += '\n\n';
				
				if (train.borderFlags) {
					output += 'Grenzuebergaenge: ';
					var getBorderName = function(offset) {
						return borderStations[ trainAttributesBorderCrossings[train.atr5Id + offset].borderId ].name;
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
				fs.writeFile(trainFilename, output, 'binary');
			}
		} else {
			console.error("Necessary files missing");
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
