var planUtils = require('./plan_utils.js');


exports.decodePlan = function (filename, outputFile) {
	var f = new planUtils.PlanFile(filename);
	
	// Header einlesen
	
	var header = {unknown:[]};
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	
	header.listLength2 = f.readInteger(2);
	header.listLength1 = f.readInteger(2);
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	
	header.listLength3 = f.readInteger(2);
	
	header.unknown.push(f.readInteger(4));

	header.validityBegin = f.readInteger(2);
	header.validityEnd = f.readInteger(2);
	
	header.description = f.readString(header.size - f.pos);
	
	var list1 = [];
	// List 1, purpose unknown
	// seems to contain triplets of two-character abbreviations
	// in reversed order
	// TODO: probably we must not ignore this list
	//   because it may be some kind of hash map
	for (var i = 0; i < header.listLength1; ++i) {
		list1[i] = [
			i,
			f.readString(2),
			f.readString(2),
			f.readString(2)
		];
	}
	planUtils.exportTSV(outputFile, '1', list1, 'atx1Id,unknown1,unknown2,unknown3');
	
	
	
	var list2 = [];
	// List 2, contains map for abbrevation to offset of 
	// explaination in file list 3
	for (var i = 0; i < header.listLength2; ++i) {
		list2[i] = [i];
		// abbreviation of attribute
		// e.g. BR for Bordrestaurant
		list2[i].push( f.readString(2, true) );
		
		// UNKNOWN
		list2[i].push( f.readInteger(2) );
		// UNKNOWN
		list2[i].push( f.readInteger(2) );
		// UNKNOWN
		list2[i].push( f.readInteger(2) );
		
		// offset of attribute explaination
		// in file, relative to start of list3
		list2[i].push( f.readInteger(4) );
	}
	
	var list2Helper = {};
	var pos = f.pos;
	for (var i = 0; i < header.listLength2; ++i) {
		// attribute explaination (e.g. 'Bordrestaurant')
		list2Helper[f.pos - pos] = f.readNullString();
	}
	
	for (var i = 0; i < header.listLength2; ++i) {
		if (!list2Helper[list2[i][5]]) {
			console.warn('could not find text for offset', list2[i][5]);
			continue;
		}
		list2[i][5] = list2Helper[list2[i][5]];
	}
	planUtils.exportTSV(outputFile, '2', list2, 'atx2Id,unknown1,unknown2,unknown3,unknown4,unknown5');
	
	
	
	var list3 = [];
	// the following is almost a copy of List 2 format
	
	// List 3, contains map for abbrevation to offset of 
	// explaination in file list 5
	for (var i = 0; i < header.listLength3; ++i) {
		list3[i] = [i];
		// abbreviation of attribute
		// e.g. BR for Bordrestaurant
		list3[i].push( f.readString(2, true) );
		
		// UNKNOWN
		list3[i].push( f.readInteger(2) );
		// UNKNOWN
		list3[i].push( f.readInteger(2) );
		
		// offset of attribute explaination
		// in file, relative to start of list3
		list3[i].push( f.readInteger(4) );
	}
	
	var list3Helper = {};
	pos = f.pos;
	for (var i = 0; i < header.listLength3; ++i) {
		// attribute explaination (e.g. 'Bordrestaurant')
		list3Helper[f.pos - pos] = f.readNullString();
	}
	
	for (var i = 0; i < header.listLength3; ++i) {
		if (!list3Helper[list3[i][4]]) {
			console.warn('could not find text for offset', list3[i][4]);
			continue;
		}
		list3[i][4] = list3Helper[list3[i][4]];
	}
	planUtils.exportTSV(outputFile, '3', list3,'atx3Id,unknown1,unknown2,unknown3,unknown4');
	
	
	
	header.bytesLeft = f.check(outputFile);
	
	// Alles exportieren
	
	planUtils.exportHeader(outputFile, header);
}
