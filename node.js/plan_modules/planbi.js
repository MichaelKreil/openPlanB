var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	header.listLength1 = f.readInteger(4);
	header.listLength2 = f.readInteger(4);
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(4));
	
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [
			i,
			f.readInteger(4),
			f.readInteger(4)
		];
	}
	planUtils.exportTSV(outputFile, '1', list1, 'bi1Id,unknown1,unknown2');
	
	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [
			i,
			f.readBinDump(4)
		];
	}
	planUtils.exportTSV(outputFile, '2', list2, 'bi1Id,unknown1');
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}
