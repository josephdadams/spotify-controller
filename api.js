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
				spotify.play();
				res.send({status: 'playing'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/playTrack/:track', function (req, res) {
			if (config.get('allowControl')) {
				let track = req.params.track;
				if (track.indexOf('spotify:track:') == -1) {
					track = 'spotify:track:' + track;
				}
				spotify.playTrack(track);
				res.send({status: 'playing'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/playTrackInContext/:track/:album', function (req, res) {
			if (config.get('allowControl')) {
				let track = req.params.track;
				let album = req.params.album;
				if (track.indexOf('spotify:track:') == -1) {
					track = 'spotify:track:' + track;
				}
				if (album.indexOf('spotify:album:') == -1) {
					album = 'spotify:album:' + album;
				}
				spotify.playTrackInContext(track, album);
				res.send({status: 'playing'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/pause', function (req, res) {
			if (config.get('allowControl')) {
				spotify.pause();
				res.send({status: 'paused'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/playToggle', function (req, res) {
			if (config.get('allowControl')) {
				spotify.playPause();
				res.send({status: 'play-pause-toggled'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/next', function (req, res) {
			if (config.get('allowControl')) {
				spotify.next();
				res.send({status: 'next'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/previous', function (req, res) {
			if (config.get('allowControl')) {
				spotify.previous();
				res.send({status: 'previous'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/volumeUp', function (req, res) {
			if (config.get('allowControl')) {
				spotify.volumeUp();
				res.send({status: 'volume-up'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/volumeDown', function (req, res) {
			if (config.get('allowControl')) {
				spotify.volumeDown();
				res.send({status: 'volume-down'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/setVolume/:volume', function (req, res) {
			if (config.get('allowControl')) {
				spotify.setVolume(req.params.volume);
				res.send({status: 'setvolume'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/mute', function (req, res) {
			if (config.get('allowControl')) {
				spotify.muteVolume();
				res.send({status: 'volume-mute'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/unmute', function (req, res) {
			if (config.get('allowControl')) {
				spotify.unmuteVolume();
				res.send({status: 'volume-unmute'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/repeatOn', function (req, res) {
			if (config.get('allowControl')) {
				spotify.setRepeating(true);
				res.send({status: 'repeat-on'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/repeatOff', function (req, res) {
			if (config.get('allowControl')) {
				spotify.setRepeating(false);
				res.send({status: 'repeat-off'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/repeatToggle', function (req, res) {
			if (config.get('allowControl')) {
				spotify.toggleRepeating();
				res.send({status: 'repeat-toggle'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/shuffleOn', function (req, res) {
			if (config.get('allowControl')) {
				spotify.setShuffling(true);
				res.send({status: 'shuffle-on'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/shuffleOff', function (req, res) {
			if (config.get('allowControl')) {
				spotify.setShuffling(false);
				res.send({status: 'shuffle-off'});
			}
			else {
				res.send({status: 'not-allowed'});
			}
		});

		server.get('/shuffleToggle', function (req, res) {
			if (config.get('allowControl')) {
				spotify.toggleShuffling();
				res.send({status: 'shuffle-toggle'});
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
					spotify.play();
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('pause', function () {
				if (config.get('allowControl')) {
					spotify.pause();
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('playToggle', function () {
				if (config.get('allowControl')) {
					spotify.playPause();
				}
				else {
					socket.emit('control_status', false);
				}
			});

			socket.on('playtrack', function (track) {
				if (config.get('allowControl')) {
					if (track.indexOf('spotify:track:') == -1) {
						track = 'spotify:track:' + track;
					}
					spotify.playTrack(track);
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('playtrackincontext', function (track, album) {
				if (config.get('allowControl')) {
					if (track.indexOf('spotify:track:') == -1) {
						track = 'spotify:track:' + track;
					}
					if (album.indexOf('spotify:album:') == -1) {
						album = 'spotify:album:' + album;
					}
					spotify.playTrackInContext(track, album);
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('next', function () {
				if (config.get('allowControl')) {
					spotify.next();
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('previous', function () {
				if (config.get('allowControl')) {
					spotify.previous();
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('volumeUp', function () {
				if (config.get('allowControl')) {
					spotify.volumeUp();
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('volumeDown', function () {
				if (config.get('allowControl')) {
					spotify.volumeDown();
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('setVolume', function (volume) {
				if (config.get('allowControl')) {
					spotify.setVolume(req.params.volume);
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('mute', function () {
				if (config.get('allowControl')) {
					spotify.muteVolume();
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('unmute', function () {
				if (config.get('allowControl')) {
					spotify.unmuteVolume();
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('repeatOn', function () {
				if (config.get('allowControl')) {
					spotify.setRepeating(true);
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('repeatOff', function () {
				if (config.get('allowControl')) {
					spotify.setRepeating(false);
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('repeatToggle', function () {
				if (config.get('allowControl')) {
					spotify.toggleRepeating();
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('shuffleOn', function () {
				if (config.get('allowControl')) {
					spotify.setShuffling(true);
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('shuffleOff', function () {
				if (config.get('allowControl')) {
					spotify.setShuffling(false);
				}
				else {
					socket.emit('control_status', false);
				}
			});
	
			socket.on('shuffleToggle', function () {
				if (config.get('allowControl')) {
					spotify.toggleShuffling();
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