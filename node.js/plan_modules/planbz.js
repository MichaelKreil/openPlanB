"use strict";
var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
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
	
	
	
	// List 1
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [i, f.readInteger(-4), f.readInteger(2)];
	}
	planUtils.exportTSV(outputFile, '1', list1);
	
	
	
	// List 2
	
	// add dummy entry
	list1.push([-1,f.length]);
	
	var list2 = [];
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
		
		list2[i] = decodePlanBZsublist(timeList);
	}
	// remove dummy entry
	list1.pop();
	
	planUtils.exportTSV(outputFile, '2', list2);
	
	
	
	// Export Header
	header.bytesLeft = f.check(outputFile);
	planUtils.exportHeader(outputFile, header);
	
	

	// Export JSON
	
	var data = [];
	for (var i = 0; i < list1.length; ++i) {
		var timeList = list2[i];
		for (var j = 0; j < timeList.length; j++) {
			var tupel = timeList[j];
			timeList[j] = {trainId: tupel[0], arr: tupel[1], dep:tupel[2]};
		}
		data[i] = { id:i, times:timeList };
	}
	
	planUtils.exportJSON(outputFile, 'data', data);
}

function parseDateWord(dateWord) {
	if (dateWord == 0x07ff)
		// TODO: understand this status code
		return -1;
	
	if (dateWord & 0xf800) {
		// TODO: handle flags, probably for "next day" or timezone stuff
		return dateWord & ~0xf800;
	} else if (dateWord < 1440) {
		return dateWord;
	} else {
		throw "bad dateWord " + dateWord.toString(16);
	}
}

function decodePlanBZsublist(list) {
	var listOfTrains = [];
	
	var lastTrain = [0,0,0];
	var trainId = -1;
	
	while (list.length > 0) {
		var byte = list.shift();
		
		if (byte & 0x80) {
			var dateWord = ((byte & 0x7f) << 8) | list.shift();
			var arrTime = -1;
			var depTime = -1;
			
			if ((byte & 0xf8) == 0xf8) {
				depTime = dateWord & ~0xf800;
			} else {
				arrTime = dateWord & ~0xf000;
				if ((byte & 0xf0) != 0xf0) {
					var diff = dateWord >> 11;
					depTime = arrTime + diff;
				}
			}
			
			// if we have no explicit train id, it is last id plus 1
			if (trainId == -1) {
				trainId = lastTrain[0] + 1;
			}
			
			var trainObj = [trainId, arrTime, depTime];
			listOfTrains.push(trainObj);
			lastTrain = trainObj;
			trainId = -1;
		} else if (trainId == -1) {
			// train id is stored in fields of different length
			if ((byte & 0x60) == 0x60) {
				var trainWord = ((byte & ~0x60) << 8) | list.shift();
				trainId = lastTrain[0] + trainWord;
			} else if (byte & 0x40) {
				trainId = lastTrain[0] + (byte & 0x3f);
			} else if (((byte & 0x20) == 0x20) && ((byte & 0x80) == 0)) {
				trainId = lastTrain[0] + (byte - 0x20);
				
				var trainObj = [trainId, lastTrain[1], lastTrain[2]];
				listOfTrains.push(trainObj);
				lastTrain = trainObj;
				trainId = -1;
			} else {
				var trainDWord = byte;
				for (var i = 0; i < 3; ++i) {
					trainDWord <<= 8;
					trainDWord |= list.shift();
				}
				// dword id is absolute
				trainId = trainDWord;
			}
		} else {
			var arrTime = -1;
			var depTime = -1;
			
			var dateWord = (byte << 8) | list.shift();
			arrTime = parseDateWord(dateWord);
			
			byte = list.shift();
			if ((byte & 0xc0) == 0xc0) {
				// TODO: handle flags (probably related to parseDateWord)
				var diff = byte & ~0xc0;
				depTime = arrTime + diff;
			} else if (byte & 0x80) {
				var diff = byte & ~0xc0;
				depTime = arrTime + diff;
			} else {
				dateWord = (byte << 8) | list.shift();
				depTime = parseDateWord(dateWord);
			}
			
			var trainObj = [trainId, arrTime, depTime];
			listOfTrains.push(trainObj);
			lastTrain = trainObj;
			trainId = -1;
		}
	}
	
	return listOfTrains;
}


//
// helper functions
//

function prettyTime(mins) {
	if (mins == -1)
		return -1;
	
	var mm = mins % 60;
	var hh = (mins - mm) / 60;
	return (''+hh).lpad('0',2) + ":" + (''+mm).lpad('0',2);
}

String.prototype.lpad = function(padString, length) {
	var str = this;
	while (str.length < length)
		str = padString + str;
	return str;
}

