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
			(folder.files['planbetr_data1.json']) &&
			(folder.files['planbetr_data2.json']) &&
			(folder.files['planbetr_data3.json'])
		)
		{
			var trains = JSON.parse(fs.readFileSync(folder.files['planzug_data.json'], 'utf8'));
			var stations = hashify(JSON.parse(fs.readFileSync(folder.files['planb_data.json'], 'utf8')));
			var stationSchedules = hashify(JSON.parse(fs.readFileSync(folder.files['planbz_data.json'], 'utf8')));
			var trainRoutes = hashify(JSON.parse(fs.readFileSync(folder.files['planlauf_data.json'], 'utf8')));
			var trainTypes = hashify(JSON.parse(fs.readFileSync(folder.files['plangat_data1.json'], 'utf8')));
			var specialLines = hashify(JSON.parse(fs.readFileSync(folder.files['planline_data.json'], 'utf8')));
			var trainAttributesTrainNumbers = hashify(JSON.parse(fs.readFileSync(folder.files['planatr_data1.json'], 'utf8')));
			var trainOperatorsList1 = hashify(JSON.parse(fs.readFileSync(folder.files['planbetr_data1.json'], 'utf8')));
			var trainOperatorsList2 = hashify(JSON.parse(fs.readFileSync(folder.files['planbetr_data2.json'], 'utf8')));
			var trainOperatorsList3 = hashify(JSON.parse(fs.readFileSync(folder.files['planbetr_data3.json'], 'utf8')));
			
			for (var t = 0; t < trains.length; ++t) {
				var train = trains[t];
				var route = trainRoutes[ train.laufId ];
				var stationBegin = stations[ route.stops[0] ];
				var stationEnd = stations[ route.stops[route.stops.length - 1] ];
				
				var timeDep = -1;
				var timeArr = -1;
				
				if (!stationSchedules[stationBegin.id]) {
					console.warn('WARNING: empty start station', stationBegin.name);
					continue;
				}
				if (!stationSchedules[stationEnd.id]) {
					console.warn('WARNING: empty end station', stationEnd.name);
					continue;
				}
				
				for (var j in stationSchedules[stationBegin.id].times) {
					if (stationSchedules[stationBegin.id].times[j].trainId == t && stationSchedules[stationBegin.id].times[j].arr == -1) {
						timeDep = stationSchedules[stationBegin.id].times[j].dep;
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
				if (train.trainNumberInterpretation == 1) {
					trainType = trainAttributesTrainNumbers[train.trainNumber].trainType;
					trainNumber = trainAttributesTrainNumbers[train.trainNumber].trainNumber;
					trainNumber += '(->' + stations[ route.stops[ trainAttributesTrainNumbers[train.trainNumber].lastStop ] ].name + ')';
				} else if (train.trainNumberInterpretation == 2) {
					trainType = train.trainType;
					trainNumber = specialLines[train.trainNumber].lineString;
				} else {
					trainType = train.trainType;
					trainNumber = train.trainNumber;
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

				schedule.push([t, trainTypeName + ' ' + trainNumber, stationBegin.name, prettyTime(timeDep), stationEnd.name, prettyTime(timeArr)].join('\t'));
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
	
	var mm = mins % 60;
	var hh = (mins - mm) / 60;
	return _clamp('00' + hh, 2) + ":" + _clamp('00' + mm, 2);
}

function _clamp(text, l) {
	return text.substr(text.length-l);
}
