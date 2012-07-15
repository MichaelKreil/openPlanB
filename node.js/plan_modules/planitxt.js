var planUtils = require('./plan_utils.js');

function decodePlanITXT(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(4);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.listLength2 = f.readInteger(4);
	header.listLength1 = f.readInteger(4);
	header.listLength3 = f.readInteger(4);
	header.listLength4 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	
	
	var list1 = [];
	for (var i = 0; i < header.listLength1+1; i++) {
		list1[i] = [
			f.readInteger(-4),
			f.readInteger(-2),
			f.readInteger(4)
		];
	}
	planUtils.exportTSV(outputFile, '1', list1);
	
	
	
	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [
			f.readHexDump(4),
			f.readHexDump(1),
			f.readHexDump(1),
			f.readHexDump(2),
			f.readHexDump(2)
		];
	}
	planUtils.exportTSV(outputFile, '2', list2);
	
	
	
	var list3 = [];
	for (var i = 0; i < header.listLength3; i++) {
		list3[i] = [
			f.readInteger(4),
			f.readInteger(4)
		];
	}
	planUtils.exportTSV(outputFile, '3', list3);
	
	
	
	var list4 = [];
	for (var i = 0; i < header.listLength4; i++) {
		list4[i] = [
			f.readInteger(1),
			f.readInteger(1),
			f.readInteger(1),
			f.readInteger(1),
			f.readInteger(4)
		];
	}
	planUtils.exportTSV(outputFile, '4', list4);
	
	
	
	var list5 = [];
	var p0 = f.pos;
	while (f.pos < f.length) {
		list5.push([f.pos-p0, f.readNullString()]);
	}
	planUtils.exportTSV(outputFile, '5', list5);
	
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}

exports.decodePlan = decodePlanITXT;
