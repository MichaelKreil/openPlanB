var planUtils = require('./plan_utils.js');

exports.decodePlan = function(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	header.listLength1 = f.readInteger(4);
	
	var list1 = [];
	
	for (var i = 1; i < 256; i++) {
		list1.push([
			// plain char - ASCII Number 
			i,
			
			// encoded char - ASCII Number
			f.readInteger(1),
			
			// Char-Type (0, 1, 2, 3, 4, 117)
			f.readInteger(1)
		]);
	}
	planUtils.exportTSV(outputFile, '1', list1);
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}


