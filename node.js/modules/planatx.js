var planUtils = require('./plan_utils.js');

// TODO: make this generic to parse
//   ATX files in other languages (ATXE, ATXF &c.)
function decodePlanATX(filename, outputFile) {
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
	
	var 
		list1 = [],
		list2 = [],
		list3 = [];
	
	// List 1, purpose unknown
	// seems to contain triplets of two-character abbreviations
	// in reversed order
	// TODO: probably we must not ignore this list
	//   because it may be some kind of hash map
	for (var i = 0; i < header.listLength1; ++i) {
		list1[i] = f.readHexDump(6);
	}
	
	// List 2, contains map for abbrevation to offset of 
	// explaination in file list 3
	for (var i = 0; i < header.listLength2; ++i) {
		list2[i] = [];
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
		if (!list2Helper[list2[i][4]]) {
			console.warn('could not find text for offset', list2[i][4]);
			continue;
		}
		list2[i][4] = list2Helper[list2[i][4]];
	}
	
	// the following is almost a copy of List 2 format
	
	// List 3, contains map for abbrevation to offset of 
	// explaination in file list 5
	for (var i = 0; i < header.listLength3; ++i) {
		list3[i] = [];
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
		if (!list3Helper[list3[i][3]]) {
			console.warn('could not find text for offset', list3[i][3]);
			continue;
		}
		list3[i][3] = list3Helper[list3[i][3]];
	}
	
	header.bytesLeft = f.check(outputFile);
	
	// Alles exportieren
	
	planUtils.exportHeader(outputFile, header);
	planUtils.exportTSV(outputFile, '1', list1);
	planUtils.exportTSV(outputFile, '2', list2);
	planUtils.exportTSV(outputFile, '3', list3);
}

exports.decodePlan = decodePlanATX;