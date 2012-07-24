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
		list1[i] = {
			gat1_id:         i,
			shortName:       f.readString(4).replace(/\x00/g, ''), // Short name
			shortNameLength: f.readInteger(2),                     // Length of short name
			longName:        f.readString(8).replace(/\x00/g, ''), // Long name
			unknown1:        f.readInteger(2),                     // always =  0 ?
			typeId:          f.readInteger(-2),                   
			unknown3:        f.readInteger(2),                     // Reichweite? 0 = Flugzeug und 9 = Bummelbahn
			unknown4:        f.readInteger(2),                     //
			unknown5:        f.readBinDump(12)                     // Binary code of cols in list 2
		};
	}
	planUtils.exportTSV(outputFile, '1', list1);

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
	for (var j = 0; j < 153; j++) t.push('field'+j);
	planUtils.exportTSV(outputFile, '2', list2, t.join(','));

	var list3 = [];
	for (var i = 0; i < header.listLength3; i++) {
		list3[i] = {
			gat3_id: i,
			text:    f.readNullString()
		};
	}
	planUtils.exportTSV(outputFile, '3', list3);
	
	var list4 = [];
	if (header.listSize4 > 0) list4 = f.readString(header.listSize4).split('\x00');
	for (var i = 0; i < list4.length; i++) {
		list4[i] = {
			gat4_id: i,
			unknown: list4[i]
		}
	}
	planUtils.exportTSV(outputFile, '4', list4);

	header.bytesLeft = f.check(outputFile);

	planUtils.exportHeader(outputFile, header);
	
	var data = [];
	for (var i = 0; i < list1.length; ++i) {
		var obj = {
			gatId: i,
			nameShort: list1[i].shortName,
			nameLong: list1[i].longName.trim(),
			translations: []
			// TODO: unknown values omitted
		};
		var typeId = list1[i].typeId;
		var typeObj = {};
		for (var k = 0; k < list2.length; k++) {
			var language = list2[k][1];
			var id3 = list2[k][typeId + 3];
			var word = list3[id3].text;
			typeObj[language] = word;
		}
		obj.translations.push(typeObj);
		data.push(obj);
	}
	planUtils.exportJSON(outputFile, 'data1', data);
}
