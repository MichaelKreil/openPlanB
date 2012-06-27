var fs = require('fs');

var files = ['PLANATR','PLANATX','PLANATXD','PLANATXE','PLANATXF','PLANATXI','PLANB','PLANBETR','PLANBI','PLANBZ','PLANGAT','PLANGLS','PLANGRZ','PLANHOLI','PLANINFO','PLANITXT','PLANKANT','PLANKGEO','PLANKM','PLANLAUF','PLANLINE','PLANMETA','PLANMW','PLANNG','PLANRICH','PLANSORT','PLANSPR','PLANSZ','PLANTRF','PLANU','PLANUK','PLANVW','PLANW','PLANZUG','PLANZZ'];

for (var i = 0; i < files.length; i++) {
	createTxt(files[i]);
}


function createTxt(filename) {
	var buf = fs.readFileSync(filename);
	var result = filename+'\r\n';
	var n = Math.min(100, buf.length);

	for (var i = 0; i < n; i++) {
		var si = '00'+i;
		si = si.substr(si.length-2);
		
		var sn = '   '+buf[i];
		sn = sn.substr(sn.length-3);
		
		var sb = '00000000'+buf[i].toString(2);
		sb = sb.substr(sb.length-8);
		sb = sb.split('').reverse().join('');
		
		var sh = '00'+buf[i].toString(16);
		sh = sh.substr(sh.length-2).toUpperCase();
		
		result += si + '  ' + sh + '  ' + sb + '  ' + sn + '   "' + String.fromCharCode(buf[i]) + '"\r\n';
	}

	fs.writeFileSync(filename+'.txt', result);
}

function createRaw(filename) {
	var buf = fs.readFileSync(filename);
	var result = '';
	var n = buf.length;

	for (var i = 0; i < n; i++) {		
		var sb = '00000000'+buf[i].toString(2);
		sb = sb.substr(sb.length-8);
		sb = sb.split('').reverse().join('');
		sb = sb.replace(/1/g, 'l');
		
		result += sb;
	}

	fs.writeFileSync(filename+'.raw', result);
}
