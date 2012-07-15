"use strict";

var fs = require('fs');
var path = require('path');


function PlanFile(filename) {
	var me = this;
	me.buffer = fs.readFileSync(filename);
	me.length = me.buffer.length;
	me.pos = 0;
	
	me.readInteger = function(n) {
		switch (n) {
			case  1: return _readByte();
			case -1: return _readByte(true);
			case  2: return _readWord();
			case -2: return _readWord(true);
			case  3: return _readWord() + _readByte()*0x10000;
			case  4: return _readLong();
			case -4: return _readLong(true);
			default: console.error('################ ERROR: Vermisse die Anzahl der Bytes');
		}
	}
	
	me.readString = function(n, movePointer) {
		var p = me.pos;
		if (movePointer !== false) me.pos += n;
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
	
	me.checkBytes = function(text) {
		text = text.split(' ');
		for (var i = 0; i < text.length; i++) {
			var v1 = parseInt(text[i], 16);
			var v2 = _readByte();
			if (v1 != v2) console.error('################ ERROR: Bytes sind nicht identisch');
		}
	}
	
	me.readTimestamp = function() {
		return (new Date(_readLong()*1000)).toJSON();
	}
	
	function _readLong(signed) {
		var p = me.pos;
		me.pos += 4;
		if (signed) {
			return me.buffer.readInt32LE(p);
		} else {
			return me.buffer.readUInt32LE(p);
		}
	}
	
	function _readWord(signed) {
		var p = me.pos;
		me.pos += 2;
		if (signed) {
			return me.buffer.readInt16LE(p);
		} else {
			return me.buffer.readUInt16LE(p);
		}
	}
	
	function _readByte(signed) {
		var p = me.pos;
		me.pos += 1;
		if (signed) {
			return me.buffer.readInt8(p);
		} else {
			return me.buffer.readUInt8(p);
		}
	}
	
	function _clamp(text, l) {
		return text.substr(text.length-l);
	}
	
	me.readHexDump = function(n) {
		//n = Math.min(n, me.length - me.pos);
		var s = [];
		for (var i = 0; i < n; i++) {
			var v = _readByte();
			s.push(_clamp('000'+v.toString(16), 2));
		}
		return s.join(' ');
	}
	
	me.getAsHexDump = function(v) {
		//n = Math.min(n, me.length - me.pos);
		return _clamp('000'+v.toString(16), 2);
	}
	
	me.readBinDump = function(n) {
		var p = 0;
		if (n < 1000) {
			var a = new Array(n*8);
			for (var i = 0; i < n; i++) {
				var v = _readByte();
				for (var j = 0; j < 8; j++) {
					a[p] = (v > 127) ? 'l' : '0';
					p++;
					v = (v & 0x7F) << 1;
				}
			}
			return a.join('');
		} else {
			var b = new Buffer(n*8);
			for (var i = 0; i < n; i++) {
				var v = _readByte();
				for (var j = 0; j < 8; j++) {
					b.writeUInt8((v > 127) ? 108 : 48, p);
					p++;
					v = (v & 0x7F) << 1;
				}
			}
			return b.toString('binary');
		}
	}
	
	me.getAsBinDump = function(v) {
		var s = '';
		for (var j = 0; j < 8; j++) {
			s += (v > 127) ? 'l' : '0';
			v = (v & 0x7F) << 1;
		}
		return s;
	}
	
	me.check = function (outputFile) {
		var filename1 = outputFile+'_rest.raw';
		var filename2 = outputFile+'_rest.bin.raw';
		ensureFolderFor(filename1);
		ensureFolderFor(filename2);
		
		if (me.pos < me.length) {
			var n = me.length - me.pos;
			fs.writeFileSync(filename1, me.readString(n, false), 'binary');
			fs.writeFileSync(filename2, me.readBinDump(n), 'binary');
			console.log('WARNING: Still "'+n+'" bytes left!');
			return n;
		} else {
			if (fs.existsSync(filename1)) fs.unlinkSync(filename1);
			if (fs.existsSync(filename2)) fs.unlinkSync(filename2);
		}
	}
	
	return me;
}


function validityToDate(d) {
	// validity is given as the number of days since Dec 31, 1979
	var start = new Date(1979,11,31);
	var realDate = new Date(start.getTime() + d * 86400000);
	return realDate.toDateString();
}


function exportHeader(outputFile, data) {
	var filename = outputFile+'_header.json';
	ensureFolderFor(filename);
	if (data.validityBegin)
		data.validityBegin = validityToDate(data.validityBegin);
	if (data.validityEnd)
		data.validityEnd = validityToDate(data.validityEnd);
	fs.writeFileSync(filename, JSON.stringify(data, null, '\t'), 'utf8');
}

function exportTSV(outputFile, listName, data) {
	var a = [];
	if (Object.prototype.toString.call(data[0]) === '[object Array]') {
		for (var i = 0; i < data.length; i++) {
			var r = data[i];
			a.push(r.join('\t'));
		}
	} else {
		a = data;
	}
	var filename = outputFile+'_'+listName+'.tsv';
	ensureFolderFor(filename);
	fs.writeFileSync(filename, a.join('\n'), 'binary');
}

function exportJSON(outputFile, listName, data) {
	// JSON-Object in node.js fliegt manchmal auseinander. Deswegen hier per Hand:
	
	var createJSON = function (obj, indent) {
		var typ = Object.prototype.toString.call(obj);
		switch (typ) {
			case '[object Array]':
				if (obj.length == 0) return '[]';
				var a = [];
				for (var i = 0; i < obj.length; i++)  {
					a[i] = createJSON(obj[i], indent+'\t');
				}
				if (indent === undefined) {
					return '['+a.join(',')+']';
				} else {
					return '[\r\t' + indent + a.join(',\r\t'+indent) + '\r' + indent + ']';
				}
			break;
			case '[object Object]':
				var a = [];
				for (var i in obj) if (obj.hasOwnProperty(i)) {
					a.push('"'+i+'":'+createJSON(obj[i], indent));
				}
				return '{'+a.join(',')+'}';
			break;
			case '[object Number]':
				return ''+obj;
			break;
			case '[object String]':
				return '"' + obj.replace(/\"/g, '\\"') + '"';
			break;
			default:
				console.log('What is "'+typ+'"?');
		} 
	}
	var filename = outputFile+'_'+listName+'.json';
	ensureFolderFor(filename);
	fs.writeFileSync(filename, createJSON(data, ''), 'utf8');
}

function ensureFolderFor(filename) {
	var dirname = path.dirname(filename);
	if (!fs.existsSync(dirname)) {
		ensureFolderFor(dirname);
		fs.mkdirSync(dirname);
	}
}

exports.PlanFile = PlanFile;
exports.exportHeader = exportHeader;
exports.exportTSV = exportTSV;
exports.exportJSON = exportJSON;



var BufferedWriter = function (filename) {
	var BUFFER_SIZE = 0x4000;
	
	var me = this;
	var fd = fs.openSync(filename, 'w');
	var sBuf = '';
	
	function flush() {
		var buf = new Buffer(sBuf, 'utf8');
		fs.writeSync(fd, buf, 0, buf.length, null);
		sBuf = '';
	}
	
	me.write = function (text) {
		sBuf += text;
		if (sBuf.length > BUFFER_SIZE) flush();
	}
	
	me.close = function () {
		flush();
		fs.closeSync(fd);
	}
	
	return me;
};
