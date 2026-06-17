(function () {
  const BPM = 150;
  const BEAT_SEC = 60 / BPM;
  const LOOKAHEAD_SEC = 0.12;
  const SCHEDULE_MS = 30;

  const NOTE_FREQ = {
    C: 261.63,
    D: 293.66,
    E: 329.63,
    F: 349.23,
    G: 392.0,
    A: 440.0,
    B: 493.88,
  };

  const MELODY = [
    "E", "G", "A", "G", "E", "G", "A", "C",
    "B", "A", "G", "E", "G", "A", "G", null,
  ];

  const BASS = [
    "C", null, "G", null, "A", null, "F", null,
    "C", null, "G", null, "E", null, "C", null,
  ];

  const BEATS_PER_LOOP = MELODY.length;

  function noteToFreq(name, octave) {
    return NOTE_FREQ[name] * 2 ** (octave - 4);
  }

  function isKickMeasure(measureIndex) {
    return measureIndex % 2 === 0;
  }

  function getDrumType(beatIndex) {
    const beatInMeasure = beatIndex % 4;
    if (beatInMeasure !== 0 && beatInMeasure !== 3) {
      return null;
    }

    const measureIndex = Math.floor(beatIndex / 4);
    return isKickMeasure(measureIndex) ? "kick" : "snare";
  }

  function createBgmPlayer() {
    let audioContext = null;
    let masterGain = null;
    let isPlaying = false;
    let isUnlocked = false;
    let nextBeatTime = 0;
    let beatIndex = 0;
    let schedulerId = null;

    function ensureContext() {
      if (!audioContext) {
        audioContext = new AudioContext();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.35;
        masterGain.connect(audioContext.destination);
      }

      return audioContext;
    }

    function playTone(time, frequency, duration, type, gainValue) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(gainValue, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    }

    function playMelodyNote(time, note) {
      if (!note) {
        return;
      }

      playTone(time, noteToFreq(note, 5), BEAT_SEC * 0.42, "square", 0.18);
    }

    function playBassNote(time, note) {
      if (!note) {
        return;
      }

      playTone(time, noteToFreq(note, 3), BEAT_SEC * 0.48, "triangle", 0.28);
    }

    function playKick(time) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(48, time + 0.08);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.55, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + 0.14);
    }

    function playSnare(time) {
      const bufferSize = Math.floor(audioContext.sampleRate * 0.12);
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      for (let index = 0; index < bufferSize; index += 1) {
        data[index] = Math.random() * 2 - 1;
      }

      const noise = audioContext.createBufferSource();
      noise.buffer = buffer;

      const filter = audioContext.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 900;

      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.14, time + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      noise.start(time);
      noise.stop(time + 0.12);
    }

    function scheduleBeat(time, index) {
      playMelodyNote(time, MELODY[index]);
      playBassNote(time, BASS[index]);

      const drumType = getDrumType(index);
      if (drumType === "kick") {
        playKick(time);
      } else if (drumType === "snare") {
        playSnare(time);
      }
    }

    function scheduler() {
      if (!isPlaying || !audioContext) {
        return;
      }

      while (nextBeatTime < audioContext.currentTime + LOOKAHEAD_SEC) {
        scheduleBeat(nextBeatTime, beatIndex);
        nextBeatTime += BEAT_SEC;
        beatIndex = (beatIndex + 1) % BEATS_PER_LOOP;
      }
    }

    function startScheduler() {
      if (schedulerId !== null) {
        return;
      }

      nextBeatTime = audioContext.currentTime + BEAT_SEC * 0.25;
      beatIndex = 0;
      schedulerId = window.setInterval(scheduler, SCHEDULE_MS);
    }

    function stopScheduler() {
      if (schedulerId !== null) {
        window.clearInterval(schedulerId);
        schedulerId = null;
      }
    }

    async function unlock() {
      const context = ensureContext();

      if (context.state === "suspended") {
        await context.resume();
      }

      isUnlocked = true;
    }

    async function start() {
      await unlock();

      if (isPlaying) {
        return;
      }

      isPlaying = true;
      startScheduler();
    }

    function stop() {
      isPlaying = false;
      stopScheduler();
    }

    return {
      unlock,
      start,
      stop,
      get isPlaying() {
        return isPlaying;
      },
      get isUnlocked() {
        return isUnlocked;
      },
    };
  }

  window.createBgmPlayer = createBgmPlayer;
})();
