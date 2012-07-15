"use strict";

var fs = require('fs');
var path = require('path');

var gtfsModules = [
	{ name:'stops', module: require('./gtfs_stops.js'), needs: ['planb_data.json', 'plankgeo_data.json'] }
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
			var neededFiles = [];
			for (var j = 0; j < needs.length; j++) {
				if (folder.files[needs[j]] !== undefined) {
					neededFiles[j] = folder.files[needs[j]];
				} else {
					foundNeededFiles = false;
					console.log('      ERROR: Missing JSON "'+needs[j]+'"');
				}
			}
			if (foundNeededFiles) {
				var outputFolder = path.normalize(config.gtfsFolder + folder.name.substr(config.decodeFolder.length));
				gtfsModules[i].module.makeGTFS(neededFiles, outputFolder);	
			}
		}
	}

}

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
}

exports.formatNumber = function (value, precision) {
	return value.toFixed(precision);
}

exports.formatString = function (text) {
	return '"'+text.replace(/\"/g, '""')+'"';
}

exports.formatInteger = function (value, precision) {
	return value.toFixed(0);
}

function ensureFolderFor(filename) {
	var dirname = path.dirname(filename);
	if (!fs.existsSync(dirname)) {
		ensureFolderFor(dirname);
		fs.mkdirSync(dirname);
	}
}

function scanFolder(fol, recursive) {
	var stats = fs.statSync(fol)
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