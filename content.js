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

log = function() {
    if (document.getElementById("annoyatron-debug")) {
        console.log(new Date().toISOString(), ":", ...arguments);
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

playSound = function(soundToPlay) {
    var audio = document.createElement('audio');
    audio.src = chrome.runtime.getURL('sound/' + soundToPlay);
    audio.autoplay = true;
    return audio.play(); 
}

maybePingTab = function() {
    chrome.storage.sync.get(
        ['annoyatron-next-time'],
        function(items) {
            if (items['annoyatron-next-time'] && items['annoyatron-next-time'] > Date.now()) {
                log("can annoy only at ", new Date(items['annoyatron-next-time']).toISOString())
                return;
            }

            pingPromise = playSound('empty.mp3');
            pingPromise.then(_ => {
                log("ping played succesfully");
                maybePlaySound();
            }).catch(error => {
                // it is fine to fail to play a sound
                log("error while pinging: ", error);
            });
        },
    );
}

maybePlaySound = function() {
    chrome.storage.sync.get(
        ['annoyatron-next-time'],
        function(items) {
            if (items['annoyatron-next-time'] && items['annoyatron-next-time'] > Date.now()) {
                log("can annoy only at ", new Date(items['annoyatron-next-time']).toISOString())
                return;
            }

            const soundToPlay = soundsList[getRandomInt(0, soundsList.length - 1)];

            log("time to annoy! playing ", soundToPlay);
            
            playSoundPromise = playSound(soundToPlay);
            playSoundPromise.then(_ => {
                log("sound was played succesfully")

                const nextTimeToAnnoy = Date.now() + getRandomInt(20 * 60 * 1000, 40 * 60 * 1000);
                log("next time to annoy: ", new Date(nextTimeToAnnoy).toISOString());
                chrome.storage.sync.set({'annoyatron-next-time': nextTimeToAnnoy});
            }).catch(error => {
                // it is fine to fail to play a sound
                log("error while playing sound: ", error);
            });
        },
    );
}

scheduleAnnoyingSound = function() {
    const timeout = getRandomInt(1 * 60 * 100, 5 * 60 * 100) * 10;

    log("annoyatron checkin in ", timeout / 1000, " seconds");

    setTimeout(
        () => {
            scheduleAnnoyingSound();
            maybePingTab();
        },
        timeout,
    )    
}

window.onload = function() {
    if (window.location.href.startsWith("http")) {
        scheduleAnnoyingSound();
    }
}