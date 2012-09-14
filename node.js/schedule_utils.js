

exports.prettyW = function(validityBegin, bitset) {
	if (bitset == 'all')
		return ['immer'];
	
	var patterns = {
		'Mo-Fr': '0lllll0',
		'Mo-Sa': '0llllll',
		'Sa,So': 'l00000l',
		'Fr,Sa': '00000ll',
		'Fr,So': 'l0000l0',
		'Sa':    '000000l',
		'So':    'l000000',
		'all':   'lllllll',
		'none':  '0000000'
	};
	
	var iDate = validityBegin;
	var i = validityBegin.getDay();
	if (i > 0) {
		iDate = new Date(validityBegin.getTime() + ((7-validityBegin.getDay()) * 86400000));
	}
	
	var dateDescription = [];
	
	var lastPattern = 0;
	
	while (i < bitset.length) {
		var week = bitset.substr(i, 7);
		
		var thisPattern = [0, 0];
		
		var differences = {};
		for (var p in patterns) {
			var pattern = patterns[p];
			differences[p] = [];
			
			for (var j = 0; j < 7; ++j) {
				if (week[j] != pattern[j]) {
					differences[p].push(new Date(validityBegin.getTime() + (i + j) * 86400000));
				}
			}
			if (differences[p].length === 0) {
				thisPattern = [p, 0];
				break;
			}
		}
		
		if (!thisPattern[0]) {
			for (var p in patterns) {
				if (differences[p].length == 1) {
					thisPattern = [p, differences[p][0]];
				}
			}
		}
		
		if (thisPattern[0]) {
			if (thisPattern != lastPattern) {
				if (thisPattern[0] == lastPattern[0]) {
					if (thisPattern[1])
						dateDescription.push(thisPattern[1].toDateString());
				} else {
					if (thisPattern[1])
						dateDescription.push([thisPattern[0], 'not', thisPattern[1].toDateString()]);
					else
						dateDescription.push([thisPattern[0], 'from', (new Date(validityBegin.getTime() + i * 86400000)).toDateString()]);
				}
				lastPattern = thisPattern;
			}
		} else {
			for (var j = 0; j < 7; ++j) {
				if (pattern[j]) {
					var d = new Date(validityBegin.getTime() + (i + j) * 86400000);
					dateDescription.push([d.toDateString()]);
				}
			}
			lastPattern = [0,0];
		}
		
		i += 7;
	}
	
	return dateDescription;
};

exports._clamp = function(text, l) {
	return text.substr(text.length-l);
};

exports._findOneValidDay = function(bitset) {
	if (bitset == 'all')
		return 0;
	
	// TODO make start day flexible
	var validityBegin = new Date(2011,11,11);
	for (var i = 0; i < bitset.length; ++i) {
		if (bitset[i] == 'l')
			return new Date(validityBegin.getTime() + i * 86400000);
	}
	return 0;
};

exports.prettyTime = function (mins) {
	if (mins == -1)
		return -1;
	
	// TODO: understand and handle this bit:
	//   for the moment we just ignore it
	mins &= ~0x800;
	
	var mm = mins % 60;
	var hh = (mins - mm) / 60;
	return exports._clamp('00' + hh, 2) + ":" + exports._clamp('00' + mm, 2);
};
