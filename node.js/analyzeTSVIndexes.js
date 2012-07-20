var fs = require('fs');
var path = require('path');
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));



var result = [];
scan(path.resolve(config.decodeFolder));
outputTSV(result, './analysisIndexes.tsv');
outputDia(result, './diagramm.dia');

function scan(fol) {
	var stats = fs.statSync(fol)
	if (stats.isFile()) {
		var filename = fol.split('/').pop();
		var filetype = filename.toLowerCase();
		var extension = filetype.split('.').pop();
		if (extension == 'tsv') analyzeTSV(fol);
	} else if (config.recursive && stats.isDirectory()) {
		var f = fs.readdirSync(fol);
		for (var i = 0; i < f.length; i++) scan(fol + '/' + f[i]);
	}
}

function analyzeTSV(fullname) {
	console.log('analyze: '+fullname);
	
	var path = fullname.split('/');
	var filename = path.pop();
	path = path.join('/');
	
	var data = fs.readFileSync(fullname, 'utf8');
	data = data.split('\n');
	for (var i = 0; i < data.length; i++) data[i] = data[i].split('\t');
	var headRow = data.shift();
	
	for (var i = 0; i < headRow.length; i++) {
		console.log('   column: '+(i+1));
		var column = [];
		for (var j = 0; j < data.length; j++) column.push(data[j][i]);
		
		// And now: Analyze this data column
		
		var metadata = {};
		metadata.path = path;
		metadata.filename = filename;
		metadata.colNo = i+1;
		metadata.colName = headRow[i];
		var name = headRow[i].split('_');
		metadata.colNamePart1 = name[0];
		metadata.colNamePart2 = name[1];
		metadata.valueCount = column.length;
		
		var
			s = column[0],
			smin = s,
			smax = s,
			sOrderCount = 0,
			f = parseFloat(s),
			fmin = f,
			fmax = f,
			fOrderCount = 0,
			fsum = 0,
			unique = {};
			
		for (var j = 0; j < column.length; j++) {
			s = column[j];
			if (s <  smin) smin = s;
			if (s >= smax) sOrderCount++;
			if (s >  smax) smax = s;
			
			f = parseFloat(s);
			if (f <  fmin) fmin = f;
			if (f >= fmax) fOrderCount++;
			if (f >  fmax) fmax = f;
			fsum += f;
			
			unique['_'+s] = true;
		}
		
		metadata.textMin = formatText(smin);
		metadata.textMax = formatText(smax);
		metadata.textAsc = (sOrderCount == column.length);
		metadata.numericMin = fmin;
		metadata.numericMax = fmax;
		metadata.numericAvg = fsum/column.length;
		metadata.numericAsc = (fOrderCount == column.length);
		
		var uniqueList = [];
		for (var key in unique) {
			if (unique.hasOwnProperty(key)) {
				if (unique[key]) uniqueList.push(key.substr(1));
			}
		}
		
		metadata.uniqueCount = uniqueList.length;
		metadata.unique = (uniqueList.length == column.length);
		
		result.push(metadata);
	} 
}

function formatText(text) {
	if (text === undefined) return '';
	return text.replace(/[^a-zA-Z0-9\ \,\.\-\\\(\)]/g,'?')
}

function outputTSV(data, filename) {
	var keys = {};
	for (var i = 0; i < data.length; i++) {
		var obj = data[i];
		for (var key in obj) if (obj.hasOwnProperty(key)) keys[key] = true;
	}
		
	var keyList = [];
	for (var key in keys) if (keys.hasOwnProperty(key)) keyList.push(key);

	var result = [];
	result.push(keyList.join('\t'));
	
	for (var i = 0; i < data.length; i++) {
		var obj = data[i];
		var row = new Array(keyList.length);
		for (var j = 0; j < keyList.length; j++) row[j] = obj[keyList[j]];
		result.push(row.join('\t'));
	}
	
	result = result.join('\n');
	result = result.replace(/\./g, ','); // for german versions of Excel
	fs.writeFileSync(filename, result, 'utf8');
}

function outputDia(data, filename) {
	var xml = '';
	xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
	xml += '<dia:diagram xmlns:dia="http://www.lysator.liu.se/~alla/dia/">\n';
	xml += '\t<dia:layer name="Hintergrund" visible="true" active="true">\n';
	
	var lastName = '';
	for (var i = 0; i < data.length; i++) {
		var row = data[i];
		if (row.filename != lastName) {
			if (lastName != '') {
				xml += '\t\t\t</dia:attribute>\n';
    			xml += '\t\t</dia:object>\n';
			}
			xml += '\t\t<dia:object type="UML - Class" version="0" id="O'+i+'">\n';
      	xml += '\t\t\t<dia:attribute name="elem_corner"><dia:point val="9.3,5.4"/></dia:attribute>\n';
      	xml += '\t\t\t<dia:attribute name="name"><dia:string>#'+row.filename+'#</dia:string></dia:attribute>\n';
      	xml += '\t\t\t<dia:attribute name="visible_attributes"><dia:boolean val="true"/></dia:attribute>\n';
      	xml += '\t\t\t<dia:attribute name="attributes">\n';
			lastName = row.filename;
		}
		
		xml += '\t\t\t\t<dia:composite type="umlattribute"><dia:attribute name="name"><dia:string>#'+row.colName+'#</dia:string></dia:attribute></dia:composite>\n';
	}
	
	xml += '\t\t\t</dia:attribute>\n';
	xml += '\t\t</dia:object>\n';
	
	xml += '\t</dia:layer>\n';
	xml += '</dia:diagram>';
	
	fs.writeFileSync(filename, xml, 'utf8');
}








