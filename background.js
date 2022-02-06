const soundsList = [
    'Blastwave_FX_CatMeow_SFXB.203.mp3',
    'ftus_animals_dog_bark_aggressive_242.mp3',
    'meow1.mp3',
    'sound_design_beep_censor_tone_001.mp3',
    'soundbits_ScreamsShouts2_Baby_Cry_015.mp3',
    'technology_cell_phone_vibrate_in_hand.mp3',
    'transport_car_horn_beep_med_blast.mp3',
    'zapsplat_cartoon_mosquito_fly_by_002_12010.mp3',
    'zapsplat_household_door_front_thin_glass_knocks_friendly_happy_001_21922.mp3',
    'zapsplat_household_doorbell_chime_bell_002_73123.mp3',
    'zapsplat_household_doorbell_ring_fast_001_66554.mp3',
    'zapsplat_animals_insects_bee_buzz_against_window_001_18367.mp3',
    'zapsplat_ical_drum_bongo_fast_tribal_riff_002_58400.mp3',
]

const PongMessageType = 0;
const FailedToPlaySoundMessageType = 1;

var SessionID = 0;
var ResponsiveTabIDs = [];

chrome.alarms.onAlarm.addListener(
    (alarm) => {
        if (alarm.name !== 'annoyatron-response-from-tab') {
            return;
        }

        SessionID++;
        sendAnnoyingSoundToRandomResponsiveTab(SessionID);
    },
)

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (sender.id !== chrome.runtime.id) {
        return
    }

    // some old message, ignore it
    if (message['session_id'] != SessionID) {
        return;
    } 

    switch (message['message_type']) {
        case PongMessageType:
            // console.log('pong from: ', message['tab_id'], message['url']);
            ResponsiveTabIDs.push(message['tab_id'])
            chrome.alarms.clear('annoyatron-response-from-tab');
            chrome.alarms.create('annoyatron-response-from-tab', { when: Date.now() + 2 * 1000 });
            break;
        case FailedToPlaySoundMessageType:
            // console.log('failed to play sound. Trying another tab');
            sendAnnoyingSoundToRandomResponsiveTab(SessionID);
            break;
    }
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

playSound = function(soundToPlay, sessionID, failedToPlayMessageType) {
    var audio = document.createElement('audio');
    // console.log("Playing:", soundToPlay)
    audio.src = chrome.runtime.getURL('sound/' + soundToPlay);
    audio.autoplay = true;
    promise = audio.play();

    reportError = () => {
        // console.log("failed to play sound, will try other tab")
        chrome.runtime.sendMessage(
            chrome.runtime.id,
            {
                'session_id': sessionID,
                'message_type': failedToPlayMessageType,
            },
        )
    }

    if (promise === undefined) {
        reportError();
        return;
    }

    promise.then(_ => {
        // console.log("sound was played succesfully");
    }).catch(error => {
        reportError();
    });

}

pingTab = function(tab, sessionID) {
    executeScript = chrome.scripting.executeScript(
        {
            target: { tabId: tab.id},
            function: (tabID, sessionID, messageType) => {
                var audio = document.createElement('audio');
                // 0.1 seconds of total silence just to make sure the tab is responsive and can play sounds
                audio.src="data:audio/mpeg;base64, SUQzBAAAAAAANFRDT04AAAAHAAADQmx1ZXMAVFNTRQAAAA8AAANMYXZmNTkuMTAuMTAwAAAAAAAAAAAAAAD/+1QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJbmZvAAAADwAAAAcAAANgAFVVVVVVVVVVVVVVVVVVcXFxcXFxcXFxcXFxcXGOjo6Ojo6Ojo6Ojo6OjqqqqqqqqqqqqqqqqqqqqsfHx8fHx8fHx8fHx8fH4+Pj4+Pj4+Pj4+Pj4+P//////////////////wAAAABMYXZjNTkuMTQAAAAAAAAAAAAAAAAkAvEAAAAAAAADYB251ar/+xRkAA/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xRkHg/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xRkPA/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xRkWg/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xRkeA/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xRklg/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xRktA/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=";
                audio.autoplay = true;
                promise = audio.play();

                promise.then(_ => {
                    chrome.runtime.sendMessage(
                        chrome.runtime.id,
                        {
                            "message_type": messageType,
                            "tab_id": tabID,
                            // "url": window.location.href,
                            "session_id": sessionID,
                        },
                    )
                })
            },
            args: [tab.id, sessionID, PongMessageType],
        }
    );
    executeScript.catch(_ => {
        // we failed to execute the ping script on a tab
        chrome.alarms.clear('annoyatron-response-from-tab');
        chrome.alarms.create('annoyatron-response-from-tab', { when: Date.now() + 2 * 1000 });
    });
}

sendAnnoyingSoundToRandomResponsiveTab = function(sessionID) {
    if (ResponsiveTabIDs.length == 0) {
        // console.log("no available tab left. will try again in one minute.");
        scheduleAnnoyingSound(1);
        return;
    }

    const index = getRandomInt(0, ResponsiveTabIDs.length - 1)
    const tabID = ResponsiveTabIDs[index];

    ResponsiveTabIDs.splice(index, 1);

    const soundToPlay = soundsList[getRandomInt(0, soundsList.length - 1)]
    // console.log("It is time to annoy! playing sound ", soundToPlay," on tab: ", tabID);

    executeScript = chrome.scripting.executeScript(
        {
            target: { tabId: tabID},
            function: playSound,
            args: [soundToPlay, sessionID, FailedToPlaySoundMessageType],
        }
    );

    executeScript.catch(_ => {});
}

canTabPlaySound = function(tab) {
    return tab.id && tab.url && tab.url.startsWith('http');
}

getNextScheduleTime = function() {
    return getRandomInt(20, 40);
}

scheduleAnnoyingSound = function(timeoutInMinutes = getNextScheduleTime()) {
    // console.log("next annoying sounds at " + new Date((new Date()).getTime() + timeoutInMinutes * 60 * 1000));
    chrome.alarms.clear('annoyatron-main');
    chrome.alarms.create('annoyatron-main', { delayInMinutes: timeoutInMinutes });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== 'annoyatron-main') {
        return;
    }

    scheduleAnnoyingSound();

    SessionID = getRandomInt(0, 1000000);
    ResponsiveTabIDs = []
    chrome.tabs.query(
        {},
        function(tabs) {
            var pingWasSent = false;
            for (const tab of tabs) {
                if (canTabPlaySound(tab)) {
                    pingWasSent = true;
                    pingTab(tab, SessionID);
                }
            }

            if (!pingWasSent) {
                // console.log("didn't find any available tab to play sound. retrying.")
                scheduleAnnoyingSound(1);
            }
        },
    )
});

scheduleAnnoyingSound();