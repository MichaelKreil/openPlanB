"use strict";

var fs = require('fs');
var path = require('path');

var gtfsModules = [
	{ name:'agency', module: require('./gtfs_agency.js'), needs: {betr1:'planbetr_list1.json'} },
	{ name:'transfers', module: require('./gtfs_transfers.js'), needs: {transfers:'plankant_data.json'} },
	{ name:'routes', module: require('./gtfs_routes.js'), needs: {line:'planline_data.json', zug:'planzug_data.json', routes: 'planlauf_data.json', betr2:'planbetr_list2.json', betr3:'planbetr_list3.json', b:'planb_data.json'} },
	{ name:'stops',  module: require('./gtfs_stops.js'),  needs: {b:'planb_data.json', kgeo:'plankgeo_data.json'} },
	{ name:'trips',  module: require('./gtfs_trips.js'), needs: {
											trainsHeader : 'planzug_header.json',
											trains : 'planzug_data.json',
											stations : 'planb_data.json',
											trainRoutes : 'planlauf_data.json',
											trainTypes : 'plangat_data1.json',
											specialLines : 'planline_data.json',
											trainAttributesTrainNumbers : 'planatr_data1.json',
											trainAttributesProperties : 'planatr_data2.json',
											trainAttributesDaysValid : 'planatr_data3.json',
											trainAttributesBorderCrossings : 'planatr_data5.json',
											trainOperatorsList1 : 'planbetr_list1.json',
											trainOperatorsList2 : 'planbetr_list2.json',
											trainOperatorsList3 : 'planbetr_list3.json',
											daysValidBitsets : 'planw_data.json',
											borderStations : 'plangrz_data.json',
											schedule: 'planbz_data.json'
	}}
];

var folders = [];
	
exports.makeGTFS = function (config) {
	
	scanFolder(config.decodeFolder, config.recursive);
	
	for (var f in folders) if (folders.hasOwnProperty(f) && (folders[f].fileCount > 0)) {
		var folder = folders[f];
		console.log('Converting "'+folder.name+'"');
		for (var i = 0; i < gtfsModules.length; i++) {
			console.log('   to "'+gtfsModules[i].name+'"');
			var needs = gtfsModules[i].needs;
			var foundNeededFiles = true;
			var neededFiles = {};
			for (var name in needs) if (needs.hasOwnProperty(name)) {
				if (folder.files[needs[name]] !== undefined) {
					neededFiles[name] = folder.files[needs[name]];
				} else {
					foundNeededFiles = false;
					console.log('      ERROR: Missing JSON "'+needs[name]+'"');
				}
			}
			if (foundNeededFiles) {
				var outputFolder = path.normalize(config.gtfsFolder + folder.name.substr(config.decodeFolder.length));
				for (var name in neededFiles) if (neededFiles.hasOwnProperty(name)) {
					neededFiles[name] = JSON.parse(fs.readFileSync(neededFiles[name], 'utf8'))
				}
				gtfsModules[i].module.makeGTFS(neededFiles, outputFolder);
			}
		}
	}

};

exports.outputGTFSFile = function (list, outputFolder, name) {
	var colCount = list[0].length;
	var a = [list[0].join(',')];
	for (var i = 1; i < list.length; i++) {
		var line = list[i].join(',');
		line = line.replace(/[\t\r\n]+/g,'');
		a.push(line);
	}
	a = a.join('\n');
	
	var filename = outputFolder+'/'+name+'.txt';
	ensureFolderFor(filename);
	fs.writeFileSync(filename, a, 'utf8'); 
};

exports.formatNumber = function (value, precision) {
	return value.toFixed(precision);
};

exports.formatString = function (text) {
	return '"'+text.replace(/,/g, '.').replace(/\"/g, '""')+'"';
};

exports.formatInteger = function (value, precision) {
	return value.toFixed(0);
};

function ensureFolderFor(filename) {
	var dirname = path.dirname(filename);
	if (!fs.existsSync(dirname)) {
		ensureFolderFor(dirname);
		fs.mkdirSync(dirname);
	}
}

function scanFolder(fol, recursive) {
	var stats = fs.statSync(fol);
	if (stats.isFile()) {
		var folder = fol.split('/');
		var filename = folder.pop();
		folder = folder.join('/');
		var filetype = filename.toLowerCase();
		var extension = filetype.split('.').pop();
		
		if (extension == 'json') {
			if (folders[folder] === undefined) {
				folders[folder] = {name:folder, files:{}, fileCount:0 };
			}
			folders[folder].files[filetype] = fol;
			folders[folder].fileCount++;
		}
	} else if (recursive && stats.isDirectory()) {
		var f = fs.readdirSync(fol);
		for (var i = 0; i < f.length; i++) scanFolder(fol + '/' + f[i], recursive);
	}
}