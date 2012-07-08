"use strict";

var fs = require('fs');
var path = require('path');
var planBZ = require('./planbz.js');
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
		case 'planatr':  decodePlanATR(  file.fullname, outputFile); break;
		case 'planb':    decodePlanB(    file.fullname, outputFile); break;
		case 'planbetr': decodePlanBETR( file.fullname, outputFile); break;
		case 'planbi':   decodePlanBI(   file.fullname, outputFile); break;
		case 'planbz':   decodePlanBZ(   file.fullname, outputFile); break;
		case 'plancon':  decodePlanCON(  file.fullname, outputFile); break;
		case 'plangat':  decodePlanGAT(  file.fullname, outputFile); break;
		case 'plangls':  decodePlanGLS(  file.fullname, outputFile); break;
		case 'planitxt': decodePlanITXT( file.fullname, outputFile); break;
		case 'plankant': decodePlanKANT( file.fullname, outputFile); break;
		case 'plankgeo': decodePlanKGEO( file.fullname, outputFile); break;
		case 'planlauf': decodePlanLAUF( file.fullname, outputFile); break;
		case 'planline': decodePlanLINE( file.fullname, outputFile); break;
		case 'planmeta': decodePlanMETA( file.fullname, outputFile); break;
		case 'planng':   decodePlanNG(   file.fullname, outputFile); break;
		case 'planu':    decodePlanU(    file.fullname, outputFile); break;
		case 'planuk':   decodePlanUK(   file.fullname, outputFile); break;
		case 'planvw':   decodePlanVW(   file.fullname, outputFile); break;
		case 'planw':    decodePlanW(    file.fullname, outputFile); break;
		case 'planzug':  decodePlanZUG(  file.fullname, outputFile); break;
		default:
			console.log('# unknown;' + file.filetype + ';' + stats.size);
	}
}

exports.decodeFiles = decodeFiles;
exports.getAllPlanFiles = getAllPlanFiles;

function decodePlanATR(filename, outputFile) {
	var f = new PlanFile(filename);
	
	
	
	// Header einlesen
	
	var header = {unknown:[]};
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	
	header.listLength1 = f.readInteger(4);
	header.listLength2 = f.readInteger(4);
	header.listLength2 = f.readInteger(4);
	
	var headerThingySize;
	var list2BlockSize;
	switch (header.size) {
	 	case 128:
	 	// Hab nicht rausbekommen, warum manchmal dieser Integer 2/4 Bytes lang ist
	 		headerThingySize = 4;
	 		list2BlockSize = 8;
	 	break;
	 	default:
	 		headerThingySize = 2;
	 		list2BlockSize = 6;
	}
	
	header.unknown.push(f.readHexDump(headerThingySize));
	
	header.unknown.push(f.readHexDump(4));
	header.unknown.push(f.readHexDump(4));
	header.unknown.push(f.readHexDump(4));
	header.unknown.push(f.readHexDump(4));

	header.description = f.readString(header.size - f.pos);

	// Hier ist noch irgendwas broken!
	var
		list1 = [],
		list2 = [],
		list3 = [];
	
	for (var i = 0; i < header.listLength1; i++) list1[i] = [f.readInteger(2), f.readBinDump(1), f.readBinDump(1), f.readBinDump(2)];
	/*
	if (list2BlockSize == 8) {
		for (var i = 0; i < header.listLength2; i++) list2[i] = [f.readStringp(2), f.readHexDump(6)];
	} else {
		for (var i = 0; i < header.listLength2; i++) list2[i] = [f.readBinDump(4), f.readInteger(2)];
	}

	for (var i = 0; i < header.listLength2; i++) list3[i] = [f.readInteger(4), f.readHexDump(2)];
	*/
	header.bytesLeft = f.check(outputFile);
	
	// Alles exportieren
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', list1);
	exportTSV(outputFile, '2', list2);
	exportTSV(outputFile, '3', list3);
}

function decodePlanB(filename, outputFile) {
	var f = new PlanFile(filename);
	
	
	
	// Header einlesen
	
	var header = {unknown:[]};
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	f.checkBytes('20 20 20 20 20');
	f.checkBytes('20 20 20 20 20');
	f.checkBytes('20 20 20 20 20');
	
	header.unknown.push(f.readHexDump(6));
	
	header.listLength1 = f.readInteger(4);
	header.listLength2 = f.readInteger(4);
	
	header.unknown.push(f.readHexDump(4));
	header.unknown.push(f.readString(17));
	header.unknown.push(f.readString(30));
	header.unknown.push(f.readHexDump(6));
	
	header.description = f.readString(header.size - f.pos);
	
	
	
	// Daten einlesen
	
	var
		list1 = [],
		list2 = [],
		list3 = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [];
		list1[i][0] = f.readInteger(2);
		list1[i][1] = f.readInteger(2);
		list1[i][2] = f.readInteger(2);
		list1[i][3] = f.readInteger(4);
		list1[i][4] = f.readInteger(4);
	}
	
	var lastIndex = -1;
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [];
		list2[i][0] = f.readInteger(4);
		list2[i][1] = f.readInteger(4);
	}
	
	var pos0 = f.pos;
	for (var i = 0; i < header.listLength2; i++) {
		list3[f.pos-pos0] = f.readNullString();
	}
	
	for (var i = 0; i < header.listLength2; i++) {
		list2[i][2] = list3[list2[i][1]];
	}
	
	header.bytesLeft = f.check(outputFile);
	
	
	
	// Datenstruktur erzeugen
	
	var
		data = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		data[i] = {
			id: i,
			unknown1: list1[i][0],
			unknown2: list1[i][1],
			unknown3: list1[i][2],
			IBNR: list1[i][3],
			name: list2[list1[i][4]][2],
			synonyms: []
		}
		list1[i][5] = list2[list1[i][4]][2];
	}
	for (var i = 0; i < header.listLength2; i++) {
		if (list1[list2[i][0]][4] != i) {
			data[list2[i][0]].synonyms.push(list2[i][2]);
		}
	}
	
	
	
	// Alles exportieren
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', list1);
	exportTSV(outputFile, '2', list2);
	exportJSON(outputFile, 'data', data);
}

function decodePlanBETR(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength3 = f.readInteger(4);
	header.listLength4 = f.readInteger(4);
	header.listLength1 = f.readInteger(2);
	header.unknown.push(f.readInteger(4));
	header.listLength2 = f.readInteger(2);
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(4));
	
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	
	var data1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		data1[i][0] = f.readNullString();
		data1[i][1] = f.readNullString();
		data1[i][2] = f.readNullString();
	}
	
	var data2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		data2[i] = [];
		data2[i][0] = f.readNullString();
	}
	for (var i = 0; i < header.listLength2; i++) {
		data2[i][1] = f.readInteger(2);
	}
	
	var data3 = [];
	for (var i = 0; i < header.listLength3; i++) {
		data3[i] = [];
		data3[i][0] = f.readInteger(2);
	}
	
	var data4 = [];
	for (var i = 0; i < header.listLength4; i++) {
		data4[i] = [];
		data4[i][0] = f.readInteger(4);
		data4[i][1] = f.readInteger(2);
		data4[i][2] = f.readBinDump(4);
	}
	
	header.bytesLeft = f.check(outputFile);
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', data1);
	exportTSV(outputFile, '2', data2);
	exportTSV(outputFile, '3', data3);
	exportTSV(outputFile, '4', data4);
}

function decodePlanBI(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	header.listLength1 = f.readInteger(4);
	header.listLength2 = f.readInteger(4);
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(4));
	
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [
			i,
			f.readInteger(4),
			f.readInteger(4)
		];
	}
	exportTSV(outputFile, '1', list1);
	
	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [
			i,
			f.readBinDump(4)
		];
	}
	exportTSV(outputFile, '2', list2);
	
	header.bytesLeft = f.check(outputFile);
	
	exportHeader(outputFile, header);
}

function decodePlanBZ(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.subEntryCount = f.readInteger(4);
	header.unknown.push(f.readInteger(1));	
	header.unknown.push(f.readInteger(1));	
	header.unknown.push(f.readInteger(2));	
	header.unknown.push(f.readInteger(2));	
	header.listLength1 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	var
		list1 = [],
		list2 = [];
	
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [i, f.readInteger(-4), f.readInteger(2)];
	}
	// add dummy entry
	list1.push([-1,f.length])
	
	for (var i = 0; i < list1.length - 1; ++i) {
		list2[i] = [];
		
		if (list1[i][1] < 0) continue;

		var nextValidI = i+1;
		while (list1[nextValidI][1] < 0 && nextValidI < list1.length) {
			++nextValidI;
		}

		if (nextValidI == list1.length) {
			throw "could not find next offset";
		}

		var timeList = [];
		var xorKey = i;
		for (var j = 0; j < list1[nextValidI][1] - list1[i][1]; ++j) {
			xorKey = (xorKey * 0xC95 + 1) & 0xffff;
			timeList.push( f.readInteger(1) ^ (xorKey & 0xff) );
		}
		
		list2[i] = planBZ.decodePlanBZsublist(timeList);
	}
	
	// remove dummy entry
	list1.pop();
	
	header.bytesLeft = f.check(outputFile);
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', list1);
	exportTSV(outputFile, '2', list2);
	
	var data = [];
	
	for (var i = 0; i < list1.length - 1; ++i) {
		var timeList = list2[i];
		for (var j = 0; j < timeList.length; j++) {
			var tupel = timeList[j];
			timeList[j] = {trainId: tupel[0], arr: tupel[1], dep:tupel[1]};
		}
		data[i] = { id:i, times:timeList };
	}
	//data = [data[651]];
	exportJSON(outputFile, 'data', data);
}

// Noch nicht fertig
function decodePlanCON(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(4));
	header.listLength1 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	var
		data1 = [],
		data2 = [];
	
	
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		data1[i][0] = f.readInteger(4);
		data1[i][1] = f.readHexDump(1);
		data1[i][2] = f.readHexDump(1);
		data1[i][3] = f.readInteger(4);
	}
	
	/*
	var i = 0;
	var v;
	do {
		data2[i] = []; 
		data2[i][0] = (v = f.readInteger(-4));
		data2[i][1] = f.readInteger(-4);
		console.log(v);
		i++;
	} while (v >= 0);
	*/
	header.bytesLeft = f.check(outputFile);
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', data1);
	exportTSV(outputFile, '2', data2);
}

function decodePlanGLS(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	var integerByteCount = null;
	switch (header.version) {
		case '4.0':	integerByteCount = 2; break;
		case '4.1':	integerByteCount = 4; break;
		default:
			console.error('ERROR: unknown Version "' + header.version + '"');
	}
	
	header.unknown.push(f.readInteger(2));
	header.listLength1 = f.readInteger(4);
	header.maxOffset = f.readInteger(4);
	header.listLength3 = f.readInteger(integerByteCount);
	header.listLength4 = f.readInteger(2);
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	var
		data1 = [],
		data2 = [],
		data3 = [],
		data4 = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		// Zug-ID
		data1[i][0] = f.readInteger(4);
		data1[i][1] = f.readInteger(2);
		data1[i][2] = f.readInteger(4);
	}
	
	for (var i = 0; i < header.listLength1; i++) {
		data2[i] = [];
		var n = f.readInteger(integerByteCount);
		for (var j = 0; j < n; j++) {
			// referenziert Nummer des Haltepunkt auf Lauf des Zuges
			data2[i].push(f.readInteger(1));
			// Flags?
			data2[i].push(f.readHexDump(1));
			// Position in Liste 3
			data2[i].push(f.readInteger(integerByteCount));
		}
	}
	
	for (var i = 0; i < header.listLength3; i++) {
		data3[i] = [];
		// Position in Liste 4
		data3[i].push(f.readInteger(2));
		data3[i].push(f.readInteger(integerByteCount));
	}
	
	for (var i = 0; i < header.listLength4; i++) {
		data4[i] = f.readString(8);
	}
			
	
	header.bytesLeft = f.check(outputFile);
	
	// Datenstruktur erzeugen
	var
		data = [];
	
	if (data1.length != data2.length)
		throw "expected lists of same size";
		
	for (var i = 0; i < data1.length; i++) {
		data[i] = {
			id: i,
			zugId: data1[i][0],
			platformAtStops: []
		}
		for (var j = 0; j < data2[i].length / 3; ++j) {
			var stopData = {
				stopNumber: data2[i][3 * j],
				platform: data4[ data3[ data2[i][3 * j + 2] ] [0] ].trim()
			};
			data[i].platformAtStops.push(stopData);
		}
	}
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', data1);
	exportTSV(outputFile, '2', data2);
	exportTSV(outputFile, '3', data3);
	exportTSV(outputFile, '4', data4);
	exportJSON(outputFile, 'data', data);
}

function decodePlanGAT(filename, outputFile) {
	var header = {unknown:[]};

	var f = new PlanFile(filename);

	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();

	header.listLength1 = f.readInteger(2);
	header.unknown.push(f.readInteger(4));
	header.listLength2 = f.readInteger(2);
	header.listLength3 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));

	f.checkBytes('00 00 00 00');

	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(2));

	header.description = f.readString(header.size - f.pos);

	var
		data1 = [],
		data2 = [],
		data3 = [];

	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		data1[i][0] = f.readString(4);
		data1[i][1] = f.readInteger(2);
		data1[i][2] = f.readString(8);
		for (var j = 0; j < 10; ++j) {
			data1[i][3 + j] = f.readInteger(2);
		}
	}

	for (var i = 0; i < header.listLength2; i++) {
		data2[i] = [];
		data2[i][0] = f.readHexDump(614);
	}

	for (var i = 0; i < header.listLength3; i++) {
		data3[i] = [];
		data3[i][0] = f.readNullString();
	}

	header.bytesLeft = f.check(outputFile);

	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', data1);
	exportTSV(outputFile, '2', data2);
	exportTSV(outputFile, '3', data3);
}

function decodePlanITXT(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(4);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.listLength2 = f.readInteger(4);
	header.listLength1 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	var
		data1 = [],
		data2 = [];
		
	for (var i = 0; i < header.listLength1+1; i++) {
		data1[i] = [];
		data1[i][0] = f.readInteger(-4);
		data1[i][1] = f.readInteger(-2);
		data1[i][2] = f.readInteger(4);
	}
	
	for (var i = 0; i < header.listLength2; i++) {
		data2[i] = [];
		data2[i][0] = f.readHexDump(4);
		data2[i][1] = f.readHexDump(1);
		data2[i][2] = f.readHexDump(1);
		data2[i][3] = f.readHexDump(2);
		data2[i][4] = f.readHexDump(2);
	}
	
	
	header.bytesLeft = f.check(outputFile);
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', data1);
	exportTSV(outputFile, '2', data2);
}

function decodePlanKANT(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength2 = f.readInteger(4);
	
	header.unknown.push(f.readInteger(4));
	header.listLength1 = f.readInteger(4);
	header.unknown.push(f.readHexDump(4));
	

	header.description = f.readString(header.size - f.pos);
	
	f.checkBytes('00 00 00 00');
	
	var
		list1 = [],
		list2 = [];
	
	for (var i = 0; i < header.listLength1; i++) list1[i] = f.readInteger(4);

	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [
			f.readInteger(4),
			f.readInteger(3),
			f.readHexDump(1),
			f.readInteger(1),
			f.readHexDump(1)
		];
	}

	header.bytesLeft = f.check(outputFile);
	
	// Structure
	
	var data = [];
	var j0 = 0;
	for (var i = 0; i < header.listLength1; i++) {
		data[i] = {
			bahnhofid: i,
			kanten:[]
		}
		for (var j = j0; j < list1[i]; j++) data[i].kanten.push({
			bahnhofid:list2[j][0],
			unknown1:list2[j][1],
			unknown2:list2[j][2],
			dauer:list2[j][3],
			unknown4:list2[j][4]
		});
		j0 = list1[i];
	}
	
	// Export
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', list1);
	exportTSV(outputFile, '2', list2);
	exportJSON(outputFile, 'data', data);
}

function decodePlanKGEO(filename, outputFile) {
	var f = new PlanFile(filename);
	
	// Header
	
	var header = {unknown:[]};
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength1 = f.readInteger(4);
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	
	header.description = f.readString(header.size - f.pos);
	
	// Data
	
	var list1 = [];
	
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [];
		list1[i][0] = f.readInteger(-2);
	}
	
	for (var i = 0; i < header.listLength1; i++)	list1[i][1] = f.readInteger(-2);
	for (var i = 0; i < header.listLength1; i++)	list1[i][2] = f.readInteger(-2);
	for (var i = 0; i < header.listLength1; i++)	list1[i][3] = f.readInteger(-2);
	
	header.bytesLeft = f.check(outputFile);
	
	// Structure
	
	var data = [];
	
	for (var i = 0; i < header.listLength1; i++) {
		data[i] = {
			id: i,
			lon: (list1[i][0] + list1[i][2]/1000) / (40048/360),   // Der HAFAS-Ellipsoid ist eine Kugel mit einem Umfang von 40048km
			lat: (list1[i][1] + list1[i][3]/1000) / (40048/360)
		}
	}
	
	// Export
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', list1);
	exportJSON(outputFile, 'data', data);
}

function decodePlanLAUF(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength1 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	header.offset1 = f.readInteger(4);
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	var
		data1 = [];
	
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		data1[i][0] = f.readInteger(4);
	}
	data1.push([f.length]);
	
	var i = 0;
	while (f.pos < f.length) {
		if (f.pos >= data1[i+1][0]) i++;
		data1[i].push(f.readInteger(4));
	}
	
	data1.pop();

	header.bytesLeft = f.check(outputFile);
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', data1);
	
	// Datenstruktur erzeugen
	// nach dem TSV-Export, damit der Array gespliced werden kann
	
	var
		data = [];
		
	for (var i = 0; i < data1.length; i++) {
		data[i] = {
			id: i,
			unknown1: data1[i][0],
			stops: data1[i].splice(2)
		}
	}
	
	exportJSON(outputFile, 'data', data);
}

function decodePlanLINE(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	
	header.listLength1 = f.readInteger(2);
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	var nameLength = 0;
	switch (header.version) {
		case '4.0': nameLength = 5; break;
		case '4.1': nameLength = 8; break;
		default:
			console.error('ERROR: Unbekannte Version');
	}
	
	var data1 = [];
	
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		data1[i][0] = f.readInteger(2);
		data1[i][1] = f.readInteger(2);
		data1[i][2] = f.readString(nameLength).replace(/\x00/, '');
	}
	
	
	header.bytesLeft = f.check(outputFile);
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', data1);
}

function decodePlanMETA(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);

	header.unknown.push(f.readHexDump(4));
	header.listLength2 = f.readInteger(4);
	header.listLength3 = f.readInteger(4);
	header.listLength1 = f.readInteger(4);
	header.unknown.push(f.readHexDump(8));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [
			f.readInteger(4),
			f.readInteger(4),
			f.readHexDump(8)
		]
	}
	exportTSV(outputFile, '1', list1);
	
	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = f.readInteger(-4)
	}
	exportTSV(outputFile, '2', list2);
	
	var list3 = [];
	for (var i = 0; i < header.listLength3; i++) {
		list3[i] = [
			f.readInteger(2),
			f.readHexDump(1),
			f.readHexDump(1),
		]
	}
	exportTSV(outputFile, '3', list3);
	
	header.bytesLeft = f.check(outputFile);
	
	exportHeader(outputFile, header);
}

function decodePlanNG(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	
	header.unknown.push(f.readHexDump(2));
	header.unknown.push(f.readInteger(4));
	
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(4));
	
	header.listLength1 = f.readInteger(4);
	
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readHexDump(4));

	header.unknown.push(f.readHexDump(256));
	header.unknown.push(f.readHexDump(256));
	
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	
	header.description = f.readHexDump(header.size - f.pos);
	
	var
		data1 = [],
		data2 = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		data1[i][0] = f.readInteger(1);
		data1[i][1] = f.readInteger(1);
		data1[i][2] = f.readInteger(2);
		data1[i][3] = f.readInteger(4);
		data2[i] = [];
	}
	data1.push([0,0,0,f.length]);
	
	var
		i = 0,
		p0 = f.pos;
	
	while (f.pos < f.length) {
		if (f.pos-p0 >= data1[i+1][3]) {
			i++;
			data2[i].push(f.readInteger(4));
		} else {
			data2[i].push(f.readInteger(1));
		}
	}
	
	data1.pop();
	
	header.bytesLeft = f.check(outputFile);
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', data1);
	exportTSV(outputFile, '2', data2);
}

function decodePlanU(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.listLength1 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	header.listLength2 = f.readInteger(4);
	
	f.checkBytes('00 00 00 00');
	f.checkBytes('00 00 00 00');
	f.checkBytes('00 00 00 00');
	f.checkBytes('00 00 00 00');
	
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	
	header.unknown.push(f.readHexDump(4));
	
	f.checkBytes('00 00 00 00');
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	
	header.description = f.readString(header.size - f.pos);
	
	var
		data1 = [],
		data2 = [];
	
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [
			f.readInteger(4), // Bahnhof-Id
			f.readInteger(2),
			f.readInteger(2)
		];
	}
	for (var i = 0; i < header.listLength2; i++) {
		data2[i] = [
			f.readInteger(4), // Bahnhof-Id
			f.readInteger(4),
			f.readInteger(2),
			f.readInteger(4),
			f.readInteger(2),
			f.readInteger(1),
			f.readInteger(1)
		];
	}
	
	f.checkBytes('FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF');
	
	header.bytesLeft = f.check(outputFile);
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', data1);
	exportTSV(outputFile, '2', data2);
}

function decodePlanUK(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength1 = f.readInteger(2);
	header.listLength4 = f.readInteger(4);
	header.listLength2 = f.readInteger(4);
	header.listLength3 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	
	header.unknown.push(f.readHexDump(4));
	header.unknown.push(f.readInteger(4));
	
	header.description = f.readString(header.size - f.pos);
	
	// Schau mal, wie viele Bytes noch kommen und schätze dann mal die Größe von list2-Block3
	// Irgendwie ergibt sich das nicht aus der Versionsnummer m(
	
	switch (f.length-f.pos) {
		case header.listLength1*4 + header.listLength2*6 + header.listLength3*2 + header.listLength4*10:
			header.list2Block3Size = 2;
		break;
		case header.listLength1*4 + header.listLength2*8 + header.listLength3*2 + header.listLength4*10:
			header.list2Block3Size = 4;
		break;
		default:
			console.error('ERROR: Byte-Länge geht irgendwie nicht auf.')
	}
	
	var
		data1 = [],
		data2 = [],
		data3 = [],
		data4 = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [
			f.readInteger(2), // Anzahl der Einträge in Liste 2
			f.readInteger(2)  // Id des ersten Eintrages in Liste 2
		];
	}
	
	for (var i = 0; i < header.listLength2; i++) {
		data2[i] = [
			f.readInteger(2), // Erster  Eintrag in Liste 1
			f.readInteger(2), // Letzter Eintrag in Liste 1
			f.readInteger(header.list2Block3Size) // Id eines Eintrages in Liste 3
		];
	}
	
	for (var i = 0; i < header.listLength3; i++) {
		data3[i] = [
			f.readInteger(-2)
		];
	}
	
	for (var i = 0; i < header.listLength4; i++) {
		data4[i] = [
			f.readInteger(4), // Bahnhof-Id
			f.readInteger(2), // Erster  Eintrag in Liste 1
			f.readInteger(2), // Letzer  Eintrag in Liste 1
			f.readInteger(2)  // irgendwas zwischen 0 und 99
		];
	}

	header.bytesLeft = f.check(outputFile);
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', data1);
	exportTSV(outputFile, '2', data2);
	exportTSV(outputFile, '3', data3);
	exportTSV(outputFile, '4', data4);
}

function decodePlanVW(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength1 = f.readInteger(2);
	header.unknown.push(f.readInteger(2));
	header.listLength2 = f.readInteger(4);
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	var
		data1 = [],
		data2 = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		data1[i][0] = f.readInteger(1);
		data1[i][1] = f.readInteger(1);
		data1[i][2] = f.readInteger(1);
		data1[i][3] = f.readInteger(1);
		data1[i][4] = f.readInteger(1);
		data1[i][5] = f.readInteger(1);
	}
	
	for (var i = 0; i < header.listLength2; i++) {
		data2[i] = [];
		data2[i][0] = f.readInteger(4);
		data2[i][1] = f.readInteger(2);
		data2[i][2] = f.readInteger(1);
		data2[i][3] = f.readInteger(1);
		data2[i][4] = f.readInteger(4);
		data2[i][5] = f.readInteger(2);
	}
	
	header.bytesLeft = f.check(outputFile);
	
	exportHeader(outputFile, header);
	
	exportTSV(outputFile, '1', data1);
	exportTSV(outputFile, '2', data2);
}

function decodePlanW(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	f.checkBytes('20 20 20 20 20');
	f.checkBytes('20 20 20 20 20');
	f.checkBytes('20 20 20 20 20');
	
	switch (header.version) {
		case '4.0':
			header.listLength1 = f.readInteger(2);
			header.listLength2 = f.readInteger(2);
			header.blockSize2 = f.readInteger(2);
			header.unknown.push(f.readHexDump(4));
			header.unknown.push(f.readInteger(2));
			header.blockSize1 = 2;
		break;
		case '4.1':
			header.listLength1 = f.readInteger(4);
			header.listLength2 = f.readInteger(4);
			header.blockSize2 = f.readInteger(2);
			header.unknown.push(f.readHexDump(4));
			header.unknown.push(f.readInteger(4));
			header.blockSize1 = 4;
		break;
		default:
			console.error('ERROR: unknown Version "' + header.version + '"');
	}
	
	header.listLength1++; // Keine Ahnung, warum!
	header.listLength2--;
	
	header.description = f.readString(header.size - f.pos);
	
	var
		data1 = [],
		data2 = [];
	
	for (var i = 0; i < header.listLength1; i++) data1[i] = f.readInteger(header.blockSize1);
	
	for (var i = 0; i < header.listLength2; i++) data2[i] = f.readBinDump(header.blockSize2);

	header.bytesLeft = f.check(outputFile);
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', data1);
	exportTSV(outputFile, '2', data2);
}

function decodePlanZUG(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength1 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	var
		data1 = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		data1[i][0] = f.readBinDump(2);
	}
	header.blockSize = (f.length - f.pos)/(2*header.listLength1);
	
	// strange: block size seems to vary
	if (header.blockSize != 11 && header.blockSize != 12) {
		throw "don't know how to handle blockSize " + header.blockSize;
	}

	for (var i = 0; i < header.listLength1; i++) {
		// guess that blockSizes affects size of first integer might be wrong
		if (header.blockSize == 12)
			data1[i][1] = f.readInteger(4);
		else
			data1[i][1] = f.readInteger(2);
		data1[i][2] = f.readInteger(2);
		data1[i][3] = f.readInteger(2);
		data1[i][4] = f.readInteger(2);
		// Zugnummer oder was aehnliches
		data1[i][5] = f.readInteger(2);
		data1[i][6] = f.readInteger(2);
		data1[i][7] = f.readInteger(2);
		data1[i][8] = f.readInteger(4);
		data1[i][9] = f.readInteger(2);
		data1[i][10] = f.readInteger(2);
	}

	header.bytesLeft = f.check(outputFile);
	
	// Datenstruktur erzeugen
	var
		data = [];
	
	for (var i = 0; i < data1.length; i++) {
		data[i] = {
			id: i,
			laufId: data1[i][8],
			unknown1: data1[i][0],
			unknown2: data1[i][1],
			unknown3: data1[i][2],
			unknown4: data1[i][3],
			unknown5: data1[i][4],
			unknown6: data1[i][5],
			unknown7: data1[i][6],
			unknown8: data1[i][7],
			unknown9: data1[i][9],
			unknown10: data1[i][10]
		}
	}
	
	exportHeader(outputFile, header);
	exportTSV(outputFile, '1', data1);
	exportJSON(outputFile, 'data', data);
}




function PlanFile(filename) {
	var me = this;
	me.buffer = fs.readFileSync(filename);
	me.length = me.buffer.length;
	me.pos = 0;
	
	me.readInteger = function(n) {
		switch (n) {
			case  1: return _readByte();
			case  2: return _readWord();
			case -2: return _readWord(true);
			case  3: return _readWord() + _readByte()*0x10000;
			case  4: return _readLong();
			case -4: return _readLong(true);
			default: console.error('################ ERROR: Vermisse die Anzahl der Bytes');
		}
	}
	
	me.readString = function(n, movePointer) {
		var p = me.pos;
		if (movePointer !== false) me.pos += n;
		return me.buffer.toString('binary', p, p+n);
	}
	
	me.readNullString = function() {
		var s = me.pos;
		var n = s;
		for (var i = s; i < me.buffer.length; i++) {
			if (me.buffer.readUInt8(i) == 0) {
				n = i - s;
				me.pos = i+1;
				break;
			}
		}
		return me.buffer.toString('binary', s, s + n);
	}
	
	me.checkBytes = function(text) {
		text = text.split(' ');
		for (var i = 0; i < text.length; i++) {
			var v1 = parseInt(text[i], 16);
			var v2 = _readByte();
			if (v1 != v2) console.error('################ ERROR: Bytes sind nicht identisch');
		}
	}
	
	me.readTimestamp = function() {
		return (new Date(_readLong()*1000)).toJSON();
	}
	
	function _readLong(signed) {
		var p = me.pos;
		me.pos += 4;
		if (signed) {
			return me.buffer.readInt32LE(p);
		} else {
			return me.buffer.readUInt32LE(p);
		}
	}
	
	function _readWord(signed) {
		var p = me.pos;
		me.pos += 2;
		if (signed) {
			return me.buffer.readInt16LE(p);
		} else {
			return me.buffer.readUInt16LE(p);
		}
	}
	
	function _readByte() {
		var p = me.pos;
		me.pos += 1;
		return me.buffer.readUInt8(p);
	}
	
	function _clamp(text, l) {
		return text.substr(text.length-l);
	}
	
	me.readHexDump = function(n) {
		//n = Math.min(n, me.length - me.pos);
		var s = [];
		for (var i = 0; i < n; i++) {
			var v = _readByte();
			s.push(_clamp('000'+v.toString(16), 2));
		}
		return s.join(' ');
	}
	
	me.getAsHexDump = function(v) {
		//n = Math.min(n, me.length - me.pos);
		return _clamp('000'+v.toString(16), 2);
	}
	
	me.readBinDump = function(n) {
		var p = 0;
		if (n < 1000) {
			var a = new Array(n*8);
			for (var i = 0; i < n; i++) {
				var v = _readByte();
				for (var j = 0; j < 8; j++) {
					a[p] = (v > 127) ? 'l' : '0';
					p++;
					v = (v & 0x7F) << 1;
				}
			}
			return a.join('');
		} else {
			var b = new Buffer(n*8);
			for (var i = 0; i < n; i++) {
				var v = _readByte();
				for (var j = 0; j < 8; j++) {
					b.writeUInt8((v > 127) ? 108 : 48, p);
					p++;
					v = (v & 0x7F) << 1;
				}
			}
			return b.toString('binary');
		}
	}
	
	me.getAsBinDump = function(v) {
		var s = '';
		for (var j = 0; j < 8; j++) {
			s += (v > 127) ? 'l' : '0';
			v = (v & 0x7F) << 1;
		}
		return s;
	}
	
	me.check = function (outputFile) {
		var filename1 = outputFile+'_rest.raw';
		var filename2 = outputFile+'_rest.bin.raw';
		ensureFolderFor(filename1);
		ensureFolderFor(filename2);
		
		if (me.pos < me.length) {
			var n = me.length - me.pos;
			fs.writeFileSync(filename1, me.readString(n, false), 'binary');
			fs.writeFileSync(filename2, me.readBinDump(n), 'binary');
			console.log('WARNING: Still "'+n+'" bytes left!');
			return n;
		} else {
			if (fs.existsSync(filename1)) fs.unlinkSync(filename1);
			if (fs.existsSync(filename2)) fs.unlinkSync(filename2);
		}
	}
	
	return me;
}



function exportHeader(outputFile, data) {
	var filename = outputFile+'_header.json';
	ensureFolderFor(filename);
	fs.writeFileSync(filename, JSON.stringify(data, null, '\t'), 'utf8');
}

function exportTSV(outputFile, listName, data) {
	var a = [];
	if (Object.prototype.toString.call(data[0]) === '[object Array]') {
		for (var i = 0; i < data.length; i++) {
			var r = data[i];
			a.push(r.join('\t'));
		}
	} else {
		a = data;
	}
	var filename = outputFile+'_'+listName+'.tsv';
	ensureFolderFor(filename);
	fs.writeFileSync(filename, a.join('\n'), 'binary');
}

function exportJSON(outputFile, listName, data) {
	// JSON-Object in node.js fliegt manchmal auseinander. Deswegen hier per Hand:
	
	var createJSON = function (obj, indent) {
		var typ = Object.prototype.toString.call(obj);
		switch (typ) {
			case '[object Array]':
				if (obj.length == 0) return '[]';
				var a = [];
				for (var i = 0; i < obj.length; i++)  {
					a[i] = createJSON(obj[i], indent+'\t');
				}
				if (indent === undefined) {
					return '['+a.join(',')+']';
				} else {
					return '[\r\t' + indent + a.join(',\r\t'+indent) + '\r' + indent + ']';
				}
			break;
			case '[object Object]':
				var a = [];
				for (var i in obj) if (obj.hasOwnProperty(i)) {
					a.push('"'+i+'":'+createJSON(obj[i], indent));
				}
				return '{'+a.join(',')+'}';
			break;
			case '[object Number]':
				return ''+obj;
			break;
			case '[object String]':
				return '"'+obj+'"';
			break;
			default:
				console.log('What is "'+typ+'"?');
		} 
	}
	var filename = outputFile+'_'+listName+'.json';
	ensureFolderFor(filename);
	fs.writeFileSync(filename, createJSON(data, ''), 'utf8');
}

function ensureFolderFor(filename) {
	var dirname = path.dirname(filename);
	if (!fs.existsSync(dirname)) {
		ensureFolderFor(dirname);
		fs.mkdirSync(dirname);
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
