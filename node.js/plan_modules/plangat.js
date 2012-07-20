var planUtils = require('./plan_utils.js');

// GAT = Gattung?

exports.decodePlan = function (filename, outputFile) {
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
			i,
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
	planUtils.exportTSV(outputFile, '1', list1, 'gat1_id,shortname,shortnamelen,longname,unknown1,unknown2,unknown3,unknown4,unknown5');

	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [
			i,
			f.readString(1),
			f.readInteger(1)
		];
		for (var j = 0; j < 153; j++) {
			list2[i].push(f.readInteger(4));	
		}
	}
	var t = ['gat2_id','lang','unknown'];
	for (var j = 0; j < 153; j++) t.push('unknown'+j);
	planUtils.exportTSV(outputFile, '2', list2, t.join(','));

	var list3 = [];
	for (var i = 0; i < header.listLength3; i++) {
		list3[i] = [
			i,
			f.readNullString()
		];
	}
	planUtils.exportTSV(outputFile, '3', list3, 'gat3_id,text');
	
	var list4 = [];
	if (header.listSize4 > 0) list4 = f.readString(header.listSize4).split('\x00');
	for (var i = 0; i < list4.length; i++) list4[i] = [i, list4[i]];
	planUtils.exportTSV(outputFile, '4', list4, 'gat4_id,unknown');

	header.bytesLeft = f.check(outputFile);

	planUtils.exportHeader(outputFile, header);
	
	var data = [];
	for (var i = 0; i < list1.length; ++i) {
		var obj = {
			gatId: i,
			nameShort: list1[i][1],
			nameLong: list1[i][3].trim(),
			type: []
			// TODO: unknown values omitted
		};
		var typeId = list1[i][5];
		var typeObj = {};
		for (var k = 0; k < list2.length; k++) {
			var language = list2[k][1];
			var id3 = list2[k][typeId + 3];
			var word = list3[id3][1];
			typeObj[language] = word;
		}
		obj.type.push(typeObj);
		data.push(obj);
	}
	planUtils.exportJSON(outputFile, 'data1', data);
}
