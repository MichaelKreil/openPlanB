var planUtils = require('./plan_utils.js');

exports.decodePlan = function(filename, outputFile) {
	var header = {unknown:[]};
	
	var f = new planUtils.PlanFile(filename);
	
	
	
	// Reading header informations
	
	header.size = f.readInteger(2);
	
	header.version = f.readInteger(2) + '.' + f.readInteger(2);
	header.creationDate = f.readTimestamp();
	
	header.unknown.push(f.readInteger(2));
	header.listLength1 = f.readInteger(2);
	header.unknown.push(f.readHexDump(4));
	
	header.description = f.readString(header.size - f.pos);
	
	
	
	// List 1 stores the starting position of Bytes in List 2
	
	var list1 = [];
	for (var i = 0; i < header.listLength1; i++) {
		list1[i] = [
			i,
			f.readInteger(3), // start position ... just ignore
			f.readInteger(1)
		];
	}
	
	// Read the rest of the file
	
	for (var i = 0; i < header.listLength1; i++) {
		// TODO: understand this "offset"
		//   sometimes lowest byte is 0xfe, sometimes it is 0xff
		if ((list1[i][1] & 0xffff00) == 0xffff00) {
			list1[i].push('');
			list1[i].push('');
		} else {
			list1[i].push(f.readNullString());  // some id
			list1[i].push(f.readNullString());  // name of direction
		}
	}
	planUtils.exportTSV(outputFile, '1', list1, 'rich1_id,startPosition,unknown1,someKey,someDirection');
	
	
	
	// Finished! Just output the header.
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
}


