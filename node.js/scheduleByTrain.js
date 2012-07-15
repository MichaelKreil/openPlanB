var fs = require('fs');
var path = require('path');
var planUtils = require('./modules/plan_utils.js');

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

function hashify(arr) {
	var obj = {};
	for (var i = 0; i < arr.length; ++i) {
		obj[arr[i].id] = arr[i];
	}
	return obj;
}

function scheduleByTrain() {
	for (var f in folders) if (folders.hasOwnProperty(f)) {
		if (f.indexOf('DB') == -1)
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
			(folder.files['planatr_data5.json']) &&
			(folder.files['planbetr_data1.json']) &&
			(folder.files['planbetr_data2.json']) &&
			(folder.files['planbetr_data3.json']) &&
			(folder.files['planw_data.json']) &&
			(folder.files['plangrz_data.json'])
		)
		{
			var trainsHeader = JSON.parse(fs.readFileSync(folder.files['planzug_header.json'], 'utf8'));
			var trains = JSON.parse(fs.readFileSync(folder.files['planzug_data.json'], 'utf8'));
			var stations = hashify(JSON.parse(fs.readFileSync(folder.files['planb_data.json'], 'utf8')));
			var stationSchedules = hashify(JSON.parse(fs.readFileSync(folder.files['planbz_data.json'], 'utf8')));
			var trainRoutes = hashify(JSON.parse(fs.readFileSync(folder.files['planlauf_data.json'], 'utf8')));
			var trainTypes = hashify(JSON.parse(fs.readFileSync(folder.files['plangat_data1.json'], 'utf8')));
			var specialLines = hashify(JSON.parse(fs.readFileSync(folder.files['planline_data.json'], 'utf8')));
			var trainAttributesTrainNumbers = hashify(JSON.parse(fs.readFileSync(folder.files['planatr_data1.json'], 'utf8')));
			var trainAttributesBorderCrossings = hashify(JSON.parse(fs.readFileSync(folder.files['planatr_data5.json'], 'utf8')));
			var trainOperatorsList1 = hashify(JSON.parse(fs.readFileSync(folder.files['planbetr_data1.json'], 'utf8')));
			var trainOperatorsList2 = hashify(JSON.parse(fs.readFileSync(folder.files['planbetr_data2.json'], 'utf8')));
			var trainOperatorsList3 = hashify(JSON.parse(fs.readFileSync(folder.files['planbetr_data3.json'], 'utf8')));
			var daysValidBitsets = hashify(JSON.parse(fs.readFileSync(folder.files['planw_data.json'], 'utf8')));
			var borderStations = hashify(JSON.parse(fs.readFileSync(folder.files['plangrz_data.json'], 'utf8')));
			
			var validityBegin = new Date(trainsHeader.validityBegin);
			
			for (var t = 0; t < trains.length; ++t) {
				if (t % 500 == 0)
					console.log(t);
				
				var train = trains[t];
				var route = trainRoutes[ train.laufId ];
				var stationBegin = stations[ route.stops[0] ];
				var stationFirstStop = stations[ route.stops[1] ];
				var stationEnd = stations[ route.stops[route.stops.length - 1] ];
				
				var timeDep = -1;
				var timeArr = -1;
				var timeFirst = -1;
				
				if (!stationSchedules[stationBegin.id]) {
					console.warn('WARNING: empty start station', stationBegin.name, train);
					continue;
				}
				if (!stationSchedules[stationFirstStop.id]) {
					console.warn('WARNING: empty second station', stationFirstStop.name, train);
					continue;
				}
				if (!stationSchedules[stationEnd.id]) {
					console.warn('WARNING: empty end station', stationEnd.name, train);
					continue;
				}
				
				for (var j in stationSchedules[stationBegin.id].times) {
					if (stationSchedules[stationBegin.id].times[j].trainId == t && stationSchedules[stationBegin.id].times[j].arr == -1) {
						timeDep = stationSchedules[stationBegin.id].times[j].dep;
						break;
					}
				}
				
				for (var j in stationSchedules[stationFirstStop.id].times) {
					if (stationSchedules[stationFirstStop.id].times[j].trainId == t) {
						timeFirst = stationSchedules[stationFirstStop.id].times[j].arr;
						break;
					}
				}
				
				for (var j in stationSchedules[stationEnd.id].times) {
					if (stationSchedules[stationEnd.id].times[j].trainId == t && stationSchedules[stationEnd.id].times[j].dep == -1) {
						timeArr = stationSchedules[stationEnd.id].times[j].arr;
						break;
					}
				}
				
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
						return specialLines[tempNumber - 0x10000].lineString;
					}
					return tempNumber;
				};
				
				if (train.trainType == 0 && train.trainNumberFlags == 0) {
					var attributes = trainAttributesTrainNumbers[train.trainNumber];
					trainType = attributes.trainType;
					trainNumber = getTrainNumber(attributes.trainNumber, attributes.trainNumberFlags);
					trainNumber += '(->' + stations[ route.stops[ attributes.lastStop ] ].name + ')';
				} else {
					trainType = train.trainType;
					trainNumber = getTrainNumber(train.trainNumber, train.trainNumberFlags);
				}
				
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

				output = [t, trainTypeName + ' ' + trainNumber, stationBegin.name, prettyTime(timeDep)];
				
				if (stationFirstStop.id != stationEnd.id) {
					output.push(stationFirstStop.name);
					output.push(prettyTime(timeFirst));
				}
				
				output.push(stationEnd.name);
				output.push(prettyTime(timeArr));
				
				if (train.frequency.iterations != 0) {
					output.push("freq " + train.frequency.iterations + "@" + train.frequency.interval + "m");
				}
				
				/*
				var validDay = 0;
				if (train.wId != 0) {
					validDay = findOneValidDay(daysValidBitsets[ train.wId  ].days);
				}
				if (validDay)
					output.push(validDay.toLocaleDateString());
				else
					output.push('every day');
				*/
				if (train.wId != 0) {
					output.push( prettyW(validityBegin, daysValidBitsets[ train.wId ].days) );
				}
				
				
				// TODO: this check is actually slightly wrong; the id may also be 0
				//   but it is unclear how the format distinguishes between crossing and no crossing
				// TODO: support multiple border crossings (cf. multi-attribute problem in ATR list 2)
				if (train.atr5Id) {
					output.push('bX@' + borderStations[ trainAttributesBorderCrossings[train.atr5Id].borderId ].name);
				}
				
				schedule.push(output.join('\t'));
			}
			fs.writeFileSync(folder.folder + '/scheduleByTrain.tsv', schedule.join('\n'), 'binary');
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

function findOneValidDay(bitset) {
	if (bitset == 'all')
		return 0;
	
	// TODO make start day flexible
	var validityBegin = new Date(2011,11,11);
	for (var i = 0; i < bitset.length; ++i) {
		if (bitset[i] == 'l')
			return new Date(validityBegin.getTime() + i * 86400000);
	}
	return 0;
}

function prettyW(validityBegin, bitset) {
	if (bitset == 'all')
		return ['immer'];
	
	var patterns = {
		'Mo-Fr': '0lllll0',
		'Mo-Sa': '0llllll',
		'Sa-So': 'l00000l',
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
