var planUtils = require('./plan_utils.js');

// Noch nicht fertig
exports.decodePlan = function (filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	
	
	// reading Header
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength2 = f.readInteger(4);
	header.listLength1 = f.readInteger(4);
	header.listLength5 = f.readInteger(4);
	header.unknown.push(f.readInteger(2));
	header.listLength4 = f.readInteger(4);
	header.listLength3 = f.readInteger(4);
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	
	
	// converting List 1
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1.push([
			f.readInteger(4),
			f.readHexDump(1),
			f.readHexDump(1),
			f.readInteger(4)
		]);
	}
	planUtils.exportTSV(outputFile, '1', list1);
	
	
	
	// converting List 2
	
	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2.push(f.readInteger(4));
	}
	planUtils.exportTSV(outputFile, '2', list2);
	
	
	
	// converting List 3
	
	var list3 = [];
	for (var i = 0; i < header.listLength3; i++) {
		list3.push(f.readInteger(4));
	}
	planUtils.exportTSV(outputFile, '3', list3);
	
	
	
	// converting List 4
	
	var list4 = [];
	if (header.listLength4 > 0) {
		for (var i = 0; i < header.listLength4+1; i++) {
			list4.push([
				f.readInteger(-4),
				f.readInteger(4)
			]);
		}
	}
	planUtils.exportTSV(outputFile, '4', list4);
	
	
	
	// converting List 5
	
	var list5 = [];
	for (var i = 0; i < header.listLength5; i++) {
		list5.push([
			f.readInteger(4),
			f.readInteger(2)
		]);
	}
	planUtils.exportTSV(outputFile, '5', list5);
	
	
	
	// and we are finished
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}
