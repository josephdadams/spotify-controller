var spotify = require('spotify-node-applescript')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')

const config = require('./config.js')

const package_json = require('./package.json')
const VERSION = package_json.version

const osascript = require('osascript-promise')

var server = null
var httpServer = null
var io = null

const os = require('os')
const { exec } = require('child_process')

const isMac = os.platform() === 'darwin'
const isWindows = os.platform() === 'win32'

function openSpotifyUri(uri) {
	if (isWindows) {
		exec(`start ${uri}`, (err) => {
			if (err) console.error('Failed to open Spotify URI:', err)
		})
	}
}

function updateClients() {
	io.sockets.emit('state_change', STATUS)
	io.sockets.emit('ramping_state', global.RAMPING)
}

function getState() {
	updateClients()

	spotify.getState(function (err, state) {
		if (state && state.position) {
			STATUS.playbackInfo.playbackPosition = state.position
			STATUS.state = state
			//STATUS.playbackInfo.playerState = state.state;

			spotify.isRepeating(function (err, repeating) {
				STATUS.state.isRepeating = repeating

				spotify.isShuffling(function (err, shuffling) {
					STATUS.state.isShuffling = shuffling

					updateClients()
				})
			})
		}
		return state
	})
}

function rampVolume(volume, changePercent = 5, rampTime = 3) {
	if (global.RAMPING == true) {
		//currently ramping, cannot ramp again
		return
	} else {
		global.RAMPING = true
		//STATUS.playbackInfo.playerState = `Ramping Volume to ${volume}`;
		updateClients()

		let rampScript = `tell application "Spotify"
			set currentVolume to get sound volume
			set desiredVolume to ${volume}

			set changePercent to ${changePercent}

			if changePercent < 1 then
				set changePercent to 1 --wanting to avoid a divide by zero error
			end if

			set rampTime to ${rampTime}

			--to avoid a negative delay, we need to know which is higher
			set higherVolume to currentVolume
			set lowerVolume to desiredVolume

			if lowerVolume > higherVolume then
				set higherVolume to desiredVolume
				set lowerVolume to currentVolume
			end if

			set totalSteps to (higherVolume - lowerVolume) / changePercent

			if totalSteps < 1 then
				set totalSteps to 1 --wanting to avoid a divide by zero error
			end if

			set delayTime to rampTime / totalSteps

			if delayTime < 0.1 then
				set delayTime to 0.1 --cant have delay time less than .1 second
			end if

			--display dialog "Ramping Volume from " & currentVolume & " to " & desiredVolume & " over " & rampTime & " seconds with " & totalSteps & " steps: " & delayTime buttons {"OK"} default button 1 with icon 1 giving up after 5
			
			if currentVolume < desiredVolume then
				repeat while currentVolume < desiredVolume
					if currentVolume > desiredVolume then
						set sound volume to desiredVolume
					else
						set sound volume to currentVolume + changePercent
					end if
					set currentVolume to get sound volume
					delay delayTime
				end repeat
			else
				repeat while currentVolume > desiredVolume
					if currentVolume < desiredVolume then
						set sound volume to desiredVolume
					else
						set sound volume to currentVolume - changePercent
					end if
					set currentVolume to get sound volume
					delay delayTime
				end repeat
			end if
			set sound volume to desiredVolume
			
		end tell`

		return osascript(rampScript).then(function (response) {
			global.RAMPING = false
			updateClients()
			getState()
			return response
		})
	}
}

function movePlayerPosition(seconds) {
	let positionScript = `tell application "Spotify"
		set currentPosition to get player position
		set desiredPosition to (currentPosition + ${seconds})
		set player position to desiredPosition
	end tell`

	STATUS.playbackInfo.playerState = `Moving Player Position ${seconds} seconds`

	return osascript(positionScript).then(function (response) {
		return response
	})
}

function setPlayerPosition(seconds) {
	let positionScript = `tell application "Spotify"
		set desiredPosition to ${seconds}
		set player position to desiredPosition
	end tell`

	STATUS.playbackInfo.playerState = `Setting Player Position ${seconds} seconds`

	return osascript(positionScript).then(function (response) {
		return response
	})
}

module.exports = {
	start: function (port) {
		//starts the REST API
		server = express()

		httpServer = new http.Server(server)
		io = new socketio.Server(httpServer, { allowEIO3: true })

		server.get('/version', function (req, res) {
			res.send({ version: VERSION })
		})

		server.get('/control_status', function (req, res) {
			res.send({ control_status: config.get('allowControl') })
		})

		server.get('/state', function (req, res) {
			res.send({ playbackInfo: STATUS.playbackInfo, state: STATUS.state })
		})

		server.get('/play', function (req, res) {
			if (config.get('allowControl')) {
				try {
					if (isMac) {
						spotify.play()
					} else if (isWindows) {
						openSpotifyUri('spotify:app')
					}
					res.send({ status: 'playing' })
				} catch (error) {
					res.send({ error: error })
				}
			} else {
				res.send({ status: 'not-allowed' })
			}
		})

		server.get('/playTrack/:track', function (req, res) {
			if (config.get('allowControl')) {
				try {
					let track = req.params.track
					if (isMac) {
						spotify.playTrack(track)
					} else if (isWindows) {
						openSpotifyUri(`spotify:track:${track}`)
					}
					res.send({ status: 'playing' })
				} catch (error) {
					res.send({ error: error })
				}
			} else {
				res.send({ status: 'not-allowed' })
			}
		})

		server.get('/playTrackInContext/:track/:context', function (req, res) {
			if (config.get('allowControl')) {
				try {
					let track = req.params.track
					let context = req.params.context
					if (isMac) {
						spotify.playTrackInContext(track, context)
					} else if (isWindows) {
						openSpotifyUri(`spotify:${context}:${track}`)
					}
					res.send({ status: 'playing' })
				} catch (error) {
					res.send({ error: error })
				}
			} else {
				res.send({ status: 'not-allowed' })
			}
		})

		server.get('/pause', function (req, res) {
			if (config.get('allowControl')) {
				try {
					if (isMac) {
						spotify.pause()
						res.send({ status: 'paused' })
					} else if (isWindows) {
						res.send({ error: 'Pause not supported on Windows.' })
					}
				} catch (error) {
					res.send({ error: error })
				}
			} else {
				res.send({ status: 'not-allowed' })
			}
		})

		server.get('/playToggle', function (req, res) {
			if (config.get('allowControl')) {
				try {
					if (isMac) {
						spotify.playPause()
						res.send({ status: 'play-pause-toggled' })
					} else if (isWindows) {
						res.send({ error: 'Play/Pause toggle not supported on Windows.' })
					}
				} catch (error) {
					res.send({ error: error })
				}
			} else {
				res.send({ status: 'not-allowed' })
			}
		})

		server.get('/movePlayerPosition/:seconds', function (req, res) {
			if (config.get('allowControl')) {
				try {
					if (isMac) {
						movePlayerPosition(req.params.seconds)
						res.send({ status: 'player-position-changed' })
					} else if (isWindows) {
						res.send({ error: 'Seek not supported on Windows.' })
					}
				} catch (error) {
					res.send({ error: error })
				}
			} else {
				res.send({ status: 'not-allowed' })
			}
		})

		server.get('/setPlayerPosition/:seconds', function (req, res) {
			if (config.get('allowControl')) {
				try {
					if (isMac) {
						setPlayerPosition(req.params.seconds)
						res.send({ status: 'player-position-changed' })
					} else if (isWindows) {
						res.send({ error: 'Seek not supported on Windows.' })
					}
				} catch (error) {
					res.send({ error: error })
				}
			} else {
				res.send({ status: 'not-allowed' })
			}
		})

		server.get('/next', function (req, res) {
			if (config.get('allowControl')) {
				if (isMac) {
					spotify.next()
					res.send({ status: 'next' })
				} else if (isWindows) {
					res.send({ error: 'Next track not supported on Windows.' })
				}
			} else {
				res.send({ status: 'not-allowed' })
			}
		})

		server.get('/previous', function (req, res) {
			if (config.get('allowControl')) {
				if (isMac) {
					spotify.previous()
					res.send({ status: 'previous' })
				} else if (isWindows) {
					res.send({ error: 'Previous track not supported on Windows.' })
				}
			} else {
				res.send({ status: 'not-allowed' })
			}
		})

		server.get('/volumeUp', function (req, res) {
			if (config.get('allowControl')) {
				if (isMac && global.RAMPING == false) spotify.volumeUp()
				else return res.send({ error: 'Volume control not supported on this platform.' })
				res.send({ status: 'volume-up' })
			} else res.send({ status: 'not-allowed' })
		})

		server.get('/volumeDown', function (req, res) {
			if (config.get('allowControl')) {
				if (isMac && global.RAMPING == false) spotify.volumeDown()
				else return res.send({ error: 'Volume control not supported on this platform.' })
				res.send({ status: 'volume-down' })
			} else res.send({ status: 'not-allowed' })
		})

		server.get('/setVolume/:volume', function (req, res) {
			if (config.get('allowControl')) {
				if (isMac && global.RAMPING == false) spotify.setVolume(req.params.volume)
				else return res.send({ error: 'Volume control not supported on this platform.' })
				res.send({ status: 'setvolume' })
			} else res.send({ status: 'not-allowed' })
		})

		server.get('/rampVolume/:volume/:changepercent/:ramptime', function (req, res) {
			if (config.get('allowControl')) {
				if (isMac && global.RAMPING == false) {
					let volume = parseInt(req.params.volume)
					let changePercent = parseInt(req.params.changepercent)
					let rampTime = parseInt(req.params.ramptime)
					rampVolume(volume, changePercent, rampTime)
				} else return res.send({ error: 'Ramp volume not supported on this platform.' })
				res.send({ status: 'rampvolume' })
			} else res.send({ status: 'not-allowed' })
		})

		server.get('/mute', function (req, res) {
			if (config.get('allowControl')) {
				if (isMac) spotify.muteVolume()
				else return res.send({ error: 'Mute not supported on this platform.' })
				res.send({ status: 'volume-mute' })
			} else res.send({ status: 'not-allowed' })
		})

		server.get('/unmute', function (req, res) {
			if (config.get('allowControl')) {
				if (isMac) spotify.unmuteVolume()
				else return res.send({ error: 'Unmute not supported on this platform.' })
				res.send({ status: 'volume-unmute' })
			} else res.send({ status: 'not-allowed' })
		})

		server.get('/repeatOn', function (req, res) {
			if (config.get('allowControl')) {
				if (isMac) spotify.setRepeating(true)
				else return res.send({ error: 'Repeat not supported on this platform.' })
				res.send({ status: 'repeat-on' })
			} else res.send({ status: 'not-allowed' })
		})

		server.get('/repeatOff', function (req, res) {
			if (config.get('allowControl')) {
				if (isMac) spotify.setRepeating(false)
				else return res.send({ error: 'Repeat not supported on this platform.' })
				res.send({ status: 'repeat-off' })
			} else res.send({ status: 'not-allowed' })
		})

		server.get('/repeatToggle', function (req, res) {
			if (config.get('allowControl')) {
				if (isMac) spotify.toggleRepeating()
				else return res.send({ error: 'Repeat toggle not supported on this platform.' })
				res.send({ status: 'repeat-toggle' })
			} else res.send({ status: 'not-allowed' })
		})

		server.get('/shuffleOn', function (req, res) {
			if (config.get('allowControl')) {
				if (isMac) spotify.setShuffling(true)
				else return res.send({ error: 'Shuffle not supported on this platform.' })
				res.send({ status: 'shuffle-on' })
			} else res.send({ status: 'not-allowed' })
		})

		server.get('/shuffleOff', function (req, res) {
			if (config.get('allowControl')) {
				if (isMac) spotify.setShuffling(false)
				else return res.send({ error: 'Shuffle not supported on this platform.' })
				res.send({ status: 'shuffle-off' })
			} else res.send({ status: 'not-allowed' })
		})

		server.get('/shuffleToggle', function (req, res) {
			if (config.get('allowControl')) {
				if (isMac) spotify.toggleShuffling()
				else return res.send({ error: 'Shuffle toggle not supported on this platform.' })
				res.send({ status: 'shuffle-toggle' })
			} else res.send({ status: 'not-allowed' })
		})

		server.use(function (req, res) {
			res.status(404).send({ error: true, url: req.originalUrl + ' not found.' })
		})

		io.sockets.on('connection', (socket) => {
			let ipAddr = socket.handshake.address
			socket.emit('control_status', config.get('allowControl'))

			socket.on('version', function () {
				socket.emit('version', VERSION)
			})

			socket.on('control_status', function () {
				socket.emit('control_status', config.get('allowControl'))
			})

			socket.on('state', function () {
				getState()
			})

			socket.on('play', function () {
				if (config.get('allowControl')) {
					if (isMac) spotify.play()
					else if (isWindows) openSpotifyUri('spotify:app')
					else socket.emit('error', 'Platform not supported')
				} else socket.emit('control_status', false)
			})

			socket.on('pause', function () {
				if (config.get('allowControl')) {
					if (isMac) spotify.pause()
					else socket.emit('error', 'Pause not supported on Windows')
				} else socket.emit('control_status', false)
			})

			socket.on('playToggle', function () {
				if (config.get('allowControl')) {
					if (isMac) spotify.playPause()
					else socket.emit('error', 'Play/Pause toggle not supported on Windows')
				} else socket.emit('control_status', false)
			})

			socket.on('movePlayerPosition', function (seconds) {
				if (config.get('allowControl')) {
					if (isMac) {
						movePlayerPosition(seconds)
						getState()
					} else socket.emit('error', 'Seek not supported on Windows')
				} else socket.emit('control_status', false)
			})

			socket.on('setPlayerPosition', function (seconds) {
				if (config.get('allowControl')) {
					if (isMac) {
						setPlayerPosition(seconds)
						getState()
					} else socket.emit('error', 'Seek not supported on Windows')
				} else socket.emit('control_status', false)
			})

			socket.on('playtrack', function (track) {
				if (config.get('allowControl')) {
					if (isMac) spotify.playTrack(track)
					else if (isWindows) openSpotifyUri(`spotify:track:${track}`)
					else socket.emit('error', 'Platform not supported')
				} else socket.emit('control_status', false)
			})

			socket.on('playtrackincontext', function (track, context) {
				if (config.get('allowControl')) {
					if (isMac) spotify.playTrackInContext(track, context)
					else if (isWindows) openSpotifyUri(`spotify:${context}:${track}`)
					else socket.emit('error', 'Platform not supported')
				} else socket.emit('control_status', false)
			})

			socket.on('next', function () {
				if (config.get('allowControl')) {
					if (isMac) spotify.next()
					else socket.emit('error', 'Next not supported on Windows')
				} else socket.emit('control_status', false)
			})

			socket.on('previous', function () {
				if (config.get('allowControl')) {
					if (isMac) spotify.previous()
					else socket.emit('error', 'Previous not supported on Windows')
				} else socket.emit('control_status', false)
			})

			socket.on('volumeUp', function () {
				if (config.get('allowControl')) {
					if (isMac && global.RAMPING == false) {
						spotify.volumeUp()
						getState()
					} else socket.emit('error', 'Volume control not supported on this platform')
				} else socket.emit('control_status', false)
			})

			socket.on('volumeDown', function () {
				if (config.get('allowControl')) {
					if (isMac && global.RAMPING == false) {
						spotify.volumeDown()
						getState()
					} else socket.emit('error', 'Volume control not supported on this platform')
				} else socket.emit('control_status', false)
			})

			socket.on('setVolume', function (volume) {
				if (config.get('allowControl')) {
					if (isMac && global.RAMPING == false) {
						spotify.setVolume(volume)
						getState()
					} else socket.emit('error', 'Volume control not supported on this platform')
				} else socket.emit('control_status', false)
			})

			socket.on('rampVolume', function (volume, changePercent, rampTime) {
				if (config.get('allowControl')) {
					if (isMac && global.RAMPING == false) {
						rampVolume(volume, changePercent, rampTime)
						getState()
					} else socket.emit('error', 'Ramp volume not supported on this platform')
				} else socket.emit('control_status', false)
			})

			socket.on('mute', function () {
				if (config.get('allowControl')) {
					if (isMac) {
						spotify.muteVolume()
						getState()
					} else socket.emit('error', 'Mute not supported on this platform')
				} else socket.emit('control_status', false)
			})

			socket.on('unmute', function () {
				if (config.get('allowControl')) {
					if (isMac) {
						spotify.unmuteVolume()
						getState()
					} else socket.emit('error', 'Unmute not supported on this platform')
				} else socket.emit('control_status', false)
			})

			socket.on('repeatOn', function () {
				if (config.get('allowControl')) {
					if (isMac) {
						spotify.setRepeating(true)
						getState()
					} else socket.emit('error', 'Repeat not supported on this platform')
				} else socket.emit('control_status', false)
			})

			socket.on('repeatOff', function () {
				if (config.get('allowControl')) {
					if (isMac) {
						spotify.setRepeating(false)
						getState()
					} else socket.emit('error', 'Repeat not supported on this platform')
				} else socket.emit('control_status', false)
			})

			socket.on('repeatToggle', function () {
				if (config.get('allowControl')) {
					if (isMac) {
						spotify.toggleRepeating()
						getState()
					} else socket.emit('error', 'Repeat toggle not supported on this platform')
				} else socket.emit('control_status', false)
			})

			socket.on('shuffleOn', function () {
				if (config.get('allowControl')) {
					if (isMac) {
						spotify.setShuffling(true)
						getState()
					} else socket.emit('error', 'Shuffle not supported on this platform')
				} else socket.emit('control_status', false)
			})

			socket.on('shuffleOff', function () {
				if (config.get('allowControl')) {
					if (isMac) {
						spotify.setShuffling(false)
						getState()
					} else socket.emit('error', 'Shuffle not supported on this platform')
				} else socket.emit('control_status', false)
			})

			socket.on('shuffleToggle', function () {
				if (config.get('allowControl')) {
					if (isMac) {
						spotify.toggleShuffling()
						getState()
					} else socket.emit('error', 'Shuffle toggle not supported on this platform')
				} else socket.emit('control_status', false)
			})
		})

		httpServer.listen(port)
		console.log('REST/Socket.io API server started on: ' + port)
	},

	sendUpdates: function () {
		getState()
	},

	sendControlStatus: function () {
		io.sockets.emit('control_status', config.get('allowControl'))
	},
}
