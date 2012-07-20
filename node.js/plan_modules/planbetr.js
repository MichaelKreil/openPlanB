var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
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
	
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1.push([
			i,
			f.readNullString(),
			f.readNullString(),
			f.readNullString()
		]);
	}
	planUtils.exportTSV(outputFile, '1', list1, 'betr1Id,short,middle,long');
	
	
	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [
			i,
			f.readNullString()
		];
	}
	for (var i = 0; i < header.listLength2; i++) {
		list2[i].push(f.readInteger(2));
	}
	planUtils.exportTSV(outputFile, '2', list2, 'betr2Id,short,betr1Id');
	
	
	var list3 = [];
	for (var i = 0; i < header.listLength3; i++) {
		list3[i] = [
			i,
			f.readInteger(1),
			f.readInteger(1)
		];
	}
	planUtils.exportTSV(outputFile, '3', list3, 'betr3Id,unknown1,unknown2');
	
	var list4 = [];
	for (var i = 0; i < header.listLength4; i++) {
		list4[i] = [
			i,
			f.readInteger(4),
			f.readInteger(2),
			f.readBinDump(4)
		];
	}
	planUtils.exportTSV(outputFile, '4', list4, 'betr4Id,unknown1,unknown2,unknown3');
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
	
	var json1 = [];
	for (var i = 0; i < list1.length; i++) {
		json1.push({
			betr1Id: i,
			nameType: list1[i][1],
			nameShort: list1[i][2],
			nameLong: list1[i][3]
		});
	}
	planUtils.exportJSON(outputFile, 'list1', json1);

	var json2 = [];
	for (var i = 0; i < list2.length; i++) {
		json2.push({
			betr2Id: i,
			betr1Id: list2[i][2],
			unknown: list2[i][1]
		});
	}
	planUtils.exportJSON(outputFile, 'list2', json2);

	var json3 = [];
	for (var i = 0; i < list3.length; i++) {
		json3.push({
			zugId: i,
			betr2Id: list3[i][1],
			unknown: list3[i][2]
		});
	}
	planUtils.exportJSON(outputFile, 'list3', json3);
}
