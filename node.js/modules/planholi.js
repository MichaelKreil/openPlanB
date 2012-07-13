var planUtils = require('./plan_utils.js');

exports.decodePlan = function(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	var list1 = f.readString(f.length);
	list1 = list1.split('\n\r');
	
	planUtils.exportTSV(outputFile, '1', list1);
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}


