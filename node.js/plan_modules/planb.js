var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
	var f = new planUtils.PlanFile(filename);
	
	
	
	// Header einlesen
	
	var header = {unknown:[]};
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	f.checkBytes('20 20 20 20 20');
	f.checkBytes('20 20 20 20 20');
	f.checkBytes('20 20 20 20 20');
	
	header.unknown.push(f.readHexDump(6));
	
	header.listLength1 = f.readInteger(4);
	header.listLength2 = f.readInteger(4);
	
	header.unknown.push(f.readHexDump(4));
	header.unknown.push(f.readString(17));
	header.unknown.push(f.readString(30));
	header.unknown.push(f.readHexDump(6));
	
	header.description = f.readString(header.size - f.pos);
	
	
	
	// Daten einlesen
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [
			i,
			f.readInteger(2),
			f.readInteger(2),
			f.readInteger(2),
			f.readInteger(4),
			f.readInteger(4)
		];
	}
	planUtils.exportTSV(outputFile, '1', list1, 'b1_id,unknown1,unknown2,unknown3,unknown4,unknown5');
	
	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [
			i,
			f.readInteger(4),
			f.readInteger(4)
		];
	}
	var pos0 = f.pos;
	for (var i = 0; i < header.listLength2; i++) {
		f.pos = pos0 + list2[i][2]; 
		list2[i][2] = f.readNullString();
	}
	planUtils.exportTSV(outputFile, '2', list2, 'b2_id,b1_ref?,unknown2');
	
	
	
	header.bytesLeft = f.check(outputFile);
	planUtils.exportHeader(outputFile, header);
	
	
	
	// Datenstruktur erzeugen
	
	var
		data = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		data[i] = {
			id: i,
			unknown1: list1[i][1],
			unknown2: list1[i][2],
			unknown3: list1[i][3],
			IBNR: list1[i][4],
			name: list2[list1[i][5]][2],
			synonyms: []
		}
	}
	for (var i = 0; i < header.listLength2; i++) {
		if (list1[list2[i][1]][5] != i) {
			data[list2[i][1]].synonyms.push(list2[i][2]);
		}
	}
	
	
	
	// Alles exportieren
	planUtils.exportJSON(outputFile, 'data', data);
}
