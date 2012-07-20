var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength1 = f.readInteger(4);
	// number of routes in LAUF list1
	header.numberOfRoutes = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	// number of stations in B list1
	header.numberOfStations = f.readInteger(4);
	
	header.validityBegin = f.readInteger(2);
	header.validityEnd = f.readInteger(2);
	
	header.description = f.readString(header.size - f.pos);
	
	var
		list1 = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [i];
		// operation frequency b
		// b & 0x7f               number of iterations
		// (b & 0xff80) >> 7      interval in minutes between each operation
		list1[i].push(f.readInteger(1));
		list1[i].push(f.readInteger(1));
	}
	header.blockSize = (f.length - f.pos)/(2*header.listLength1);
	
	// strange: block size seems to vary
	if (header.blockSize != 11 && header.blockSize != 12) {
		throw "don't know how to handle blockSize " + header.blockSize;
	}

	for (var i = 0; i < header.listLength1; i++) {
		// days of operation for this train
		// offset in W, list 1, or zero (train operates every day)
		// TODO: don't know when which interpretation of value holds
		if (header.blockSize == 12)
			list1[i].push(f.readInteger(4));
		else
			list1[i].push(f.readInteger(2));
		
		// UNKNOWN
		// probably a reference to an offset in UK list 1
		list1[i].push(f.readInteger(2));
		// UNKNOWN
		// TODO: ?
		// list1[i][4] & 256   -> look up field 9 in ATR list 4, else it is a RICH id
		// list1[i][4] & 512   -> look up field 9 in ATR list 4, else it is a RICH id
		// list1[i][4] & 2048  -> look up field 10 in ATR list 5, else there is no border crossing
		list1[i].push(f.readInteger(2));
		
		//     train number 
		// OR  offset in ATR, list 1
		// OR  id in LINE
		//
		list1[i].push(f.readInteger(2));
		
		// TODO: the following is still experimental
		//
		// bitset b
		//  if b & 0x100, then add 2^32 to train number
		//  if b == 0, then interpretation 'offset' above
		//  (b & 0xfe) >> 1   is reference to entry in GAT list 1
		list1[i].push(f.readInteger(2));

		// attributes of this train (offset to ATR, list 2)
		list1[i].push(f.readInteger(2));
		
		// UNKNOWN
		list1[i].push(f.readInteger(2));
		
		// route of this train (references a LAUF id)
		list1[i].push(f.readInteger(4));
		
		// a direction (references a RICH id, or ATR list 4, or zero)
		// TODO: don't know when which interpretation of value holds
		list1[i].push(f.readInteger(2));
		
		// border crossing of this train (offset to ATR, list 5, or zero)
		// TODO: don't know when which interpretation of value holds
		list1[i].push(f.readInteger(2));
	}
	planUtils.exportTSV(outputFile, '1', list1, 'zugId,iterations,interval,wId?,unknown1,unknown2,unknown3,unknown4,unknown5,unknown6,unknown7,unknown8,unknown9');
	
	
	
	header.bytesLeft = f.check(outputFile);
	planUtils.exportHeader(outputFile, header);
	
	
	/*
	// TODO: Check this code since all indexes have shifted  
	var
		data = [];
	
	for (var i = 0; i < list1.length; i++) {
		var trainType = list1[i][6] >> 9;
		var trainNumber = list1[i][5];
		
		data.push({
			zugId: i,
			laufId: list1[i][9],
			wId: list1[i][2],
			lineId: trainNumber,
			trainNumberFlags: (list1[i][6] & 0x1ff),
			trainType: trainType,
			atr2Id: list1[i][7],
			atr5Id: list1[i][11],
			frequency: {
				iterations: (list1[i][1] & 0x7f),
				interval: ((list1[i][1] & 0xff80) >> 7)
			},
			unknown2: list1[i][3],
			unknown3: list1[i][4],
			unknown4: list1[i][8],
			unknown5: list1[i][10]
		});
	}
	planUtils.exportJSON(outputFile, 'data', data);
	*/
}
