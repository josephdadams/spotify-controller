# spotify-controller API

spotify-controller has both a REST-based API as well as a socket.io API. Both run on Port `8801`.

## REST API
All requests are HTTP GET.

* `/version`:

	Returns the version of spotify-controller currently running.
	```javascript
	{version: 0.1.0}
	```
* `/control_status`:

	Returns whether remote control is currently enabled or not in spotify-controller.
	```javascript
	{control_status: true}
	```

* `/state`:

	Returns the current playback state and track information.
	```javascript
	{
	playbackInfo: {
		album: 'Living Hope',
		albumArtist: 'Phil Wickham',
		artist: 'Phil Wickham',
		discNumber: 1,
		duration: 327000,
		hasArtwork: 1,
		name: 'Living Hope',
		playCount: 0,
		playbackPosition: 0.0430000014603138,
		playerState: 'Paused',
		popularity: 58,
		trackId: 'spotify:track:6nVm313QmsPlNllntTart1',
		trackNumber: 2
	},
	state: {
		track_id: 'spotify:track:6nVm313QmsPlNllntTart1',
		volume: 63,
		position: 0,
		state: 'paused'
  	}
	```

* `/play`:

	Starts playback.
	```javascript
	{status: 'playing'}
	```

* `/playTrack/[track]`:

	Plays back a specific track.
	[track] is the Spotify URI.
	```javascript
	{status: 'playing-track'}
	```

* `/playTrackInContext/[track]/[album]`:

	Plays the track in the context of an album.
	[track] is the Spotify URI for the track. [album] is the Album URI.
	```javascript
	{status: 'playing-track-in-context'}
	```

* `/pause`:

	Pausess playback.
	```javascript
	{status: 'paused'}
	```

* `/playToggle`:

	Toggles playback between play/pause.
	```javascript
	{status: 'play-pause-toggled'}
	```

* `/next`:

	Goes to next track.
	```javascript
	{status: 'next'}
	```

* `/previous`:

	Goes to previous track.
	```javascript
	{status: 'previous'}
	```

* `/volumeUp`:

	Turns volume up.
	```javascript
	{status: 'volume-up'}
	```

* `/volumeDown`:

	Turns volume down.
	```javascript
	{status: 'volume-down'}
	```

* `/setVolume/[volume]`:

	Sets volume level (0-100).
	```javascript
	{status: 'setvolume'}
	```

* `/rampVolume/[volume]`:

	Ramps volume level (0-100). First argument is the volume level as an integer. The volume will ramp in 5% increments every 0.25s until it reaches the desired level.
	```javascript
	{status: 'rampvolume'}
	```

* `/mute`:

	Mutes volume.
	```javascript
	{status: 'volume-mute'}
	```

* `/unmute`:

	Mutes volume.
	```javascript
	{status: 'volume-unmute'}
	```

* `/repeatOn`:

	Turns on repeating.
	```javascript
	{status: 'repeat-on'}
	```

* `/repeatOff`:

	Turns off repeating.
	```javascript
	{status: 'repeat-off'}
	```

* `/repeatToggle`:

	Toggles repeating on/off.
	```javascript
	{status: 'repeat-toggle'}
	```

* `/shuffleOn`:

	Turns on shuffling.
	```javascript
	{status: shuffle-on'}
	```

* `/shuffleOff`:

	Turns off shuffling.
	```javascript
	{status: shuffle-off'}
	```

* `/shuffleToggle`:

	Toggles shuffling on/off.
	```javascript
	{status: 'shuffle-toggle'}
	```

### Note
It is possible to disable remote control within the context menu of the spotify-controller application. If this is done, you will receive this response when using the REST API:
```javascript
{status: 'not-allowed'}
```

Errors may also be sent like this:
```javascript
{error: 'error message'}
```

## socket.io API

Upon connection, the server will emit the `control_status` event to let the client know whether or not remote control is available. This will be emitted any time it is changed. It can also be requested by the client at any time by emitting a `control_status` event. A boolean is returned, with `true` meaning it is enabled, and `false` being disabled.

* `version`:

	Returns the version of spotify-controller currently running.
	```javascript
	'0.1.0'
	```
* `control_status`:

	Returns whether remote control is currently enabled or not in spotify-controller. This will also be emitted on-demand if remote control is disabled at spotify-controller.
	```javascript
	true
	```

* `error`:

	Emitted whenever there is an error. Contains the error message as a string.

* `state`:

	Returns the current playback state and track information. This is automatically emitted to all connected clients any time there is a playback state change.
	```javascript
	{
	playbackInfo: {
		album: 'Living Hope',
		albumArtist: 'Phil Wickham',
		artist: 'Phil Wickham',
		discNumber: 1,
		duration: 327000,
		hasArtwork: 1,
		name: 'Living Hope',
		playCount: 0,
		playbackPosition: 0.0430000014603138,
		playerState: 'Paused',
		popularity: 58,
		trackId: 'spotify:track:6nVm313QmsPlNllntTart1',
		trackNumber: 2
	},
	state: {
		track_id: 'spotify:track:6nVm313QmsPlNllntTart1',
		volume: 63,
		position: 0,
		state: 'paused'
  	}
	```

* `play`:

	Starts playback.

* `playTrack`:

	Plays back a specific track. First argument is the Spotify URI as a string.

* `playTrackInContext`:

	Plays the track in the context of an album. First argument is the Track Spotify URI. The second argument is the Album URI.

* `pause`:

	Pausess playback.

* `playToggle`:

	Toggles playback between play/pause.

* `next`:

	Goes to next track.

* `previous`:

	Goes to previous track.

* `volumeUp`:

	Turns volume up.

* `volumeDown`:

	Turns volume down.

* `setVolume`:

	Sets volume level (0-100). First argument is the volume level as an integer.

* `rampVolume`:

	Ramps volume level (0-100). First argument is the volume level as an integer. The volume will ramp in 5% increments every 0.25s until it reaches the desired level.

* `mute`:

	Mutes volume.

* `unmute`:

	Mutes volume.

* `repeatOn`:

	Turns on repeating.

* `repeatOff`:

	Turns off repeating.

* `repeatToggle`:

	Toggles repeating on/off.

* `shuffleOn`:

	Turns on shuffling.

* `shuffleOff`:

	Turns off shuffling.

* `shuffleToggle`:

	Toggles shuffling on/off.