var planUtils = require('./plan_utils.js');

exports.decodePlan = function(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);

	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	/*
	header.listLength2 = f.readInteger(4);
	
	header.unknown.push(f.readInteger(4));
	header.listLength1 = f.readInteger(4);
	header.unknown.push(f.readHexDump(4));
	header.unknown.push(f.readHexDump(4));
	*/
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readHexDump(4));

	header.description = f.readString(header.size - f.pos);
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}


