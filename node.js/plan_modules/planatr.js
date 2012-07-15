var planUtils = require('./plan_utils.js');

function decodePlanATR(filename, outputFile) {
	var f = new planUtils.PlanFile(filename);
	
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
	
	header.listLength3 = f.readInteger(headerThingySize);
	header.listLength4 = f.readInteger(2);
	header.listLength5 = f.readInteger(2);
	
	// number of trains in ZUG list1
	header.numberOfTrains = f.readInteger(4);
	// number of stations in B list1
	header.numberOfStations = f.readInteger(4);
	
	header.validityBegin = f.readInteger(2);
	header.validityEnd = f.readInteger(2);

	header.description = f.readString(header.size - f.pos);

	var
		list1 = [],
		list2 = [],
		list3 = [],
		list4 = [],
		list5 = [];
	

	// List 1 contains information about train numbers and types
	// in case that they change between start and final destination
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [];
		// train number
		list1[i].push(f.readInteger(2));
		// UNKNOWN, probably some flag
		list1[i].push(f.readInteger(1));
		// train type (RE, IC, ICE, &c.), encoding unknown
		list1[i].push(f.readInteger(1));

		// first stop on route for which this information (number, type) is valid
		// number 0 corresponds to the first entry of the LAUF route
		list1[i].push(f.readInteger(1));
		// last stop on route for which this information (number, type) is valid
		list1[i].push(f.readInteger(1));
	}

	// List 2 contains information about train amnenities
	//  such as on-board restaurant and facilities for people with a disability
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [];
		// train property
		// character order seems to be swapped in original file
		// e.g. NK =~ 'KN' (see text in ATXD)
		//
		// this is probably a reference to ATXD list 1,
		// buf after reversing the order we will hopefully find
		// the attribute in ATXD list 2 or list 3
		var rawString = f.readString(2);
		list2[i].push(rawString[1] + rawString[0]);
		
		// first stop on route for which this information is valid
		// number 0 corresponds to the first entry of the LAUF route
		list2[i].push(f.readInteger(1));
		// last stop on route for which this information is valid
		list2[i].push(f.readInteger(1));
		
		// days when this property is valid
		// encodes a position in W list
		if (list2BlockSize == 8)
			list2[i].push(f.readInteger(4));
		else
			list2[i].push(f.readInteger(2));
	}
	
	for (var i = 0; i < header.listLength3; i++) {
		// UNKNOWN
		list3[i] = [f.readHexDump(6)];
	}
	
	for (var i = 0; i < header.listLength4; i++) {
		list4[i] = [];
		
		// TODO: sometimes first entry seems to indicate number of 
		//   following entries which belong to a group
		//   but this is not always the case
		
		// references a direction, RICH id
		list4[i].push(f.readInteger(2));
		
		// first stop on route for which this information is valid
		// number 0 corresponds to the first entry of the LAUF route
		list4[i].push(f.readInteger(1));
		// last stop on route for which this information is valid
		list4[i].push(f.readInteger(1));
	}
	
	for (var i = 0; i < header.listLength5; i++) {
		list5[i] = [];
		
		// references a border station, GRZ id
		list5[i].push(f.readInteger(2));
		
		// stop on route before border crossing
		// number 0 corresponds to the first entry of the LAUF route
		list5[i].push(f.readInteger(1));
		// stop on route after border crossing
		list5[i].push(f.readInteger(1));
	}
	
	header.bytesLeft = f.check(outputFile);
	
	// Alles exportieren
	
	planUtils.exportHeader(outputFile, header);
	planUtils.exportTSV(outputFile, '1', list1);
	planUtils.exportTSV(outputFile, '2', list2);
	planUtils.exportTSV(outputFile, '3', list3);
	planUtils.exportTSV(outputFile, '4', list4);
	planUtils.exportTSV(outputFile, '5', list5);
	
	var json1 = [];
	for (var i = 0; i < list1.length; i++) {
		json1.push({
			id: i,
			trainNumber: list1[i][0],
			trainType: list1[i][2] >> 1,
			firstStop: list1[i][3],
			lastStop: list1[i][4],
			unknown: list1[i][1]
		});
	}
	planUtils.exportJSON(outputFile, 'data1', json1);
	
	var json4 = [];
	for (var i = 0; i < list4.length; i++) {
		json4.push({
			id: i,
			directionId: list4[i][0],
			firstStop: list4[i][1],
			lastStop: list4[i][2]
		});
	}
	planUtils.exportJSON(outputFile, 'data4', json4);
	
	var json5 = [];
	for (var i = 0; i < list5.length; i++) {
		json5.push({
			id: i,
			borderId: list5[i][0],
			stopBefore: list5[i][1],
			stopAfter: list5[i][2]
		});
	}
	planUtils.exportJSON(outputFile, 'data5', json5);
}

exports.decodePlan = decodePlanATR;