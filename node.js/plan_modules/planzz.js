var planUtils = require('./plan_utils.js');

exports.decodePlan = function(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	
	
	// Reading header
	 
	header.size = f.readInteger(2);
	
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength1 = f.readInteger(4);
	header.listLength2 = f.readInteger(4);
	header.unknown.push(f.readHexDump(8));
	
	header.description = f.readString(header.size - f.pos);
	
	
	
	// Decoding List 1
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [
			f.readBinDump(2),
			f.readInteger(2)
		];
	}
	planUtils.exportTSV(outputFile, '1', list1);
	
	
	
	// Decoding List 2
	
	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) list2[i] = [f.readBinDump(4)];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i].push(f.readInteger(2));
	}
	planUtils.exportTSV(outputFile, '2', list2);
	
	
	
	// We are finished
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}


