var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
	var header = {unknown:[]};
	
	
	// initialize the file reader
	
	var f = new planUtils.PlanFile(filename);
	
	
	// now read some bytes from the header
	// most of the values have unknown functions
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
		
	// 2 dates ... first date value is a DWORD timestamp
	header.date1 = f.readTimestamp();
	// second one is a null terminated string
	header.date2 = f.readNullString();
	
	header.unknown.push(f.readInteger(1));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.versionInfo = f.readNullString();
	
	header.unknown.push(f.readInteger(1));
	header.unknown.push(f.readInteger(2));
	header.listSize1 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(2));
	
	header.listLength1 = header.listSize1/54;
	
	
	// Now comes a block of 'listSize1' bytes.
	// wvery entry seems to be 54 bytes long
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1.push([
			i,
			f.readInteger(4),
			f.readInteger(1),
			f.readHexDump(17),
			f.readInteger(4),
			f.readInteger(4),
			f.readHexDump(12),
			f.readInteger(4),
			f.readHexDump(2),
			f.readInteger(4),
			f.readHexDump(2)
		]);
	}
	
	
	// A list of null terminated strings
	
	for (var i = 0; i < header.listLength1; i++) {
		list1[i].push(f.readNullString());
	}
	
	planUtils.exportTSV(outputFile, '1', list1, 'dmcbhf1_id,???');
	
	
	// A second list of 12 bytes block
	
	header.unknown.push(f.readInteger(2));
	header.listSize2 = f.readInteger(4);
	
	header.listLength2 = header.listSize2/12;
	
	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2.push([
			i,
			f.readInteger(4),
			f.readHexDump(8)
		]);
	}
	planUtils.exportTSV(outputFile, '2', list2, 'dmcbhf2_id,???');


	// the rest of the file consists of some lists

	var list3 = [];
	var i = 0;
	while (f.pos < f.length) {
	
		// every list starts with something like an id
		// and the size of the list in bytes
		
		// the list entries are always 4 byte integers
		// seems to be references to entries in list1
		
		var listId = f.readInteger(2);
		var listSize = f.readInteger(4);
		
		var listLength = listSize/4;
		
		for (var j = 0; j < listLength; j++) {
			list3.push([
				i,
				listId,
				j,
				f.readInteger(4)
			]);
			i++;
		}
	}
	planUtils.exportTSV(outputFile, '3', list3, 'dmcbhf3_id,listId,entryId,dmcbhf1_ref');
	
	
	// check the file!
	// is everything ok? No bytes left?
	header.bytesLeft = f.check(outputFile);
	
	
	// Export header
	planUtils.exportHeader(outputFile, header);
}
