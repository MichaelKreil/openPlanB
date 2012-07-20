var planUtils = require('./plan_utils.js');

exports.decodePlan = function (filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	header.size = f.readInteger(2);
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.listLength2 = f.readInteger(4);
	
	header.unknown.push(f.readInteger(4));
	header.listLength1 = f.readInteger(4);
	header.unknown.push(f.readHexDump(4));
	

	header.description = f.readString(header.size - f.pos);
	
	f.checkBytes('00 00 00 00');
	
	var
		list1 = [],
		list2 = [];
	
	for (var i = 0; i < header.listLength1; i++) {
		list1.push([
			i,
		 	f.readInteger(4)
		]);
	}
	planUtils.exportTSV(outputFile, '1', list1, 'b1_ref?,kant2_offset');

	var id = 0;
	for (var i = 0; i < header.listLength2; i++) {
		while (list1[id][1] <= i) id++; 
		list2.push([
			i,
			id,
			f.readInteger(4),
			f.readInteger(3),
			f.readHexDump(1),
			f.readInteger(1),
			f.readHexDump(1)
		]);
	}
	planUtils.exportTSV(outputFile, '2', list2, 'kant2_id,b1_ref?,b1_ref?,unknown1,unknown2,dauer,unknown4');

	header.bytesLeft = f.check(outputFile);
	
	// Structure
	
	var data = [];
	var j0 = 0;
	for (var i = 0; i < header.listLength1; i++) {
		data[i] = {
			bahnhofid: i,
			kanten:[]
		}
		for (var j = j0; j < list1[i][1]; j++) data[i].kanten.push({
			bahnhofid:list2[j][2],
			unknown1:list2[j][3],
			unknown2:list2[j][4],
			dauer:list2[j][5],
			unknown4:list2[j][6]
		});
		j0 = list1[i][1];
	}
	
	// Export
	
	planUtils.exportHeader(outputFile, header);
	planUtils.exportJSON(outputFile, 'data', data);
}
