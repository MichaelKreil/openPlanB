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
	list1.push([header.listLength1, n])
	var id = -1;
	
	var list2 = [];
	for (var i = 0; i < n; i++) {
		while (i >= list1[id+1]) {
			id++;
			list2[id] = [];
		}
		list2[id].push(f.readInteger(1));
	}
	planUtils.exportTSV(outputFile, '2', list2);
	
	
	
	// Finished! Just output the header.
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}

exports.decodePlan = decodePlanGRZ;
