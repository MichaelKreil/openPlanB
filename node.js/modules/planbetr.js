var planUtils = require('./plan_utils.js');

function decodePlanBETR(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength3 = f.readInteger(4);
	header.listLength4 = f.readInteger(4);
	header.listLength1 = f.readInteger(2);
	header.unknown.push(f.readInteger(4));
	header.listLength2 = f.readInteger(2);
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(4));
	
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	
	var data1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		data1[i][0] = f.readNullString();
		data1[i][1] = f.readNullString();
		data1[i][2] = f.readNullString();
	}
	
	var data2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		data2[i] = [];
		data2[i][0] = f.readNullString();
	}
	for (var i = 0; i < header.listLength2; i++) {
		data2[i][1] = f.readInteger(2);
	}
	
	var data3 = [];
	for (var i = 0; i < header.listLength3; i++) {
		data3[i] = [];
		data3[i][0] = f.readInteger(1);
		data3[i][1] = f.readInteger(1);
	}
	
	var data4 = [];
	for (var i = 0; i < header.listLength4; i++) {
		data4[i] = [];
		data4[i][0] = f.readInteger(4);
		data4[i][1] = f.readInteger(2);
		data4[i][2] = f.readBinDump(4);
	}
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
	planUtils.exportTSV(outputFile, '1', data1);
	planUtils.exportTSV(outputFile, '2', data2);
	planUtils.exportTSV(outputFile, '3', data3);
	planUtils.exportTSV(outputFile, '4', data4);
	
	var json1 = [];
	for (var i = 0; i < data1.length; i++) {
		json1.push({
			id: i,
			nameType: data1[i][0],
			nameShort: data1[i][1],
			nameLong: data1[i][2]
		});
	}
	planUtils.exportJSON(outputFile, 'data1', json1);

	var json2 = [];
	for (var i = 0; i < data2.length; i++) {
		json2.push({
			id: i,
			betr1Id: data2[i][1],
			unknown: data2[i][0]
		});
	}
	planUtils.exportJSON(outputFile, 'data2', json2);

	var json3 = [];
	for (var i = 0; i < data3.length; i++) {
		json3.push({
			id: i,
			betr2Id: data3[i][0],
			unknown: data3[i][1]
		});
	}
	planUtils.exportJSON(outputFile, 'data3', json3);
}

exports.decodePlan = decodePlanBETR;
