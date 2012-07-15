var planUtils = require('./plan_utils.js');

function decodePlanMETA(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);

	header.unknown.push(f.readHexDump(4));
	header.listLength2 = f.readInteger(4);
	header.listLength3 = f.readInteger(4);
	header.listLength1 = f.readInteger(4);
	header.unknown.push(f.readHexDump(8));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [
			f.readInteger(4),
			f.readInteger(4),
			f.readHexDump(8)
		]
	}
	planUtils.exportTSV(outputFile, '1', list1);
	
	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = f.readInteger(-4)
	}
	planUtils.exportTSV(outputFile, '2', list2);
	
	var list3 = [];
	for (var i = 0; i < header.listLength3; i++) {
		list3[i] = [
			f.readInteger(2),
			f.readHexDump(1),
			f.readHexDump(1),
		]
	}
	planUtils.exportTSV(outputFile, '3', list3);
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}

exports.decodePlan = decodePlanMETA;
