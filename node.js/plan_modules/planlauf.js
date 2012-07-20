var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength1 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	header.offset1 = f.readInteger(4);
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1.push([
			i,
			f.readInteger(4)
		]); 
	}
	planUtils.exportTSV(outputFile, '1', list1, 'index,offset');
	list1.push([f.length]);
	
	var list2 = [];
	var id = 0, i = 0;
	while (f.pos < f.length) {
		if (f.pos >= list1[id+1][1]) id++;
		list2.push([i, id, f.readInteger(4)]);
		i++
	}
	planUtils.exportTSV(outputFile, '2', list2, 'index,laufId,stop');
	
	list1.pop();

	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
	
	// Datenstruktur erzeugen
	// nach dem TSV-Export, damit der Array gespliced werden kann
	
	var data = [];
		
	for (var i = 0; i < list1.length; i++) {
		data[i] = { id: i, stops: [] };
	}	
	
	for (var i = 0; i < list2.length; i++) {
		data[list2[i][1]].stops.push(list2[i][2]);
	}
	
	planUtils.exportJSON(outputFile, 'data', data);
}
