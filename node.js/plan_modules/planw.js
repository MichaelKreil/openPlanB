var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	f.checkBytes('20 20 20 20 20');
	f.checkBytes('20 20 20 20 20');
	f.checkBytes('20 20 20 20 20');
	
	switch (header.version) {
		case '4.0':
			header.listLength1 = f.readInteger(2);
			header.listLength2 = f.readInteger(2);
			header.blockSize2 = f.readInteger(2);
			header.validityBegin = f.readInteger(2);
			header.validityEnd = f.readInteger(2);
			header.unknown.push(f.readInteger(2));
			header.blockSize1 = 2;
		break;
		case '4.1':
			header.listLength1 = f.readInteger(4);
			header.listLength2 = f.readInteger(4);
			header.blockSize2 = f.readInteger(2);
			header.validityBegin = f.readInteger(2);
			header.validityEnd = f.readInteger(2);
			header.unknown.push(f.readInteger(4));
			header.blockSize1 = 4;
		break;
		default:
			console.error('ERROR: unknown Version "' + header.version + '"');
	}
	
	header.listLength1++; // Keine Ahnung, warum!
	header.listLength2--;
	
	header.description = f.readString(header.size - f.pos);
	
	
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [
			i,
			f.readInteger(header.blockSize1)
		];
	}
	planUtils.exportTSV(outputFile, '1', list1, 'w1Id,w2Id');
	
	
	
	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [
			i,
			f.readBinDump(header.blockSize2, true)
		];
	}
	planUtils.exportTSV(outputFile, '2', list2, 'w2Id,unknown1');
	
	
	
	header.bytesLeft = f.check(outputFile);
	planUtils.exportHeader(outputFile, header);

	var data = [];
	for (var i = 0; i < header.listLength1; i++) {
		var daysBitset = 'all';
		if (list1[i][1]) {
			daysBitset = list2[ list1[i][1] - 1 ][1];
			daysBitset = daysBitset.substring(2, daysBitset.length - 2);
		}
		data.push({
			id: i,
			days: daysBitset
		});
	}
	planUtils.exportJSON(outputFile, 'data', data);
}
