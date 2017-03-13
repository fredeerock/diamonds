var DiamondSound = function () {
  this.tone = new Tone();

  this.pitchCollection = [55, 57, 59, 61, 62, 64, 66, 67, 68, 69, 71, 73, 75, 76, 78, 80, 82, 83];
  this.pitch = this.pitchCollection[Math.floor(Math.random() * (this.pitchCollection.length))];

  this.chord = [68, 71, 75];
  this.chordRange = {low: -12, high: 12};

  this.tremolo = new Tone.Tremolo({
    "frequency":8,
    "type":"sine",
    "depth":0.6,
    "spread":0
    //"wet": 0.8
  }).toMaster().start();

  this.synth = new Tone.SimpleSynth({
    "oscillator" : {
      "type" : "sine"
   },
   "envelope" : {
    "attack" : 2.0,
    "decay" : 0.5,
    "sustain" : 0.8,
    "release" : 2.0
   }
  }).connect(this.tremolo);

  this.playerUtopalypse = new Tone.Player("data/Utopalypse.mp3").toMaster();
  this.playerDiamonds = new Tone.Player("data/diamonds_in_distopia.mp3").toMaster();
  this.playerKepler = new Tone.Player("data/Kepler_Star.mp3").toMaster();
    this.playerKepler.retrigger = 1;
  this.playerEnding = new Tone.Player("data/Ending_for_a_minute.mp3").toMaster();


  //this.gainy = new Tone.Gain().toMaster();
  // this.filt2 = new Tone.Filter(this.tone.midiToNote(this.pitch+12), "bandpass").connect(this.gainy);
  this.filt = new Tone.Filter(this.tone.midiToNote(this.pitch+12), "bandpass").toMaster();
  this.filt.Q.value = 15;
  this.filt.gain.value = 50;
  // this.filt2.Q.value = 2;
  // this.filt2.gain.value = 40;
  // this.ns = new Tone.Noise('pink').connect(this.filt);
  //this.gainy.gain.value = 10.;

  this.synth.triggerAttackRelease("C4", "8n",{} , 0.25);

  meSpeak.setAudioContext(this.tone.context);
  meSpeak.speakToNode(this.filt);
  // if (meSpeak.isConfigLoaded() && meSpeak.isVoiceLoaded(speakVoice)) {
  // meSpeak.speak('Diamonds');
  // }

}

DiamondSound.prototype.playPitch = function () {
  this.synth.triggerAttackRelease(this.tone.midiToNote(this.pitch+12), 5);
};

DiamondSound.prototype.triggerPitch = function () {
  this.synth.triggerAttackRelease(this.tone.midiToNote(this.pitch+12), 5);
  // socket.emit('triggerPitch', dSound.pitch);
};

DiamondSound.prototype.playChord = function (chordNotes) {
  if(chordNotes) {
    this.chord = chordNotes;
  };

};

DiamondSound.prototype.setChordRange = function () {

};

DiamondSound.prototype.setChord = function () {

};

DiamondSound.prototype.playChordSplit = function () {

};

DiamondSound.prototype.playChordDiads = function () {

};

DiamondSound.prototype.playUtopalypse = function() {
  this.playerKepler.start();
  this.playerUtopalypse.start("+2");
  this.playerKepler.start("+4");
};

DiamondSound.prototype.playDiamonds = function() {
  this.playerDiamonds.start();
};

DiamondSound.prototype.playKepler = function() {
  this.playerKepler.start();
};

DiamondSound.prototype.playEnding = function() {
  this.playerEnding.start();
};


DiamondSound.prototype.triggerDiamonds = function() {
  this.synth.triggerAttackRelease(this.tone.midiToNote(this.pitch+12), 5);
  this.playerDiamonds.start();
};

DiamondSound.prototype.speak = function(text) {
  this.pitch = this.pitchCollection[Math.floor(Math.random() * (this.pitchCollection.length))];
  var freq = this.tone.midiToNote(this.pitch+12);
  this.filt.frequency.value = (freq);
  //this.filt2.frequency.value = (freq);
  var rate = Math.floor(Math.random() * (12.)+ 4.);
  this.tremolo.frequency.value = freq;

      // check for safety - iOS will fail if you try to say something and can't
  if (meSpeak.isConfigLoaded() && meSpeak.isVoiceLoaded(speakVoice)) {
    meSpeak.speak(text);
  }
  this.synth.triggerAttackRelease(freq, "4n",{} , 0.15);
};
