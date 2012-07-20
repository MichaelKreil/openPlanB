var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	
	header.unknown.push(f.readHexDump(2));
	header.unknown.push(f.readInteger(4));
	
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(2));
	header.unknown.push(f.readInteger(4));
	
	header.listLength1 = f.readInteger(4);
	
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readInteger(4));
	header.unknown.push(f.readHexDump(4));

	header.unknown.push(f.readHexDump(256));
	header.unknown.push(f.readHexDump(256));
	
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	header.unknown.push(f.readHexDump(5));
	
	header.description = f.readHexDump(header.size - f.pos);
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1.push([
			i,
			f.readInteger(1),
			f.readInteger(1),
			f.readInteger(2),
			f.readInteger(4)
		]);
	}
	planUtils.exportTSV(outputFile, '1', list1, 'ng1_id,unknown1,unknown2,unknown3,ng2_offset');
	
	
	list1.push([0,0,0,f.length]);
	
	var
		list2 = [];
		i = 0,
		id = 0,
		p0 = f.pos;
	
	while (f.pos < f.length) {
		while (f.pos-p0 >= list1[i+1][4]) i++;
		list2.push([id, i, f.readInteger(1)]);
		id++;
	}
	planUtils.exportTSV(outputFile, '2', list2, 'ng2_id,ng1_ref,value');
	
	list1.pop();
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}