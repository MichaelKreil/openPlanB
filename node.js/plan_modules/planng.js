var planUtils = require('./plan_utils.js');

function decodePlanNG(filename, outputFile) {
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
	
	var
		data1 = [],
		data2 = [];
		
	for (var i = 0; i < header.listLength1; i++) {
		data1[i] = [];
		data1[i][0] = f.readInteger(1);
		data1[i][1] = f.readInteger(1);
		data1[i][2] = f.readInteger(2);
		data1[i][3] = f.readInteger(4);
		data2[i] = [];
	}
	data1.push([0,0,0,f.length]);
	
	var
		i = 0,
		p0 = f.pos;
	
	while (f.pos < f.length) {
		if (f.pos-p0 >= data1[i+1][3]) {
			i++;
			data2[i].push(f.readInteger(4));
		} else {
			data2[i].push(f.readInteger(1));
		}
	}
	
	data1.pop();
	
	header.bytesLeft = f.check(outputFile);
	
	planUtils.exportHeader(outputFile, header);
	planUtils.exportTSV(outputFile, '1', data1);
	planUtils.exportTSV(outputFile, '2', data2);
}

exports.decodePlan = decodePlanNG;
