var planUtils = require('./plan_utils.js');

function decodePlanUK(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength1 = f.readInteger(2);
	header.listLength4 = f.readInteger(4);
	header.listLength2 = f.readInteger(4);
	header.listLength3 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	
	header.unknown.push(f.readHexDump(4));
	header.unknown.push(f.readInteger(4));
	
	header.description = f.readString(header.size - f.pos);
	
	// Schau mal, wie viele Bytes noch kommen und schätze dann mal die Größe von list2-Block3
	// Irgendwie ergibt sich das nicht aus der Versionsnummer m(
	
	switch (f.length-f.pos) {
		case header.listLength1*4 + header.listLength2*6 + header.listLength3*2 + header.listLength4*10:
			header.list2Block3Size = 2;
		break;
		case header.listLength1*4 + header.listLength2*8 + header.listLength3*2 + header.listLength4*10:
			header.list2Block3Size = 4;
		break;
		default:
			console.error('ERROR: Byte-Länge geht irgendwie nicht auf.')
	}
	
	var
		data1 = [],
		data2 = [],
		data3 = [],
		data4 = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [
			f.readInteger(2), // Anzahl der Einträge in Liste 2
			f.readInteger(2)  // Id des ersten Eintrages in Liste 2
		];
	}
	
	for (var i = 0; i < header.listLength2; i++) {
		data2[i] = [
			f.readInteger(2), // Erster  Eintrag in Liste 1
			f.readInteger(2), // Letzter Eintrag in Liste 1
			f.readInteger(header.list2Block3Size) // Id eines Eintrages in Liste 3
		];
	}
	
	for (var i = 0; i < header.listLength3; i++) {
		data3[i] = [
			f.readInteger(-2)
		];
	}
	
	for (var i = 0; i < header.listLength4; i++) {
		data4[i] = [
			f.readInteger(4), // Bahnhof-Id
			f.readInteger(2), // Erster  Eintrag in Liste 1
			f.readInteger(2), // Letzer  Eintrag in Liste 1
			f.readInteger(2)  // irgendwas zwischen 0 und 99
		];
	}

	header.bytesLeft = f.check(outputFile);
	planUtils.exportHeader(outputFile, header);
	planUtils.exportTSV(outputFile, '1', data1);
	planUtils.exportTSV(outputFile, '2', data2);
	planUtils.exportTSV(outputFile, '3', data3);
	planUtils.exportTSV(outputFile, '4', data4);
}

exports.decodePlan = decodePlanUK;
