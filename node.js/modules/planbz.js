"use strict";

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
			} else if ((byte & 0xf0) == 0xf0) {
				arrTime = dateWord & ~0xf000;
			} else {
				var diff = dateWord >> 0x0b;
				arrTime = dateWord & 0x7ff;
				depTime = arrTime + diff;
			}
			
			// if we have no explicit train id, it is last id plus 1
			if (trainId == -1) {
				trainId = lastTrain[0] + 1;
			}
			
			var trainObj = [trainId, prettyTime(arrTime), prettyTime(depTime)];
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
			
			var trainObj = [trainId, prettyTime(arrTime), prettyTime(depTime)];
			listOfTrains.push(trainObj);
			lastTrain = trainObj;
			trainId = -1;
		}
	}
	
	return listOfTrains;
}

exports.decodePlanBZsublist = decodePlanBZsublist;

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


