var planUtils = require('./plan_utils.js');

function decodePlanKGEO(filename, outputFile) {
	var f = new planUtils.PlanFile(filename);
	
	// Header
	
	var header = {unknown:[]};
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength1 = f.readInteger(4);
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	
	header.description = f.readString(header.size - f.pos);
	
	// Data
	
	var list1 = [];
	
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [];
		list1[i][0] = f.readInteger(-2);
	}
	
	for (var i = 0; i < header.listLength1; i++)	list1[i][1] = f.readInteger(-2);
	for (var i = 0; i < header.listLength1; i++)	list1[i][2] = f.readInteger(-2);
	for (var i = 0; i < header.listLength1; i++)	list1[i][3] = f.readInteger(-2);
	
	header.bytesLeft = f.check(outputFile);
	
	// Structure
	
	var data = [];
	
	for (var i = 0; i < header.listLength1; i++) {
		data[i] = {
			id: i,
			lon: (list1[i][0] + list1[i][2]/1000) / (40048/360),   // Der HAFAS-Ellipsoid ist eine Kugel mit einem Umfang von 40048km
			lat: (list1[i][1] + list1[i][3]/1000) / (40048/360)
		}
	}
	
	// Export
	
	planUtils.exportHeader(outputFile, header);
	planUtils.exportTSV(outputFile, '1', list1);
	planUtils.exportJSON(outputFile, 'data', data);
}

exports.decodePlan = decodePlanKGEO;
