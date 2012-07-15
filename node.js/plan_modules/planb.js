var planUtils = require('./plan_utils.js');

function decodePlanB(filename, outputFile) {
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
	
	var
		list1 = [],
		list2 = [],
		list3 = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [];
		list1[i][0] = f.readInteger(2);
		list1[i][1] = f.readInteger(2);
		list1[i][2] = f.readInteger(2);
		list1[i][3] = f.readInteger(4);
		list1[i][4] = f.readInteger(4);
	}
	
	var lastIndex = -1;
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [];
		list2[i][0] = f.readInteger(4);
		list2[i][1] = f.readInteger(4);
	}
	
	var pos0 = f.pos;
	for (var i = 0; i < header.listLength2; i++) {
		list3[f.pos-pos0] = f.readNullString();
	}
	
	for (var i = 0; i < header.listLength2; i++) {
		list2[i][2] = list3[list2[i][1]];
	}
	
	header.bytesLeft = f.check(outputFile);
	
	
	
	// Datenstruktur erzeugen
	
	var
		data = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		data[i] = {
			id: i,
			unknown1: list1[i][0],
			unknown2: list1[i][1],
			unknown3: list1[i][2],
			IBNR: list1[i][3],
			name: list2[list1[i][4]][2],
			synonyms: []
		}
		list1[i][5] = list2[list1[i][4]][2];
	}
	for (var i = 0; i < header.listLength2; i++) {
		if (list1[list2[i][0]][4] != i) {
			data[list2[i][0]].synonyms.push(list2[i][2]);
		}
	}
	
	
	
	// Alles exportieren
	
	planUtils.exportHeader(outputFile, header);
	planUtils.exportTSV(outputFile, '1', list1);
	planUtils.exportTSV(outputFile, '2', list2);
	planUtils.exportJSON(outputFile, 'data', data);
}

exports.decodePlan = decodePlanB;
