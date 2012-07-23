var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
	var f = new planUtils.PlanFile(filename);
	
	
	
	// Read file header
	
	var header = {unknown:[]};
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	f.checkBytes('20 20 20 20 20');
	f.checkBytes('20 20 20 20 20');
	f.checkBytes('20 20 20 20 20');
	
	header.unknown.push(f.readHexDump(6));
	
	header.listLength1 = f.readInteger(4);
	header.listLength2 = f.readInteger(4);
	
	header.unknown.push(f.readHexDump(4));
	header.unknown.push(f.readString(17));
	header.unknown.push(f.readString(30));
	header.unknown.push(f.readHexDump(6));
	
	header.description = f.readString(header.size - f.pos);
	
	
	
	// Importing the first list
	// Please note that every list entry is a object and that the key names of these objects
	// are used to generate the TSV column heading automagically.  
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = {
			b1_id:    i,
			unknown1: f.readInteger(2),
			unknown2: f.readInteger(2),
			unknown3: f.readInteger(2),
			IBNR:     f.readInteger(4),
			b2_ref:   f.readInteger(4)
		};
	}
	planUtils.exportTSV(outputFile, '1', list1);
	
	
	
	// Importing the second list
	
	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = {
			b2_id:  i,
			b1_ref: f.readInteger(4),
			offset: f.readInteger(4)
		};
	}
	
	// list2.offset points to null-terminated strings 
	var pos0 = f.pos;
	for (var i = 0; i < header.listLength2; i++) {
		f.pos = pos0 + list2[i].offset; 
		list2[i].text = f.readNullString();
	}
	planUtils.exportTSV(outputFile, '2', list2);
	
	
	
	// Exporting the file header data
	
	header.bytesLeft = f.check(outputFile);
	planUtils.exportHeader(outputFile, header);
	
	
	
	// Generate JSON
	
	var data = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		data[i] = {
			b1_id: list1[i].b1_id,
			unknown1: list1[i].unknown1,
			unknown2: list1[i].unknown2,
			unknown3: list1[i].unknown3,
			IBNR:     list1[i].IBNR,
			name:     list2[list1[i].b2_ref].text,
			synonyms: []
		}
	}
	
	for (var i = 0; i < header.listLength2; i++) {
		if (list1[list2[i].b1_ref].b2_ref != i) {
			data[list2[i].b1_ref].synonyms.push(list2[i].text);
		}
	}
	
	planUtils.exportJSON(outputFile, 'data', data);
}
