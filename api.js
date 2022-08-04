var spotify = require('spotify-node-applescript');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const config = require('./config.js');

const package_json = require('./package.json');
const VERSION = package_json.version;

var server = null;
var httpServer = null;
var io = null;

function updateClients() {
	io.sockets.emit('state_change', STATUS);
}

function getState() {
	spotify.getState(function(err, state) {
		if (state && state.position) {
			STATUS.playbackInfo.playbackPosition = state.position;
			STATUS.state = state;
		}
		
		updateClients();
		return state;
	});
}

module.exports = {
	start: function(port) {
		//starts the REST API
		server = express();

		httpServer = new http.Server(server);
		io = new socketio.Server(httpServer, { allowEIO3: true });

		server.get('/version', function (req, res) {
			res.send({version: VERSION});
		});

		server.get('/control_status', function (req, res) {
			res.send({control_status: config.get('allowControl')});
		});

		server.get('/state', function (req, res) {
			res.send({playbackInfo: STATUS.playbackInfo, state: STATUS.state});
		});

		server.get('/play', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.play();
					res.send({status: 'playing'});
				}
				catch(error) {
					res.send({error: error});
				}	
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/playTrack/:track', function (req, res) {
			if (config.get('allowControl')) {
				try {
					let track = req.params.track;
					spotify.playTrack(track);
					res.send({status: 'playing'});
				}
				catch(error) {
					res.send({error: error});
				}		
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/playTrackInContext/:track/:context', function (req, res) {
			if (config.get('allowControl')) {
				try {
					let track = req.params.track;
					let context = req.params.context;
					spotify.playTrackInContext(track, context);
					res.send({status: 'playing'});
				}
				catch(error) {
					res.send({error: error});
				}				
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/pause', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.pause();
					res.send({status: 'paused'});
				}
				catch(error) {
					res.send({error: error});
				}	
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/playToggle', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.playPause();
					res.send({status: 'play-pause-toggled'});
				}
				catch(error) {
					res.send({error: error});
				}
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/next', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.next();
					res.send({status: 'next'});
				}
				catch(error) {
					res.send({error: error});
				}
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/previous', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.previous();
					res.send({status: 'previous'});
				}
				catch(error) {
					res.send({error: error});
				}
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/volumeUp', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.volumeUp();
					res.send({status: 'volume-up'});
				}
				catch(error) {
					res.send({error: error});
				}
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/volumeDown', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.volumeDown();
				res.send({status: 'volume-down'});
				}
				catch(error) {
					res.send({error: error});
				}				
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/setVolume/:volume', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.setVolume(req.params.volume);
					res.send({status: 'setvolume'});
				}
				catch(error) {
					res.send({error: error});
				}				
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/mute', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.muteVolume();
					res.send({status: 'volume-mute'});
				}
				catch(error) {
					res.send({error: error});
				}
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/unmute', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.unmuteVolume();
					res.send({status: 'volume-unmute'});
				}
				catch(error) {
					res.send({error: error});
				}
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/repeatOn', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.setRepeating(true);
					res.send({status: 'repeat-on'});
				}
				catch(error) {
					res.send({error: error});
				}
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/repeatOff', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.setRepeating(false);
					res.send({status: 'repeat-off'});
				}
				catch(error) {
					res.send({error: error});
				}				
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/repeatToggle', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.toggleRepeating();
					res.send({status: 'repeat-toggle'});
				}
				catch(error) {
					res.send({error: error});
				}
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/shuffleOn', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.setShuffling(true);
					res.send({status: 'shuffle-on'});
				}
				catch(error) {
					res.send({error: error});
				}
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/shuffleOff', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.setShuffling(false);
					res.send({status: 'shuffle-off'});
				}
				catch(error) {
					res.send({error: error});
				}
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/shuffleToggle', function (req, res) {
			if (config.get('allowControl')) {
				try {
					spotify.toggleShuffling();
					res.send({status: 'shuffle-toggle'});
				}
				catch(error) {
					res.send({error: error});
				}
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.use(function (req, res) {
			res.status(404).send({error: true, url: req.originalUrl + ' not found.'});
		});
		
		io.sockets.on('connection', (socket) => {
			let ipAddr = socket.handshake.address;
			socket.emit('control_status', config.get('allowControl'));

			socket.on('version', function() {
				socket.emit('version', VERSION);
			});

			socket.on('control_status', function() {
				socket.emit('control_status', config.get('allowControl'));
			});

			socket.on('state', function() {
				getState();
			});

			socket.on('play', function () {
				if (config.get('allowControl')) {
					try {
						spotify.play();
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('pause', function () {
				if (config.get('allowControl')) {
					try {
						spotify.pause();
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('playToggle', function () {
				if (config.get('allowControl')) {
					try {
						spotify.playPause();
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});

			socket.on('playtrack', function (track) {
				if (config.get('allowControl')) {
					try {
						spotify.playTrack(track);
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('playtrackincontext', function (track, context) {
				if (config.get('allowControl')) {
					try {
						spotify.playTrackInContext(track, context);
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('next', function () {
				if (config.get('allowControl')) {
					try {
						spotify.next();
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('previous', function () {
				if (config.get('allowControl')) {
					try {
						spotify.previous();
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('volumeUp', function () {
				if (config.get('allowControl')) {
					try {
						spotify.volumeUp();
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('volumeDown', function () {
				if (config.get('allowControl')) {
					try {
						spotify.volumeDown();
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('setVolume', function (volume) {
				if (config.get('allowControl')) {
					try {
						spotify.setVolume(volume);
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('mute', function () {
				if (config.get('allowControl')) {
					try {
						spotify.muteVolume();
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('unmute', function () {
				if (config.get('allowControl')) {
					try {
						spotify.unmuteVolume();
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('repeatOn', function () {
				if (config.get('allowControl')) {
					try {
						spotify.setRepeating(true);
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('repeatOff', function () {
				if (config.get('allowControl')) {
					try {
						spotify.setRepeating(false);
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('repeatToggle', function () {
				if (config.get('allowControl')) {
					try {
						spotify.toggleRepeating();
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('shuffleOn', function () {
				if (config.get('allowControl')) {
					try {
						spotify.setShuffling(true);
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('shuffleOff', function () {
				if (config.get('allowControl')) {
					try {
						spotify.setShuffling(false);
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('shuffleToggle', function () {
				if (config.get('allowControl')) {
					try {
						spotify.toggleShuffling();
					}
					catch(error) {
						socket.emit('error', error);
					}
				}
				else {
					socket.emit('control_status', false);
				}
			});
		});

		httpServer.listen(port);
		console.log('REST API server started on: ' + port);
	},

	sendUpdates: function() {
		getState();
	},

	sendControlStatus: function() {
		io.sockets.emit('control_status', config.get('allowControl'));
	}
}