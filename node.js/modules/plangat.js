var planUtils = require('./plan_utils.js');

function decodePlanGAT(filename, outputFile) {
	var header = {unknown:[]};

	var f = new planUtils.PlanFile(filename);

	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();

	header.listLength1 = f.readInteger(2);
	header.unknown.push(f.readInteger(4));
	header.listLength2 = f.readInteger(2);
	header.listLength3 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));

	f.checkBytes('00 00 00 00');

	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(2));

	header.description = f.readString(header.size - f.pos);

	var
		data1 = [],
		data2 = [],
		data3 = [];

	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		data1[i][0] = f.readString(4);
		data1[i][1] = f.readInteger(2);
		data1[i][2] = f.readString(8);
		for (var j = 0; j < 10; ++j) {
			data1[i][3 + j] = f.readInteger(2);
		}
	}

	for (var i = 0; i < header.listLength2; i++) {
		data2[i] = [];
		data2[i][0] = f.readHexDump(614);
	}

	for (var i = 0; i < header.listLength3; i++) {
		data3[i] = [];
		data3[i][0] = f.readNullString();
	}

	header.bytesLeft = f.check(outputFile);

	planUtils.exportHeader(outputFile, header);
	planUtils.exportTSV(outputFile, '1', data1);
	planUtils.exportTSV(outputFile, '2', data2);
	planUtils.exportTSV(outputFile, '3', data3);
}


exports.decodePlan = decodePlanGAT;
