"use strict";

function decodePlanBZsublist(list) {
	var listOfTrains = [];
	
	var lastTrainId = 0;
	var trainId = -1;
	
	while (list.length > 0) {
		var byte = list.shift();
		//console.log("read byte", byte);
		
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
			if (trainId == -1)
				trainId = lastTrainId + 1;
			
			listOfTrains.push([trainId, prettyTime(arrTime), prettyTime(depTime)]);
			lastTrainId = trainId;
		} else {
			if (byte & 0x40) {
				trainId = byte & 0x3f;
			}
		}
	}
	
	return listOfTrains;
}


exports.decodePlanBZsublist = decodePlanBZsublist;

function prettyTime(mins) {
	return mins;
}



/*
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
*/

