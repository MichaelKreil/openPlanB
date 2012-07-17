var planUtils = require('./plan_utils.js');

// GAT = Gattung?

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
		list1[i] = [
			f.readString(4).replace(/\x00/g, ''), // Short name
			f.readInteger(2),                     // Length of short name
			f.readString(8).replace(/\x00/g, ''), // Long name
			f.readInteger(2),                     // always =  0 ?
			f.readInteger(-2),                    // always = -1
			f.readInteger(2),                     //
			f.readInteger(2),                     //
			f.readBinDump(12)                     // Binary code of cols in list 2
		];
	}
	planUtils.exportTSV(outputFile, '1', list1);

	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [
			f.readString(1),
			f.readInteger(1)
		];
		for (var j = 0; j < 153; j++) {
			list2[i].push(f.readInteger(4));	
		}
	}
	planUtils.exportTSV(outputFile, '2', list2);

	var list3 = [];
	for (var i = 0; i < header.listLength3; i++) {
		list3[i] = [
			f.readNullString()
		];
	}
	planUtils.exportTSV(outputFile, '3', list3);
	
	var list4 = [];
	if (header.listSize4 > 0) list4 = f.readString(header.listSize4).split('\x00');
	planUtils.exportTSV(outputFile, '4', list4);

	header.bytesLeft = f.check(outputFile);

	planUtils.exportHeader(outputFile, header);
	
	var data = [];
	for (var i = 0; i < list1.length; ++i) {
		var obj = {
			gatId: i,
			nameShort: list1[i][0],
			nameLong: list1[i][2].trim(),
			type: []
			// TODO: unknown values omitted
		};
		var typeId = list1[i][4];
		var typeObj = {};
		for (var k = 0; k < list2.length; k++) {
			var language = list2[k][0];
			var id3 = list2[k][typeId + 2];
			var word = list3[id3][0];
			typeObj[language] = word;
		}
		obj.type.push(typeObj);
		data.push(obj);
	}
	planUtils.exportJSON(outputFile, 'data1', data);
}


exports.decodePlan = decodePlanGAT;
