import { useEffect } from 'react';
// import clickTone from '../assets/audios/click.mp3';
import tabTone from '../assets/audios/tab.mp3';
import orderPlacedTone from '../assets/audios/orderPlaced.mp3';
import sound1 from '../assets/audios/sound1.mp3';
import sound2 from '../assets/audios/sound2.mp3';
import sound3 from '../assets/audios/sound3.mp3';
import sound4 from '../assets/audios/sound4.mp3';
import sound5 from '../assets/audios/sound5.mp3';
import sound6 from '../assets/audios/sound6.mp3';
import sound7 from '../assets/audios/sound7.mp3';
import sound8 from '../assets/audios/sound8.mp3';
import sound9 from '../assets/audios/sound9.mp3';

export function useClickSound() {
    useEffect(() => {
        const sounds = {
            click: new Audio(tabTone),
            tab: new Audio(tabTone),
            orderPlace: new Audio(orderPlacedTone),
        };

        // Preload all sounds
        Object.values(sounds).forEach(audio => audio.load());

        const handleClick = (e) => {
            let el = e.target;
            while (el && el !== document.body) {
                if (el.hasAttribute('data-click-effect')) {
                    const tone = el.getAttribute('data-click-effect');
                    const audio = sounds[tone];

                    if (audio) {
                        audio.currentTime = 0;
                        audio.play().catch(() => { });
                    }
                    break;
                }
                el = el.parentElement;
            }
        };

        document.addEventListener('click', handleClick);

        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, []);
}

/**
 * @typedef {"sound1" | "sound2" | "sound3" | "sound4" | "sound5" | "sound6" | "sound7" | "sound8" | "sound9"} SoundNameList
 */

/**
 * @param {Object} props
 * @param {SoundNameList} [props.sound="sound1"]
 */

export function SoundEffect({ sound = "sound1" }) {

    const soundList = {
        sound1: new Audio(sound1),
        sound2: new Audio(sound2),
        sound3: new Audio(sound3),
        sound4: new Audio(sound4),
        sound5: new Audio(sound5),
        sound6: new Audio(sound6),
        sound7: new Audio(sound7),
        sound8: new Audio(sound8),
        sound9: new Audio(sound9),
    };
    Object.values(soundList).forEach(audio => audio.load());

    const audio = soundList[sound];

    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => { });
    }

}