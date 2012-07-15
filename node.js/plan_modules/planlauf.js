var planUtils = require('./plan_utils.js');

function decodePlanLAUF(filename, outputFile) {
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
	
	var
		data1 = [];
	
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		data1[i][0] = f.readInteger(4);
	}
	data1.push([f.length]);
	
	var i = 0;
	while (f.pos < f.length) {
		if (f.pos >= data1[i+1][0]) i++;
		data1[i].push(f.readInteger(4));
	}
	
	data1.pop();

	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
	planUtils.exportTSV(outputFile, '1', data1);
	
	// Datenstruktur erzeugen
	// nach dem TSV-Export, damit der Array gespliced werden kann
	
	var
		data = [];
		
	for (var i = 0; i < data1.length; i++) {
		data[i] = {
			id: i,
			unknown1: data1[i][0],
			stops: data1[i].splice(2)
		}
	}
	
	planUtils.exportJSON(outputFile, 'data', data);
}

exports.decodePlan = decodePlanLAUF;
