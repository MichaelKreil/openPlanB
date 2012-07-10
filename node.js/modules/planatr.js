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
	header.listLength3 = f.readInteger(4);
	
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
	
	planUtils.exportHeader(outputFile, header);
	planUtils.exportTSV(outputFile, '1', list1);
	planUtils.exportTSV(outputFile, '2', list2);
	planUtils.exportTSV(outputFile, '3', list3);
}

exports.decodePlan = decodePlanATR;