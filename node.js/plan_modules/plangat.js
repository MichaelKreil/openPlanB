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
	
	header.listSize4 = f.readInteger(4);

	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(2));

	header.description = f.readString(header.size - f.pos);

	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [];
		list1[i][0] = f.readString(4).replace(/\x00/g, '');
		list1[i][1] = f.readInteger(2);
		list1[i][2] = f.readString(8).replace(/\x00/g, '');
		for (var j = 0; j < 10; ++j) {
			list1[i][3 + j] = f.readInteger(2);
		}
	}
	planUtils.exportTSV(outputFile, '1', list1);

	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [];
		list2[i][0] = f.readHexDump(614);
	}
	planUtils.exportTSV(outputFile, '2', list2);

	var list3 = [];
	for (var i = 0; i < header.listLength3; i++) {
		list3[i] = [];
		list3[i][0] = f.readNullString();
	}
	planUtils.exportTSV(outputFile, '3', list3);
	
	var list4 = [];
	if (header.listSize4 > 0) list4 = f.readString(header.listSize4).split('\x00');
	planUtils.exportTSV(outputFile, '4', list4);

	header.bytesLeft = f.check(outputFile);

	planUtils.exportHeader(outputFile, header);
	
	var data = [];
	for (var i = 0; i < list1.length; ++i) {
		data.push({
			id: i,
			nameShort: list1[i][0],
			nameLong: list1[i][2]
			// TODO: unknown values omitted
		});
	}
	
	planUtils.exportJSON(outputFile, 'data1', data);
}


exports.decodePlan = decodePlanGAT;
