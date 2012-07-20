var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(4);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.listLength2 = f.readInteger(4);
	header.listLength1 = f.readInteger(4);
	header.listLength3 = f.readInteger(4);
	header.listLength4 = f.readInteger(4);
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	
	
	var list1 = [];
	for (var i = 0; i < header.listLength1+1; i++) {
		list1[i] = [
			i,
			f.readInteger(-4),
			f.readInteger(-2),
			f.readInteger(4)
		];
	}
	planUtils.exportTSV(outputFile, '1', list1, 'itxt1_id,zug1_ref?,unknown2,itxt2_offset');
	
	
	
	var list2 = [];
	for (var i = 0; i < header.listLength2; i++) {
		list2[i] = [
			i,
			f.readInteger(4),
			f.readInteger(1),
			f.readInteger(1),
			f.readInteger(2),
			f.readInteger(2)
		];
	}
	planUtils.exportTSV(outputFile, '2', list2, 'itxt2_id,unknown1,unknown2,unknown3,unknown4,unknown5');
	
	
	
	var list3 = [];
	for (var i = 0; i < header.listLength3; i++) {
		list3[i] = [
			i,
			f.readInteger(4),
			f.readInteger(4)
		];
	}
	planUtils.exportTSV(outputFile, '3', list3, 'itxt3_id,b1_ref?,itxt4_ref?');
	
	
	
	var list4 = [];
	for (var i = 0; i < header.listLength4; i++) {
		list4[i] = [
			i,
			f.readInteger(1),
			f.readInteger(1),
			f.readInteger(1),
			f.readInteger(1),
			f.readInteger(4)
		];
	}
	planUtils.exportTSV(outputFile, '4', list4, 'itxt4_id,unknown1,unknown2,unknown3,unknown4,itxt5offset_ref');
	
	
	
	var list5 = [];
	var p0 = f.pos;
	var i = 0;
	while (f.pos < f.length) {
		list5.push([
			i,
			f.pos-p0,
			f.readNullString()
		]);
		i++
	}
	planUtils.exportTSV(outputFile, '5', list5, 'itxt5_id,itxt5offset_id,unknown1');
	
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}
