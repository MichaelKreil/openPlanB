"use strict";

var fs = require('fs');
var path = require('path');

var planATR  = require('./planatr.js');
var planATX  = require('./planatx.js');
var planB    = require('./planb.js');
var planBETR = require('./planbetr.js');
var planBI   = require('./planbi.js');
var planBZ   = require('./planbz.js');
var planCON  = require('./plancon.js');
var planGAT  = require('./plangat.js');
var planGLS  = require('./plangls.js');
var planGRZ  = require('./plangrz.js');
var planITXT = require('./planitxt.js');
var planKANT = require('./plankant.js');
var planKGEO = require('./plankgeo.js');
var planLAUF = require('./planlauf.js');
var planLINE = require('./planline.js');
var planMETA = require('./planmeta.js');
var planNG   = require('./planng.js');
var planSPR  = require('./planspr.js');
var planU    = require('./planu.js');
var planUK   = require('./planuk.js');
var planVW   = require('./planvw.js');
var planW    = require('./planw.js');
var planZUG  = require('./planzug.js');
var planModules = {};

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
	
	switch (file.filetype) {
		case 'planatr':  planATR.decodePlan(  file.fullname, outputFile); break;
		case 'planatx':  planATX.decodePlan(  file.fullname, outputFile); break;
		case 'planatxd': planATX.decodePlan(  file.fullname, outputFile); break;
		case 'planatxe': planATX.decodePlan(  file.fullname, outputFile); break;
		case 'planatxf': planATX.decodePlan(  file.fullname, outputFile); break;
		case 'planatxi': planATX.decodePlan(  file.fullname, outputFile); break;
		case 'planb':    planB.decodePlan(    file.fullname, outputFile); break;
		case 'planbetr': planBETR.decodePlan( file.fullname, outputFile); break;
		case 'planbi':   planBI.decodePlan(   file.fullname, outputFile); break;
		case 'planbz':   planBZ.decodePlan(   file.fullname, outputFile); break;
		case 'plancon':  planCON.decodePlan(  file.fullname, outputFile); break;
		case 'plangat':  planGAT.decodePlan(  file.fullname, outputFile); break;
		case 'plangls':  planGLS.decodePlan(  file.fullname, outputFile); break;
		case 'plangrz':  planGRZ.decodePlan(  file.fullname, outputFile); break;
		case 'planitxt': planITXT.decodePlan( file.fullname, outputFile); break;
		case 'plankant': planKANT.decodePlan( file.fullname, outputFile); break;
		case 'plankgeo': planKGEO.decodePlan( file.fullname, outputFile); break;
		case 'planlauf': planLAUF.decodePlan( file.fullname, outputFile); break;
		case 'planline': planLINE.decodePlan( file.fullname, outputFile); break;
		case 'planmeta': planMETA.decodePlan( file.fullname, outputFile); break;
		case 'planspr':  planSPR.decodePlan(  file.fullname, outputFile); break;
		case 'planng':   planNG.decodePlan(   file.fullname, outputFile); break;
		case 'planu':    planU.decodePlan(    file.fullname, outputFile); break;
		case 'planuk':   planUK.decodePlan(   file.fullname, outputFile); break;
		case 'planvw':   planVW.decodePlan(   file.fullname, outputFile); break;
		case 'planw':    planW.decodePlan(    file.fullname, outputFile); break;
		case 'planzug':  planZUG.decodePlan(  file.fullname, outputFile); break;
		default:
			console.log('# unknown;' + file.filetype + ';' + stats.size);
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