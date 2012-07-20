var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.listLength1 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	header.listLength2 = f.readInteger(4);
	
	f.checkBytes('00 00 00 00');
	f.checkBytes('00 00 00 00');
	f.checkBytes('00 00 00 00');
	f.checkBytes('00 00 00 00');
	
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	
	header.unknown.push(f.readHexDump(4));
	
	f.checkBytes('00 00 00 00');
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	
	header.description = f.readString(header.size - f.pos);
	
	
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [
			i,
			f.readInteger(4), // Bahnhof-Id
			f.readInteger(2),
			f.readInteger(2)
		];
	}
	planUtils.exportTSV(outputFile, '1', list1, 'u1_id,unknown1,unknown2,unknown3');
	
	
	
	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [
			i,
			f.readInteger(4), // Bahnhof-Id
			f.readInteger(4),
			f.readInteger(2),
			f.readInteger(4),
			f.readInteger(2),
			f.readInteger(1),
			f.readInteger(1)
		];
	}
	planUtils.exportTSV(outputFile, '2', list2, 'u2_id,unknown1,zug1_ref?,unknown3,zug1_ref?,unknown5,unknown6,unknown7');
	
	
	
	f.checkBytes('FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF');
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}
