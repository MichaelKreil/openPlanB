var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
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
	
	var list1 = [];
	var list2 = [];
	var list3 = [];
	var list4 = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		list1.push([
			i,
			
			// references a train, Z id
			f.readInteger(4),
		
			// number of iteration for which this information holds
			//  (cf. train frequency)
			f.readInteger(2),
		
			// TODO: check: probably offset in file
			f.readInteger(4)
		]);
	}
	planUtils.exportTSV(outputFile, '1', list1, 'gls1_id,zug1_ref?,unknown1,unknown2');
	
	
	var id = 0;
	for (var i = 0; i < header.listLength1; i++) {
		var n = f.readInteger(integerByteCount);
		for (var j = 0; j < n; j++) {
			list2.push([
				id,
				i,
				
				// stop on route for which this platform information holds
				// number 0 corresponds to the first entry of the LAUF route
				f.readInteger(1),
			
				// UNKNOWN
				f.readHexDump(1),
			
				// position in GLS list 3
				f.readInteger(integerByteCount)
			]);
			id++;
		}
	}
	planUtils.exportTSV(outputFile, '2', list2, 'gls2_id,gls1_ref,unknown1,unknown2,gls3_ref');
	
	for (var i = 0; i < header.listLength3; i++) {
		list3.push([
			i,
			
			// position in GLS list 4
			f.readInteger(2),
			
			// UNKNOWN
			f.readInteger(integerByteCount)
		]);
	}
	planUtils.exportTSV(outputFile, '3', list3, 'gls3_id,gls4_ref,unknown');
	
	for (var i = 0; i < header.listLength4; i++) {
		// name of platform
		list4.push([
			i,
			f.readString(8)
		]);
	}
	planUtils.exportTSV(outputFile, '4', list4, 'gls4_id,text');
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
	

	// Datenstruktur erzeugen
	var data = [];
	var i2 = 0;
		
	for (var i = 0; i < list1.length; i++) {
		var obj = {
			id: i,
			trainId: list1[i][1],
			frequencyId: list1[i][2],
			platformAtStops: []
		}
		while ((i2 < list2.length) && (list2[i2][0] == i)) {
			obj.platformAtStops.push({
				stopNumber: list2[i2][2],
				platform: list4[ list3[ list2[i2][4] ] [1] ][1].trim()
			});
			i2++;
		}
		data.push(obj);
	}
	
	planUtils.exportJSON(outputFile, 'data', data);
}
