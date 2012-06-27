var fs = require('fs');

exports.findPlan = function (type, directory) {
	var files = [];
	var scan = function (d) {
		var stats = fs.statSync(d)
		if (stats.isFile()) {
			var filename = d.split('/').pop();
			if (filename.toLowerCase() == type) files.push(d);
		} else if (stats.isDirectory()) {
			var f = fs.readdirSync(d);
			for (var i = 0; i < f.length; i++) scan(d+'/'+f[i]);
		}
	}
	scan(directory);
	return files;
}

exports.importw = function(filename) {
	console.log('---------------------------');
	console.log(filename);
	
	var unknown = [];
	var f = getPlanFile(filename);
	var fileSize = fs.statSync(filename).size;
	
	var headerSize = f.readInteger(2);
	
	f.readBytes('04 00');
	
	var version = f.readInteger(2);
	console.log('Version: '+version);
	
	var creationDate = f.readInteger(4);
	
	f.readBytes('20 20 20 20');
	f.readBytes('20 20 20 20');
	f.readBytes('20 20 20 20');
	f.readBytes('20 20 20');
	
	var n1, n2, n3;
	
	if (version == 0) {
		unknown.push(n1 = f.readInteger(2));
		unknown.push(n2 = f.readInteger(2));
		unknown.push(f.hexDump(8));
	} else {
		unknown.push(n1 = f.readInteger(4));
		unknown.push(n2 = f.readInteger(4));
		unknown.push(f.hexDump(10));
	}
	
	var desc = f.readString(headerSize - f.pos);
	
	var data1 = [];
	
	if (version == 0) {
		for (var i = 0; i < n2; i++) data1.push(f.readInteger(2));
	} else {
		for (var i = 0; i < n2; i++) data1.push(f.readInteger(4));
	}
	
	var data2 = [];
	for (var i = 0; i < n1; i++) data2.push(f.binDump(46));
	
	console.log(f.pos, fileSize-f.pos);
	
	f.check();
	
	
	exportCSV(filename+'1.csv', data1);
	exportCSV(filename+'2.csv', data2);
}

exports.importb = function(filename) {
	console.log(filename);
	
	var unknown = [];
	var f = getPlanFile(filename);
	var fileSize = fs.statSync(filename).size;
	
	var headerSize = f.readInteger(2);
	
	f.readBytes('04 00 00 00');
	
	var creationDate = f.readInteger(4);
	
	f.readBytes('20 20 20 20');
	f.readBytes('20 20 20 20');
	f.readBytes('20 20 20 20');
	f.readBytes('20 20 20 02 00');
	
	var n1 = f.readInteger(4);
	var n2 = f.readInteger(4);
	var n3 = f.readInteger(4);
	
	f.readBytes('33 00 00 00');
	
	var text = f.readString(47);
	
	unknown.push(f.readInteger(2));
	unknown.push(f.readInteger(2));
	unknown.push(f.readInteger(2));
	
	var desc = f.readString(headerSize-96);
	
	var data1 = []
	for (var i = 0; i < n2; i++) {
		data1[i] = [];
		data1[i][0] = f.readInteger(2);
		data1[i][1] = f.readInteger(2);
		data1[i][2] = f.readInteger(2);
		data1[i][3] = f.readInteger(4);
		data1[i][4] = f.readInteger(4);
	}
	
	var data2 = []
	for (var i = 0; i < n3; i++) {
		data2[i] = [];
		data2[i][0] = f.readInteger(4);
		data2[i][1] = f.readInteger(4);
	}
	
	for (var i = 0; i < n3; i++) data2[i][2] = f.readNullString();
	
	f.check();
	
	exportCSV(filename+'1.csv', data1);
	exportCSV(filename+'2.csv', data2);
}

exports.importbz = function(filename) {
	console.log(filename);
	
	var unknown = [];
	var f = getPlanFile(filename);
	var fileSize = fs.statSync(filename).size;
	
	var headerSize = f.readInteger(2);
	
	f.readBytes('04 00 00 00');
	var creationDate = f.readInteger(4);
	
	var n1;
	unknown.push(f.readInteger(4));
	unknown.push(f.hexDump(6));
	unknown.push(n1 = f.readInteger(4));
	unknown.push(f.readInteger(4));
	unknown.push(f.hexDump(4));
	
	var desc = f.readString(headerSize-32);
	
	var data1 = [];
	for (var i = 0; i < n1; i++) {
		data1[i] = [];
		data1[i][0] = f.readInteger(4);
		data1[i][1] = f.readInteger(2);
	}
	
	// Magic
	var n = (fileSize - f.pos)/4;
	var s = '';
	for (var i = 0; i < n; i++) {
		s += f.binDump(8);
	}
	
	//s = s.split('').join('\t');
	fs.writeFileSync(filename+'.raw', s);
	// magic out
	
	console.log(f.pos, fileSize - f.pos);
	
	console.log(desc);
	console.log(unknown);
	//f.check();
}

exports.importkgeo = function(filename) {
	console.log(filename);
	
	var unknown = [];
	var f = getPlanFile(filename);
	var fileSize = fs.statSync(filename).size;
	
	var headerSize = f.readInteger(2);
	
	f.readBytes('04 00 00 00');
	var creationDate = f.readInteger(4);
	var count1 = f.readInteger(4);
	unknown.push(f.readInteger(2));
	f.readBytes('00 00 00 00');
	unknown.push(f.readInteger(2));
	unknown.push(f.readInteger(2));
	var desc = f.readString(headerSize-24);
	
	var data = new Array(count1);
	for (var i = 0; i < count1; i++) data[i] = [];
	for (var i = 0; i < count1; i++) data[i][0] = f.readInteger(-2);
	for (var i = 0; i < count1; i++) data[i][1] = f.readInteger(-2);
	for (var i = 0; i < count1; i++) data[i][0] = (data[i][0]*1000 + f.readInteger(-2))/100000;
	for (var i = 0; i < count1; i++) data[i][1] = (data[i][1]*1000 + f.readInteger(-2))/100000;
	
	f.check();
	exportCSV(filename+'.csv', data);
}

function getPlanFile(filename) {
	var me = this;
	me.buffer = fs.readFileSync(filename);
	me.length = me.buffer.length;
	me.pos = 0;
	
	me.readInteger = function(n) {
		switch (n) {
			case  1: return me._readByte();
			case  2: return me._readWord();
			case -2: return me._readWord(true);
			case  4: return me._readLong();
			default: console.error('################ ERROR: Vermisse die Anzahl der Bytes');
		}
	}
	
	me.readString = function(n) {
		var p = me.pos;
		me.pos += n;
		return me.buffer.toString('binary', p, p+n);
	}
	
	me.readNullString = function() {
		var s = me.pos;
		var n = s;
		for (var i = s; i < me.buffer.length; i++) {
			if (me.buffer.readUInt8(i) == 0) {
				n = i - s;
				me.pos = i+1;
				break;
			}
		}
		return me.buffer.toString('binary', s, s + n);
	}
	
	me.readBytes = function(text) {
		text = text.split(' ');
		for (var i = 0; i < text.length; i++) {
			var v1 = parseInt(text[i], 16);
			var v2 = me._readByte();
			if (v1 != v2) console.error('################ ERROR: Bytes sind nicht identisch');
		}
	}
	
	me._readLong = function() {
		var p = me.pos;
		me.pos += 4;
		return me.buffer.readUInt32LE(p);
	}
	
	me._readWord = function(signed) {
		var p = me.pos;
		me.pos += 2;
		if (signed) {
			return me.buffer.readInt16LE(p);
		} else {
			return me.buffer.readUInt16LE(p);
		}
	}
	
	me._readByte = function() {
		var p = me.pos;
		me.pos += 1;
		return me.buffer.readUInt8(p);
	}
	
	me.hexDump = function(n) {
		var n = Math.min(n, me.length - me.pos);
		var s = [];
		for (var i = 0; i < n; i++) {
			var v = me._readByte();
			s.push(clamp('000'+v.toString(16), 2));
		}
		return s.join(' ');
	}
	
	me.binDump = function(n) {
		var n = Math.min(n, me.length - me.pos);
		var s = '';
		for (var i = 0; i < n; i++) {
			var v = me._readByte();
			s += '';
			for (var j = 0; j < 8; j++) {
				s += ((v > 127) ? 'l' : '0');
				v = (v & 0x7F) << 1;
			}
		}
		return s;
	}
	
	me.outputHexDump = function(n) {
		console.warn(hexDump(n));
	}
	
	me.outputHexDump2 = function(n) {
		var n = Math.min(n, me.length - me.pos);
		var l1 = '', l2 = '', l3 = '';
		for (var i = 0; i < n; i++) {
			var v = me._readByte();
			l1 += '   '+ (((v >= 32) && (v < 127)) ? String.fromCharCode(v) : '#');
			l2 += '  ' + clamp('000'+v.toString(16), 2);
			l3 += ' '  + clamp('   '+v, 3);
		}
		console.warn(l1);
		console.warn(l2);
		console.warn(l3);
		console.info('');
	}
	
	me.check = function () {
		if (me.pos < me.length) {
			me.outputHexDump2(40);
		}
	}
	
	return me;
}

function clamp(text, l) {
	return text.substr(text.length-l);
}

function exportCSV(filename, data) {
	var a = [];
	if (Object.prototype.toString.call(data[0]) === '[object Array]') {
		for (var i = 0; i < data.length; i++) {
			a.push(data[i].join(';').replace(/\./g, ','));
		}
	} else {
		a = data;
	}
	fs.writeFileSync(filename, a.join('\n'), 'binary');
}