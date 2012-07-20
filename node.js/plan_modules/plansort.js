var planUtils = require('./plan_utils.js');

exports.decodePlan = function(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	header.unknown.push(f.readInteger(4));
	
	// This list maps every ASCII char (1-255) to a sorting index
	// This seems to 
	var list1 = [];
	for (var i = 1; i < 256; i++) {
		list1.push([
			// plain char - ASCII Number 
			i,
			
			// sorting index
			f.readInteger(2)
		]);
	}
	planUtils.exportTSV(outputFile, '1', list1, 'charId,sortingIndex');
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}


