'use strict';

var win = nw.Window.get();

var cwd = process.cwd();
var fs = require('fs');

win.on('loaded', () => {
	if (/sdk/.test(process.versions['nw-flavor'])) win.showDevTools();
	app_init();
});

function app_init() {
	var cfg = nw.App.manifest['php-nwjs'];

	process.on('uncaughtException', (err) => {
		win.window.alert('Error: ' + err);
	});

	cfg.php_binary = cfg.php_binary || '';
	if(cfg.php_binary == '') {
		if(/^win/.test(require('os').platform())) {
			cfg.php_binary = cwd + '/bin/php/php-cgi.exe';
		} else {
			cfg.php_binary = cwd + '/bin/php/php-cgi';
		}
	}

  if (fs.statSync(cfg.php_binary)) {
  	try	{
  		fs.accessSync(cfg.php_binary, fs.constants.X_OK);
  	} catch(err) {
  		// throw alert('Error: PHP binary is not executable. ' + err);
  		fs.chmodSync(cfg.php_binary, 0o755);
  	}
  } else {
  	throw win.window.alert('Error: PHP binary not found');
  }

  cfg.server_protocol = cfg.server_protocol || 'http';
	cfg.server_host = cfg.server_host || 'localhost';
	cfg.server_port = cfg.server_port || 9090;
	cfg.htdocs = cfg.htdocs || (cfg.htdocs === '' ? './htdocs' : cfg.htdocs);

	run_server({
		'path': cfg.htdocs,
		'bin': cfg.php_binary,
		'host': cfg.server_host,
		'port': cfg.server_port,
		'server_protocol': cfg.server_protocol,
		'server_host': cfg.server_host,
		'server_port': cfg.server_port,
		'arguments': nw.App.argv,
		'manifest': nw.App.manifest
	});
}

function run_server(params) {
	var http = require('http');
	var php = require(cwd + '/lib/bridge');
	var express = require('express')();
	var server = http.createServer(express);

	express.use('/', php.cgi(params));

	server.listen(params.server_port, params.server_host, () => {
		win.window.location = params.server_protocol + '://' + params.server_host + ':' + params.server_port + '/';
	}).on('error', (err) => {
		win.window.alert('Error: ' + server.err);
	});
}
