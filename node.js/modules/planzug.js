var planUtils = require('./plan_utils.js');

function decodePlanZUG(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength1 = f.readInteger(4);
	// number of routes in LAUF list1
	header.numberOfRoutes = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	// number of stations in B list1
	header.numberOfStations = f.readInteger(4);
	
	header.validityBegin = f.readInteger(2);
	header.validityEnd = f.readInteger(2);
	
	header.description = f.readString(header.size - f.pos);
	
	var
		data1 = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		data1[i][0] = f.readBinDump(2);
	}
	header.blockSize = (f.length - f.pos)/(2*header.listLength1);
	
	// strange: block size seems to vary
	if (header.blockSize != 11 && header.blockSize != 12) {
		throw "don't know how to handle blockSize " + header.blockSize;
	}

	for (var i = 0; i < header.listLength1; i++) {
		// guess that blockSizes affects size of first integer might be wrong
		if (header.blockSize == 12)
			data1[i][1] = f.readInteger(4);
		else
			data1[i][1] = f.readInteger(2);
		data1[i][2] = f.readInteger(2);
		data1[i][3] = f.readInteger(2);
		// train number OR offset in ATR, list 1
		// interpretation offset iff data1[i][6]==0
		// for S-Bahn-trains something strange happens to this number
		data1[i][4] = f.readInteger(2);
		// UNKNOWN
		data1[i][5] = f.readInteger(1);
		// train type OR indicator for data1[i][4]
		data1[i][6] = f.readInteger(1);
		data1[i][7] = f.readInteger(2);
		data1[i][8] = f.readInteger(2);
		// route of this train (references a LAUF id)
		data1[i][9] = f.readInteger(4);
		data1[i][10] = f.readInteger(2);
		data1[i][11] = f.readInteger(2);
	}

	header.bytesLeft = f.check(outputFile);
	
	// Datenstruktur erzeugen
	var
		data = [];
	
	for (var i = 0; i < data1.length; i++) {
		data[i] = {
			id: i,
			laufId: data1[i][9],
			unknown1: data1[i][0],
			unknown2: data1[i][1],
			unknown3: data1[i][2],
			unknown4: data1[i][3],
			unknown5: data1[i][4],
			unknown6: data1[i][5],
			unknown7: data1[i][6],
			unknown8: data1[i][7],
			unknown9: data1[i][8],
			unknown10: data1[i][10],
			unknown11: data1[i][11]
		}
	}
	
	planUtils.exportHeader(outputFile, header);
	planUtils.exportTSV(outputFile, '1', data1);
	planUtils.exportJSON(outputFile, 'data', data);
}

exports.decodePlan = decodePlanZUG;
