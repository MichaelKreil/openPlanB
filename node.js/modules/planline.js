var planUtils = require('./plan_utils.js');

function decodePlanLINE(filename, outputFile) {
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
	
	var data1 = [];
	
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		
		// id by which this line is referenced in ZUG
		data1[i][0] = f.readInteger(2);
		
		// UNKNOWN
		data1[i][1] = f.readInteger(2);
		
		// name of line
		data1[i][2] = f.readString(nameLength).replace(/\x00/g, '');
	}
	
	header.bytesLeft = f.check(outputFile);
	
	// export
	
	planUtils.exportHeader(outputFile, header);
	planUtils.exportTSV(outputFile, '1', data1);
	
	var data = [];
	for (var i = 0; i < data1.length; ++i) {
		data.push({
			id: data1[i][0],
			lineString: data1[i][2],
			unknown: data1[i][1]
		});
	}
	
	planUtils.exportJSON(outputFile, 'data', data);
}

exports.decodePlan = decodePlanLINE;
