"use strict";

var fs = require('fs');
var path = require('path');

var planModules = {
	planatr : require('./planatr.js'),
	planatx : require('./planatx.js'),
	planatxd: require('./planatx.js'),
	planatxe: require('./planatx.js'),
	planatxf: require('./planatx.js'),
	planatxi: require('./planatx.js'),
	planb   : require('./planb.js'),
	planbetr: require('./planbetr.js'),
	planbi  : require('./planbi.js'),
	planbz  : require('./planbz.js'),
	plancon : require('./plancon.js'),
	plangat : require('./plangat.js'),
	plangls : require('./plangls.js'),
	plangrz : require('./plangrz.js'),
	planitxt: require('./planitxt.js'),
	plankant: require('./plankant.js'),
	plankgeo: require('./plankgeo.js'),
	planlauf: require('./planlauf.js'),
	planline: require('./planline.js'),
	planmeta: require('./planmeta.js'),
	planng  : require('./planng.js'),
	planspr : require('./planspr.js'),
	planu   : require('./planu.js'),
	planuk  : require('./planuk.js'),
	planvw  : require('./planvw.js'),
	planw   : require('./planw.js'),
	planzug : require('./planzug.js')
};

function getAllPlanFiles(config) {
	var inputFolder = config.planFolder;
	var recursive = config.recursive;
	var folderFilter = config.folderFilter;
	var planFilter = config.planFilter;
	
	var files = [];
	
	var scan = function (fol) {
		var stats = fs.statSync(fol)
		if (stats.isFile()) {
			var filename = fol.split('/').pop();
			var filetype = filename.toLowerCase();
			if (filetype.substr(0,4) == 'plan') {
				var use = true;
				if (planFilter && (filetype != planFilter)) use = false;
				if (folderFilter && (fol.indexOf(folderFilter) == -1)) use = false;
				if (use) {
					files.push({
						filename: filename,
						filetype: filetype,
						fullname: fol,
						subfolder: fol.substr(inputFolder.length)
					});
				}
			}
		} else if (recursive && stats.isDirectory()) {
			var f = fs.readdirSync(fol);
			for (var i = 0; i < f.length; i++) scan(fol + '/' + f[i]);
		}
	}
	scan(inputFolder);
	return files;
}

function decodeFiles(files, outputFolder) {
	files.each(function (file) {
		decodeFile(file, outputFolder);
	});
}

function decodeFile(file, outputFolder) {
	var outputFile = path.normalize(outputFolder + file.subfolder);
	
	var stats = fs.statSync(file.fullname);
	console.log(file.fullname + '\t' + stats.size);
	
	var decoder = planModules[file.filetype];
	if (decoder === undefined) {
		console.log('# unknown;' + file.filetype + ';' + stats.size);
	} else {
		decoder.decodePlan(  file.fullname, outputFile);
	}
}

if (!Array.prototype.each) {
	Array.prototype.each = function(fun) {
		var t = Object(this);
		var len = t.length;
		for (var i = 0; i < len; i++) {
			if (i in t) fun(t[i], i);
		}
	};
}

exports.decodeFiles = decodeFiles;
exports.getAllPlanFiles = getAllPlanFiles;