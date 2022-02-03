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
var SendAnnoyingSoundID;
var MainTriggerID;

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
            // console.log('pong from: ', message['tab_id']);
            ResponsiveTabIDs.push(message['tab_id'])
            if (SendAnnoyingSoundID) {
                clearTimeout(SendAnnoyingSoundID);
            }
            SendAnnoyingSoundID = setTimeout(
                () => {
                    SessionID++;
                    sendAnnoyingSoundToRandomResponsiveTab(SessionID)
                },
                2 * 1000,
            );
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

playSound = function(soundToPlay, timesToPlay, sessionID, failedToPlayMessageType) {
    var audio = document.createElement('audio');
    // console.log("Playing:", soundToPlay)
    audio.src = chrome.runtime.getURL('sound/' + soundToPlay);
    audio.autoplay = true;
    promise = audio.play();

    timesToPlay--;

    getRandomInt = (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

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
        // console.log("sound was played succesfully")
        var totalSeconds = 0;
        for(var i = 0 ; i < timesToPlay ; ++i) {
            totalSeconds += getRandomInt(60, 180);
            setTimeout(
                () => {
                    // console.log("playing sound ", soundToPlay);
                    audio.play();
                },
                totalSeconds * 1000,
            )
        }
    }).catch(error => {
        reportError();
    });

}

pingTab = function(tab, sessionID) {
    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id},
            function: (tabID, sessionID, messageType) => {
                var audio = document.createElement('audio');
                audio.src = '';
                audio.autoplay = true;
                promise = audio.play();
                
                promise.catch(error => {
                    chrome.runtime.sendMessage(
                        chrome.runtime.id,
                        {
                            "message_type": messageType,
                            "tab_id": tabID,
                            "session_id": sessionID,
                        },
                    )
                });
            },
            args: [tab.id, sessionID, PongMessageType],
        }
    );
}

sendAnnoyingSoundToRandomResponsiveTab = function(sessionID) {
    if (ResponsiveTabIDs.length == 0) {
        // console.log("no available tab left. will try again in one minute.");
        clearTimeout(MainTriggerID);
        scheduleAnnoyingSound(1);
        return;
    }

    const index = getRandomInt(0, ResponsiveTabIDs.length - 1)
    const tabID = ResponsiveTabIDs[index];

    ResponsiveTabIDs.splice(index, 1);

    const soundToPlay = soundsList[getRandomInt(0, soundsList.length - 1)]
    const timesToPlay = getRandomInt(1, 3)
    // console.log("It is time to annoy! playing sound ", soundToPlay, timesToPlay, " times on tab: ", tabID);

    chrome.scripting.executeScript(
        {
            target: { tabId: tabID},
            function: playSound,
            args: [soundToPlay, timesToPlay, sessionID, FailedToPlaySoundMessageType],
        }
    );
}

canTabPlaySound = function(tab) {
    return tab.id && tab.url && tab.url.startsWith('http');
}

scheduleAnnoyingSound = function(timeoutInMinutes) {
    // console.log("next annoying sounds at " + new Date((new Date()).getTime() + timeoutInMinutes * 60 * 1000));
    MainTriggerID = setTimeout(
        async () => {
            scheduleAnnoyingSound(getRandomInt(20, 60));

            SessionID = getRandomInt(0, 1000000);
            ResponsiveTabIDs = []
            chrome.tabs.query(
                {},
                function(tabs) {
                    for (const tab of tabs) {
                        if (canTabPlaySound(tab)) {
                            pingTab(tab, SessionID);
                        }
                    }
                },
            )
        },
        timeoutInMinutes * 60 * 1000,
    )
}

scheduleAnnoyingSound(getRandomInt(20, 60));
