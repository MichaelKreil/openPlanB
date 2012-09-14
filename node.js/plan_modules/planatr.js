var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
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
	var list3BlockSize;
	// Hab nicht rausbekommen, warum manchmal dieser Integer 2/4 Bytes lang ist
	if (header.size == 128) {
		headerThingySize = 4;
		list2BlockSize = 8;
		list3BlockSize = 6;
	} else {
		headerThingySize = 2;
		list2BlockSize = 6;
		list3BlockSize = 4;
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



	var list1 = [];
	// List 1 contains information about train numbers and types
	// in case that they change between start and final destination
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [i];
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
	planUtils.exportTSV(outputFile, '1', list1, 'atr1_id,unknown1,unknown2,unknown3,firstStop,lastStop');



	var list2 = [];
	// List 2 contains information about train amenities
	//  such as on-board restaurant and facilities for people with a disability
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [i];
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
	planUtils.exportTSV(outputFile, '2', list2, 'atr2_id,unknown1,firstStop,lastStop,w1_ref');
	
	
	
	var list3 = [];
	for (var i = 0; i < header.listLength3; i++) {
		list3[i] = [i];
		
		// days of operation
		
		var wId = 0;
		if (list3BlockSize == 4) {
			wId = f.readInteger(2)
		} else if (list3BlockSize == 6) {
			wId = f.readInteger(4);
		} else {
			console.log('ERROR: unknown list3BlockSize:'+list3BlockSize);
		}
		
		// references an entry in W list, or zero (operates every day)
		list3[i].push(wId);
		
		// first stop on route for which this information is valid
		// number 0 corresponds to the first entry of the LAUF route
		list3[i].push(f.readInteger(1));
		// last stop on route for which this information is valid
		list3[i].push(f.readInteger(1));
	}
	planUtils.exportTSV(outputFile, '3', list3, 'atr3_id,w1_ref,firstStop,lastStop');
	
	
	
	var list4 = [];
	for (var i = 0; i < header.listLength4; i++) {
		list4[i] = [i];
		
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
	planUtils.exportTSV(outputFile, '4', list4, 'atr4_id,unknown1,firstStop,lastStop');
	
	
	
	var list5 = [];
	for (var i = 0; i < header.listLength5; i++) {
		list5[i] = [i];
		
		// references a border station, GRZ id
		list5[i].push(f.readInteger(2));
		
		// stop on route before border crossing
		// number 0 corresponds to the first entry of the LAUF route
		list5[i].push(f.readInteger(1));
		// stop on route after border crossing
		list5[i].push(f.readInteger(1));
	}
	planUtils.exportTSV(outputFile, '5', list5, 'atr5_id,unknown1,firstStop,lastStop');
	
	
	
	header.bytesLeft = f.check(outputFile);
	
	// Alles exportieren
	
	planUtils.exportHeader(outputFile, header);
	
	var json1 = [];
	for (var i = 0; i < list1.length; i++) {
		json1.push({
			id: i,
			trainNumber: list1[i][1],
			trainNumberFlags: list1[i][2],
			trainType: list1[i][3] >> 1,
			firstStop: list1[i][4],
			lastStop: list1[i][5]
		});
	}
	planUtils.exportJSON(outputFile, 'data1', json1);
	
	var json2 = [];
	for (var i = 0; i < list2.length; i++) {
		json2.push({
			id: i,
			property: list2[i][1],
			firstStop: list2[i][2],
			lastStop: list2[i][3],
			wId: list2[i][4]
		});
	}
	planUtils.exportJSON(outputFile, 'data2', json2);
	
	var json3 = [];
	for (var i = 0; i < list3.length; i++) {
		json3.push({
			id: i,
			wId: list3[i][1],
			firstStop: list3[i][2],
			lastStop: list3[i][3]
		});
	}
	planUtils.exportJSON(outputFile, 'data3', json3);
	
	var json4 = [];
	for (var i = 0; i < list4.length; i++) {
		json4.push({
			id: i,
			directionId: list4[i][1],
			firstStop: list4[i][2],
			lastStop: list4[i][3]
		});
	}
	planUtils.exportJSON(outputFile, 'data4', json4);
	
	var json5 = [];
	for (var i = 0; i < list5.length; i++) {
		json5.push({
			id: i,
			borderId: list5[i][1],
			stopBefore: list5[i][2],
			stopAfter: list5[i][3]
		});
	}
	planUtils.exportJSON(outputFile, 'data5', json5);
}
