var
	exec = require('child_process').exec;


var fs = require('fs');

exports.Image = function (_width, _height, _colorCount, _antialias) {
	var me = this;
	
	var _byteDepth = 4;
	var _pixelSize = _colorCount*_byteDepth;
	var _xOffset = _pixelSize*_width;
	var _size = _xOffset*_height;
	var _pixelCount = _width*_height;
	var _valueCount = _pixelCount*_colorCount;
	var _buf = new Buffer(_size);
	
	function getValue(index) {
		var v = _buf.readFloatBE(index*_byteDepth);
		if (v < 0) v = 0;
		if (v > 1) v = 1;
		return v;
	}
	
	function setPixel(x, y, color, alpha) {
		var offset = y*_xOffset + x*_pixelSize;
		if ((alpha == 1) || (alpha === undefined)) {
			for (var i = 0; i < _colorCount; i++) _buf.writeFloatBE(color[i], offset + i*_byteDepth);
		} else {
			for (var i = 0; i < _colorCount; i++) {
				var v = _buf.readFloatBE(offset + i*_byteDepth);
				v = v*(1-alpha) + alpha*color[i];
				_buf.writeFloatBE(v, offset + i*_byteDepth);
			}
		}
	}
	 
	me.savePNG = function(filename, byteDepth) {
		if (byteDepth === undefined) byteDepth = 1;
		
		var tempFile = 'temp'+Math.random()+'.raw';
		me.saveRAW('./'+tempFile, byteDepth);
		var command = ['convert'];
		command.push('-size '+_width+'x'+_height);
		
		switch (byteDepth) {
			case 1: command.push('-depth 8');  break;
			case 2: command.push('-depth 16'); break;
			default:	console.error('Image.savePNG: Unknown byteDepth: '+byteDepth);
		}
		
		switch (_colorCount) {
			case 1: command.push('gray:'+tempFile); break;
			case 3: command.push( 'rgb:'+tempFile); break;
			default:	console.error('Image.savePNG: Unknown colorCount: '+_colorCount);
		}
		
		command.push(filename);
		command.push('; unlink '+tempFile);
		command.push('; exit');
		command = command.join(' ');
		//console.log(command);
		
		var child = exec(command, {detached:true}, function (error, stdout, stderr) {
			/*console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			*/
			if (error !== null) {
				console.log('exec error: ' + error);
			}
		});
	}
		
	getRAWBuffer = function(byteDepth) {
		if (byteDepth === undefined) byteDepth = 1;
		var tempBuffer = new Buffer(_valueCount*byteDepth);
		switch (byteDepth) {
			case 1:  for (var i = 0; i < _valueCount; i++) tempBuffer.writeUInt8(    Math.round(  255*getValue(i)), i  ); break;
			case 2:  for (var i = 0; i < _valueCount; i++) tempBuffer.writeUInt16BE( Math.round(65536*getValue(i)), i*2); break;
			default:	console.error('Image.getRAWBuffer: Unknown byteDepth');
		}
		return tempBuffer;
	}
		
	me.saveRAW = function(filename, byteDepth) {
		fs.writeFileSync(filename, getRAWBuffer(byteDepth));
	}
	
	me.drawFilledCircle = function(xc, yc, r, color, alpha) {
		if (alpha === undefined) alpha = 1;
		
		var x0 = Math.max(Math.floor(xc-r), 0);
		var y0 = Math.max(Math.floor(yc-r), 0);
		var x1 = Math.min(Math.ceil( xc+r), _width-1);
		var y1 = Math.min(Math.ceil( yc+r), _height-1);
		for (var y = y0; y <= y1; y++) {
			for (var x = x0; x <= x1; x++) {
				var d = Math.sqrt(square(x-xc)+square(y-yc));
				if (d < r-1) {
					setPixel(x, y, color, alpha);
				} else if (d < r+1) {
					var newAlpha = r-d+0.5;
					if (newAlpha > 1) newAlpha = 1;
					if (newAlpha > 0) setPixel(x, y, color, newAlpha*alpha);
				}
			}
		}
	}

	me.drawFilledRectangle = function (xr, yr, w, h, color, alpha) {
		if (alpha === undefined) alpha = 1;
		
		var x0 = Math.max(Math.floor(  xr), 0);
		var y0 = Math.max(Math.floor(  yr), 0);
		var x1 = Math.min(Math.ceil( xr+w), _width-1);
		var y1 = Math.min(Math.ceil( yr+h), _height-1);
		var xc = xr + w/2;
		var yc = yr + h/2;
		for (var y = y0; y <= y1; y++) {
			var alphaY = h/2 - Math.abs(y-yc);
			if (alphaY < 0) alphaY = 0;
			if (alphaY > 1) alphaY = 1;
			for (var x = x0; x <= x1; x++) {
				var alphaX = w/2 - Math.abs(x-xc);
				if (alphaX < 0) alphaX = 0;
				if (alphaX > 1) alphaX = 1;
				setPixel(x, y, color, alphaX*alphaY*alpha);
			}
		}
	}
	
	me.reset = function (color) {
		if (color === undefined) {
			me.resetBlack()
		} else {
			for (var y = 0; y < _height; y++) {
				for (var x = 0; x < _width; x++) {
					setPixel(x, y, color);
				}
			}
		}
	}
	
	me.resetBlack = function () {
		_buf.fill(0);
	}
	
	me.resetWhite = function (color) {
		for (var i = 0; i < _valueCount; i++) _buf.writeFloatBE(1, i*_byteDepth);
	}
}

function square(value) {
	return value*value;
}
