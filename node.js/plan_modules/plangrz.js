var planUtils = require('./plan_utils.js');

function decodePlanGRZ(filename, outputFile) {
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
	for (var i = 0; i < header.listLength1; i++) list1[i] = f.readInteger(4);
	//planUtils.exportTSV(outputFile, '1', list1);
	
	
	
	// Read the rest of the file in to list 2
	
	var n = f.length - f.pos
	list1.push(n)
	var id = -1;
	
	var list2 = [];
	for (var i = 0; i < list1.length - 1; i++) {
		list2[i] = [];
		
		list2[i].push(f.readNullString());
		list2[i].push(f.readNullString());
		
		// expected entry size: string length + two zero-bytes at the string ends
		if ( (list2[i][0].length + list2[i][1].length + 2) != (list1[i+1] - list1[i]) ) {
			console.warn('WARNING: unexpected string sizes');
		}
	}
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
	planUtils.exportTSV(outputFile, '2', list2);
	
	var json = [];
	for (var i = 0; i < list2.length; i++) {
		json.push({
			id: i,
			IBNR: list2[i][0],
			name: list2[i][1]
		});
	}
	planUtils.exportJSON(outputFile, 'data', json);
}

exports.decodePlan = decodePlanGRZ;
