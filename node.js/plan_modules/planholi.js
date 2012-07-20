var planUtils = require('./plan_utils.js');

exports.decodePlan = function(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	var list1 = f.readString(f.length);
	list1 = list1.split('\r\n');
	if (list1[list1.length - 1] == '') list1.pop();

	for (var i = 0; i < list1.length; i++) {
		list1[i] = [
			i,
			list1[i]
		];
	}
	planUtils.exportTSV(outputFile, '1', list1, 'listId,datum');
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}


