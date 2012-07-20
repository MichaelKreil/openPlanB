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
		list1 = [],
		bitset = 0;
		
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [i];
		
		bitset = f.readInteger(2);
		// operation frequency:
		// number of iterations
		list1[i].push(bitset & 0x7f);
		// interval in minutes between each iteration
		list1[i].push((bitset & 0xff80) >> 7);
	}
	header.blockSize = (f.length - f.pos)/(2*header.listLength1);
	
	// strange: block size seems to vary
	if (header.blockSize != 11 && header.blockSize != 12) {
		throw "don't know how to handle blockSize " + header.blockSize;
	}

	
	for (var i = 0; i < header.listLength1; i++) {
		// days of operation for this train
		// offset in W list 1, or zero (train operates every day)
		// TODO: don't know when which interpretation of value holds
		if (header.blockSize == 12)
			list1[i].push(f.readInteger(4));
		else
			list1[i].push(f.readInteger(2));
		
		// UNKNOWN
		// probably a reference to an offset in UK list 1
		list1[i].push(f.readInteger(2));
		
		bitset = f.readInteger(2);
		// UNKNOWN
		list1[i].push(bitset & 0x0ff);
		// == 1:  look up field 'richId' in RICH list 1
		// == 2:  look up field 'richId' in ATR list 4
		// == 3:  look up field 'richId' in ATR list 4, direction entry there is 'special'
		list1[i].push((bitset & 0x300) >> 8);
		// UNKNOWN
		list1[i].push((bitset & 0x400) >> 10);
		// look up field 'grzId' in ATR list 5, else there is no border crossing
		list1[i].push((bitset & 0x800) >> 11);
		// UNKNOWN
		list1[i].push((bitset & 0xf000) >> 12);
		
		//     train number 
		// OR  offset in ATR, list 1
		// OR  id in LINE
		//
		list1[i].push(f.readInteger(2));
		
		bitset = f.readInteger(2);
		// type of this train (offset to GAT list 1, or zero)
		list1[i].push(bitset >> 9);
		// flags for interpreting train type and number
		//   if bitset & 0x0001, then add 2^32 to train number
		//   if bitset == 0, then train number above is an 'offset' in ATR list 1
		//
		list1[i].push(bitset & 0x1ff);

		// attributes of this train (offset to ATR list 2)
		list1[i].push(f.readInteger(2));
		
		// UNKNOWN
		list1[i].push(f.readInteger(2));
		
		// route of this train (references a LAUF id)
		list1[i].push(f.readInteger(4));
		
		// FIELD 'richId'
		// a direction (references a RICH id, or ATR list 4, or zero)
		// (cf. bitset above)
		list1[i].push(f.readInteger(2));
		
		// FIELD 'richId'
		// border crossing of this train (offset to ATR, list 5, or zero)
		// (cf. bitset above)
		list1[i].push(f.readInteger(2));
	}
	planUtils.exportTSV(outputFile, '1', list1, 'id,freqIterations,freqInterval,wId,unknown1,unknown2,dirFlags,unknown3,borderFlags,unknown4,trainNumber,trainType,trainNumberFlags,atr2Id,unknown5,laufId,richId,grzId');
	
	
	
	header.bytesLeft = f.check(outputFile);
	planUtils.exportHeader(outputFile, header);
	
	
	var
		data = [];
	
	for (var i = 0; i < list1.length; i++) {
		data.push({
			id: i,
			frequency: {
				iterations: list1[i][1],
				interval: list1[i][2]
			},
			wId: list1[i][3],
			
			unknown1: list1[i][4],
			unknown2: list1[i][5],
			
			directionFlags: list1[i][6],
			
			unknown3: list1[i][7],
			
			borderFlags: list1[i][8],
			
			unknown4: list1[i][9],
			
			trainNumber: list1[i][10],
			trainType: list1[i][11],
			trainNumberFlags: list1[i][12],
			
			atr2Id: list1[i][13],
			
			unknown5: list1[i][14],
			
			laufId: list1[i][15],
			richId: list1[i][16],
			grzId: list1[i][17]
		});
	}
	planUtils.exportJSON(outputFile, 'data', data);
}
