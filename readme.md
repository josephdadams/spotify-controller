# spotify-controller

> Allows you to remotely control the local Spotify app on your computer through a REST API or socket.io connection.

Supports **macOS** (full control) and **Windows** (limited control).  
For API details, see [api.md](api.md).

---

## ⚠ Platform Support

| Platform   | Support Level | Notes                                                                 |
|------------|----------------|-----------------------------------------------------------------------|
| **macOS**  | ✅ Full        | Uses AppleScript to control Spotify directly. Full support for playback, volume, seeking, etc. |
| **Windows**| ⚠ Limited      | Uses Spotify deep links. Can start playback of specific tracks or albums, but does **not** support pause, volume, next/prev, etc. |

---

## Install

**macOS**:  
[**Download .dmg**](https://github.com/josephdadams/spotify-controller/releases/latest)

**Windows**:  
[**Download .exe**](https://github.com/josephdadams/spotify-controller/releases/latest)

The app runs a local server on port `8801` by default.

---

## Features

- REST API and socket.io interface for remote Spotify control
- Designed to work with [Bitfocus Companion](https://bitfocus.io/companion) via a custom module
- Status variables and feedback support (macOS only)

### Companion Module Actions

| Action                      | macOS | Windows |
|----------------------------|:-----:|:-------:|
| Play/Pause/Toggle          | ✅     | ❌       |
| Play Track by ID           | ✅     | ✅       |
| Play Track by ID in Context| ✅     | ✅       |
| Next/Previous              | ✅     | ❌       |
| Seek / Set Position        | ✅     | ❌       |
| Volume Up/Down/Set/Mute    | ✅     | ❌       |
| Repeat / Shuffle Modes     | ✅     | ❌       |

---

## Development

Built with [Electron](https://electronjs.org).

### Run Locally

```bash
npm install
npm start