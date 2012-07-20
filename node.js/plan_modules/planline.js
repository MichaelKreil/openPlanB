var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	
	header.listLength1 = f.readInteger(2);
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	
	header.validityBegin = f.readInteger(2);
	header.validityEnd = f.readInteger(2);
	
	header.description = f.readString(header.size - f.pos);
	
	var nameLength = 0;
	switch (header.version) {
		case '4.0': nameLength = 5; break;
		case '4.1': nameLength = 8; break;
		default:
			console.error('ERROR: Unbekannte Version');
	}
	
	var list1 = [];
	
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [i];
		
		// id by which this line is referenced in ZUG
		list1[i][1] = f.readInteger(2);
		
		// UNKNOWN
		list1[i][2] = f.readInteger(2);
		
		// name of line
		list1[i][3] = f.readString(nameLength).replace(/\x00/g, '');
	}
	planUtils.exportTSV(outputFile, '1', list1, 'line1_id,lineKey,unknown1,lineName');
	
	header.bytesLeft = f.check(outputFile);
	
	// export
	
	planUtils.exportHeader(outputFile, header);
	
	var data = [];
	for (var i = 0; i < list1.length; ++i) {
		data.push({
			lineId: list1[i][1],
			unknown: list1[i][2],
			lineName: list1[i][3]
		});
	}
	
	planUtils.exportJSON(outputFile, 'data', data);
}
