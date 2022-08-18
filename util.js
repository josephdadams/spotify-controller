'use strict';

const { Notification, nativeImage } = require('electron');

const _ = require('lodash');

const config = require('./config.js');
const API = require("./api.js");

function showNotification() {
	const icon = nativeImage.createFromDataURL(config.get('icon'));
	
	if (STATUS.playbackInfo.playerState === 'Playing' && config.get('showNotifications')) {
		const NOTIFICATION_TITLE = STATUS.playbackInfo.name;
		const NOTIFICATION_BODY = STATUS.playbackInfo.artist;
		new Notification(
			{
				title: NOTIFICATION_TITLE,
				subtitle: NOTIFICATION_BODY,
				icon: icon,
				silent: true
			}
		).show();
	}
}

module.exports = {
	processNotification: function(event, info) {
		try {
			if (config.get('allowedEvents').includes(event)) {
				//do the stuff with the things
				switch(event) {
					case 'com.spotify.client.PlaybackStateChanged':
						STATUS.playbackInfo = _.mapKeys(info, (v, k) => _.camelCase(k));
						API.sendUpdates();
						showNotification();
						break;
					default:
						break;
				}
			}
		}
		catch(error) {
			console.log(error);
		}
	},
}