export default class AudioManager {
    constructor(listener) {
        this.listener = listener;
        this.sounds = new Map();
        this.volumes = {
            MASTER: 1,
            PLAYERMASTER: 0.5,
            SFX: 0.5,
            MUSIC: 0.2,
            AMBIENCE: 0.5,
            UI: 0.25
        };
    }

    add(id, sound, type) {
        this.sounds.set(id, { sound, type });
    }

    play(id) {
        const entry = this.sounds.get(id);
        if (!entry) return;
        if (entry.sound.isPlaying) return;

        const { sound, type } = entry;

        sound.setVolume(this.getFinalVolume(type));
        sound.play();
    }

    setVolume(type, value) {
        this.volumes[type] = value;

        this.sounds.forEach(({ sound, type: soundType }) => {
            const final = this.getFinalVolume(soundType);
            sound.setVolume(final);
        });
    }

    getFinalVolume(type) {
        const linear = this.volumes.MASTER * this.volumes.PLAYERMASTER * this.volumes[type];
        return this.toGain(linear);
    }

    toGain(value) {
        const minDb = -40;
        const db = minDb * (1 - value);
        return Math.pow(10, db / 20);
    }

    async resume() {
        const ctx = this.listener.context;

        if (ctx.state === "suspended") {
            await ctx.resume();
        }
    }
}


export const AudioType = Object.freeze({
    PLAYERMASTER: "PLAYERMASTER",
    MASTER: "MASTER",
    SFX: "SFX",
    MUSIC: "MUSIC",
    AMBIENCE: "AMBIENCE",
    UI: "UI"
});