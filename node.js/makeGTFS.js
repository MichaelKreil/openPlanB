var fs = require('fs');
var path = require('path');
var gtfsUtils = require('./gtfs_modules/gtfs_utils.js');

var config = fs.readFileSync('config.json', 'utf8');

config = JSON.parse(config);

config.decodeFolder = path.resolve(config.decodeFolder);
config.gtfsFolder   = path.resolve(config.gtfsFolder);

gtfsUtils.makeGTFS(config);
