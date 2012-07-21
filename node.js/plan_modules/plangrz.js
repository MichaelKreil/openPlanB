var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	
	
	// Reading header informations
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	header.listLength1 = f.readInteger(2);
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);



	// List 1 stores the starting position of Bytes in List 2

	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [
			i,
			f.readInteger(4)
		];
	}
	planUtils.exportTSV(outputFile, '1', list1, 'grz1_id,offset');
	
	
	
	// Read the rest of the file in to list 2
	
	var n = f.length - f.pos
	var id = -1;
	
	var list2 = [];
	for (var i = 0; i < list1.length; i++) {
		list2[i] = [
			i,
			f.readNullString(),
			f.readNullString()
		];
	}
	planUtils.exportTSV(outputFile, '2', list2, 'grz2_id,unknown1,unknown2');
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
	
	var json = [];
	for (var i = 0; i < list2.length; i++) {
		json.push({
			id: list2[i][0],
			IBNR: list2[i][1],
			name: list2[i][2]
		});
	}
	planUtils.exportJSON(outputFile, 'data', json);
}
