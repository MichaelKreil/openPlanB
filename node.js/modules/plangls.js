var planUtils = require('./plan_utils.js');

function decodePlanGLS(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	var integerByteCount = null;
	switch (header.version) {
		case '4.0':	integerByteCount = 2; break;
		case '4.1':	integerByteCount = 4; break;
		default:
			console.error('ERROR: unknown Version "' + header.version + '"');
	}
	
	header.unknown.push(f.readInteger(2));
	header.listLength1 = f.readInteger(4);
	header.maxOffset = f.readInteger(4);
	header.listLength3 = f.readInteger(integerByteCount);
	header.listLength4 = f.readInteger(2);
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	var
		data1 = [],
		data2 = [],
		data3 = [],
		data4 = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		// references a train, Z id
		data1[i][0] = f.readInteger(4);
		
		// number of iteration for which this information holds
		//  (cf. train frequency)
		data1[i][1] = f.readInteger(2);
		
		// TODO: check: probably offset in file
		data1[i][2] = f.readInteger(4);
	}
	
	for (var i = 0; i < header.listLength1; i++) {
		data2[i] = [];
		var n = f.readInteger(integerByteCount);
		for (var j = 0; j < n; j++) {
			// stop on route for which this platform information holds
			// number 0 corresponds to the first entry of the LAUF route
			data2[i].push(f.readInteger(1));
			
			// UNKNOWN
			data2[i].push(f.readHexDump(1));
			
			// position in GLS list 3
			data2[i].push(f.readInteger(integerByteCount));
		}
	}
	
	for (var i = 0; i < header.listLength3; i++) {
		data3[i] = [];
		// position in GLS list 4
		data3[i].push(f.readInteger(2));
		
		// UNKNOWN
		data3[i].push(f.readInteger(integerByteCount));
	}
	
	for (var i = 0; i < header.listLength4; i++) {
		// name of platform
		data4[i] = f.readString(8);
	}
	
	header.bytesLeft = f.check(outputFile);
	
	// Datenstruktur erzeugen
	var
		data = [];
	
	if (data1.length != data2.length)
		throw "expected lists of same size";
		
	for (var i = 0; i < data1.length; i++) {
		data[i] = {
			id: i,
			trainId: data1[i][0],
			frequencyId: data1[i][1],
			platformAtStops: []
		}
		for (var j = 0; j < data2[i].length / 3; ++j) {
			var stopData = {
				stopNumber: data2[i][3 * j],
				platform: data4[ data3[ data2[i][3 * j + 2] ] [0] ].trim()
			};
			data[i].platformAtStops.push(stopData);
		}
	}
	
	planUtils.exportHeader(outputFile, header);
	planUtils.exportTSV(outputFile, '1', data1);
	planUtils.exportTSV(outputFile, '2', data2);
	planUtils.exportTSV(outputFile, '3', data3);
	planUtils.exportTSV(outputFile, '4', data4);
	planUtils.exportJSON(outputFile, 'data', data);
}

exports.decodePlan = decodePlanGLS;
