import generateID from "parsegraph-generateid";
import { copyStyle, BlockNode, BlockCaret } from "parsegraph-block";
import { Projector } from "parsegraph-projector";
import Direction, {Alignment} from "parsegraph-direction";
import { SliderNode } from "parsegraph-slider";
import Color from 'parsegraph-color';
import SynthWidget from './SynthWidget';
import {TimeoutTimer} from 'parsegraph-timing';

export class SequenceStep {
  _seq: SequencerWidget;
  _i: number;
  _active: boolean;
  _pitchSlider: SliderNode;
  _onButton: BlockNode;
  _attackSlider:SliderNode;
  _decaySlider:SliderNode;
  _sustainLengthSlider:SliderNode;
  _releaseSlider:SliderNode;
  _sustainLevelSlider:SliderNode;
  _type: string;

  constructor(seq:SequencerWidget, i:number) {
    this._seq = seq;
    this._i = i;
    this._active = true;
  }

  setFrequency(freq:number) {
    // if(this._lastOsc) {
    // this._lastOsc.frequency.setValueAtTime(
    //   freq, this._lastOsc.context.currentTime);
    // }
    this._pitchSlider.value().setVal((freq - 16) / 7902);
    // console.log(this._i, this._pitchSlider.value());
  };

  setActive(isActive:boolean) {
    this._active = isActive;
    if (this._active) {
      this._onButton.value().setLabel("On");
    } else {
      this._onButton.value().setLabel("Off");
    }
  };

  play(osc:OscillatorNode, gain:GainNode, start:number, end:number) {
    const len = end - start;
    osc.frequency.setValueAtTime(16 + 7902 * this._pitchSlider.value().val(), start);
    // this._lastOsc = osc;
    if (this._onButton.value().label() == "Off") {
      // console.log("Step is off!");
      gain.gain.setValueAtTime(0, start);
      return;
    }
    // gain.gain.setValueAtTime(0, start);
    // gain.gain.linearRampToValueAtTime(1, start + .2);
    // gain.gain.setValueAtTime(1, start + len * .8);
    // gain.gain.linearRampToValueAtTime(0, end);
    // console.log(this._i, start, end);

    const envelopeSize =
      this._attackSlider.value().val() +
      this._decaySlider.value().val() +
      this._sustainLengthSlider.value().val() +
      this._releaseSlider.value().val();

    const ae = this._attackSlider.value().val() / envelopeSize;
    const de = this._decaySlider.value().val() / envelopeSize;
    const se = this._sustainLengthSlider.value().val() / envelopeSize;
    const re = this._releaseSlider.value().val() / envelopeSize;

    gain.gain.linearRampToValueAtTime(1, start + len * ae);
    gain.gain.exponentialRampToValueAtTime(
      this._sustainLevelSlider.value().val(),
      start + len * (ae + de)
    );
    gain.gain.setValueAtTime(
      this._sustainLevelSlider.value().val(),
      start + len * (ae + de + se)
    );
    gain.gain.linearRampToValueAtTime(0, start + len * (ae + de + se + re));
  };

  randomize() {
    this.setFrequency(16 + Math.random() * 7902);
    this.setActive(Math.random() > 0.2);
  };

  _node: BlockNode;

  node() {
    if (this._node) {
      return this._node;
    }

    let step = new BlockNode('b');
    this._node = step;
    const b = copyStyle('b');
    b.backgroundColor = new Color(1, 1, this._i % 2 == 0 ? 1 : 0.8, 1);
    step.value().setBlockStyle(b);
    step.value().setLabel("" + (1 + this._i));
    const s = step.connectNode(Direction.INWARD, new BlockNode('u'));
    s.value().interact().setIgnoreMouse(true);
    s.state().setScale(0.5);
    step.setNodeAlignmentMode(Direction.INWARD, Alignment.INWARD_VERTICAL);

    const stepOn = s.connectNode(Direction.UPWARD, new BlockNode('b'));
    stepOn.value().setLabel(Math.random() > 0.3 ? "On" : "Off");
    stepOn.value().interact().setClickListener(()=>{
      this._active = !this._active;
      if (this._active) {
        stepOn.value().setLabel("Off");
      } else {
        stepOn.value().setLabel("On");
      }
      return true;
    });
    this._onButton = stepOn;

    const stepLabel = s.connectNode(Direction.BACKWARD, new BlockNode('b'));
    stepLabel.value().setLabel("Pitch");
    stepLabel.state().setScale(0.5);
    let stepSlider = s.connectNode(Direction.FORWARD, new SliderNode());
    stepSlider.state().setScale(0.5);
    this._pitchSlider = stepSlider;
    this._pitchSlider.value().setVal(Math.random());

    const ns = s.connectNode(Direction.DOWNWARD, new BlockNode('u'));
    let tn = ns.connectNode(Direction.FORWARD, new BlockNode('b'));
    tn.value().setLabel("sine");
    tn.value().interact().setClickListener(()=>{
      this._type = "sine";
      return true;
    });
    tn.state().setScale(0.25);
    let tnn = tn.connectNode(Direction.DOWNWARD, new BlockNode('b'));
    tnn.value().setLabel("triangle");
    tnn.value().interact().setClickListener(function () {
      this._type = "triangle";
      return true;
    }, this);
    tn = tnn;
    tnn = tn.connectNode(Direction.DOWNWARD, new BlockNode('b'));
    tnn.value().setLabel("sawtooth");
    tnn.value().interact().setClickListener(function () {
      this._type = "sawtooth";
      return true;
    }, this);
    tn = tnn;
    tnn = tn.connectNode(Direction.DOWNWARD, new BlockNode('b'));
    tnn.value().setLabel("square");
    tnn.value().interact().setClickListener(function () {
      this._type = "square";
      return true;
    }, this);
    tn = tnn;

    const nsl = ns.connectNode(Direction.BACKWARD, new BlockNode('b'));
    nsl.value().setLabel("Type");
    nsl.state().setScale(0.5);

    let prior = ns;

    // Attack
    const attackBud = prior.connectNode(Direction.DOWNWARD, new BlockNode('u'));
    const attackLabel = attackBud.connectNode(Direction.BACKWARD, new BlockNode('b'));
    attackLabel.value().setLabel("Attack");
    attackLabel.state().setScale(0.5);
    stepSlider = attackBud.connectNode(Direction.FORWARD, new SliderNode());
    stepSlider.state().setScale(0.5);
    this._attackSlider = stepSlider;
    this._attackSlider.value().setVal(Math.random());
    prior = attackBud;

    // Decay
    const decayBud = prior.connectNode(Direction.DOWNWARD, new BlockNode('u'));
    const decayLabel = decayBud.connectNode(Direction.BACKWARD, new BlockNode('b'));
    decayLabel.value().setLabel("Decay");
    decayLabel.state().setScale(0.5);
    stepSlider = decayBud.connectNode(Direction.FORWARD, new SliderNode());
    stepSlider.state().setScale(0.5);
    this._decaySlider = stepSlider;
    this._decaySlider.value().setVal(Math.random());
    prior = decayBud;

    // Sustain
    const sustainBud = prior.connectNode(Direction.DOWNWARD, new BlockNode('u'));
    const sustainLabel = sustainBud.connectNode(Direction.BACKWARD, new BlockNode('b'));
    sustainLabel.value().setLabel("Sustain");
    sustainLabel.state().setScale(0.5);
    const sustainSliders = sustainBud.connectNode(Direction.FORWARD, new BlockNode('u'));
    sustainSliders.state().setScale(0.5);
    stepSlider = sustainSliders.connectNode(Direction.FORWARD, new SliderNode());

    const lenSlider = sustainSliders.connectNode(Direction.DOWNWARD, new BlockNode('u'))
      .connectNode(Direction.FORWARD, new SliderNode())
    this._sustainLengthSlider = lenSlider;
    this._sustainLengthSlider.value().setVal(Math.random());

    this._sustainLevelSlider = stepSlider;
    this._sustainLevelSlider.value().setVal(0.6 + 0.4 * Math.random());
    prior = sustainBud;

    // Release
    const releaseBud = prior.connectNode(Direction.DOWNWARD, new BlockNode('b'));
    const releaseLabel = releaseBud.connectNode(Direction.BACKWARD, new BlockNode('b'));
    releaseLabel.value().setLabel("Release");
    releaseLabel.state().setScale(0.5);
    stepSlider = releaseBud.connectNode(Direction.FORWARD, new SliderNode());
    stepSlider.state().setScale(0.5);
    this._releaseSlider = stepSlider;
    this._releaseSlider.value().setVal(Math.random());
    prior = releaseBud;

    return this._node;
  };
}

export default class SequencerWidget {
  _id: string;
  _proj: Projector;
  _containerNode: BlockNode;
  _steps: any[];
  _listeners: any[];
  _numSteps: number;
  _maxBpm: number;
  _bpm: number;
  _detuneScale: number;
  _sink:GainNode;
  _timer:ConstantSourceNode;
  _bpmSlider:SliderNode;
  _gain: GainNode;
  _voices: {[key:string]:{osc:OscillatorNode, gain:GainNode}};
  _detuneSlider: SliderNode;
  _synth: ()=>void;
  _playing: boolean;
  _startTime: number;
  _beatLength: number;
  _currentStep: number;
  _recording: boolean;
  _renderTimer: TimeoutTimer;
  _lastSelected: number;
  _recordButton: BlockNode;
  _onButton: BlockNode;
  _resetButton: BlockNode;
  _randomizeButton: BlockNode;

  constructor(proj: Projector) {
    this._id = generateID("Sequencer");
    this._proj = proj;
    this._containerNode = null;
    this._steps = [];
    this._listeners = [];
    this._numSteps = 32;
    this._maxBpm = 2000;
    this._bpm = this._maxBpm / 2;
    this._detuneScale = 300;
  }

  useSynthesizer(synth:SynthWidget) {
    if (this._synth) {
      this._synth();
      this._synth = null;
    }
    if (!synth) {
      return;
    }
    this._synth = synth.addListener((freq:number)=>{
      if (!this._recording) {
        return;
      }
      const now = this.audio().currentTime;
      let step;
      if (this._playing) {
        const t =
          Math.floor((now - this._startTime) / this._beatLength) % this._numSteps;
        step = this._steps[t];
      } else {
        step = this._steps[this._currentStep];
      }
      if (!step) {
        return;
      }
      step.setActive(true);
      step.setFrequency(freq);
      this.scheduleRepaint();
    });
  };

  scheduleRepaint() {
    //this._graph.scheduleRepaint();
  }

  output() {
    if (!this._sink) {
      this._sink = this.audio().createGain();
    }
    return this._sink;
  };

  onPlay(listener:Function, listenerThisArg?:any) {
    this._listeners.push([listener, listenerThisArg]);
  };

  audio() {
    return this._proj.audio();
  }

  play(bpm:number) {
    const audio = this.audio();
    this._timer = audio.createConstantSource();
    this._timer.onended = ()=>{
      this.play(this._maxBpm * this._bpmSlider.value().val());
    };
    this._timer.start();

    const tg = audio.createGain();
    this._timer.connect(tg);
    tg.gain.value = 0;
    tg.connect(this.output());

    let now = audio.currentTime;

    if (this._voices) {
      for (const type in this._voices) {
        if (Object.prototype.hasOwnProperty.call(this._voices, type)) {
          const voice = this._voices[type];
          voice.osc.stop();
        }
      }
    }
    this._gain = audio.createGain();
    this._gain.connect(this.output());

    const sineVoice = {
      osc: audio.createOscillator(),
      gain: audio.createGain(),
    };
    sineVoice.gain.gain.setValueAtTime(0, now);
    sineVoice.osc.start(now);
    sineVoice.osc.connect(sineVoice.gain);
    sineVoice.gain.connect(this._gain);
    sineVoice.osc.detune.setValueAtTime(
      this._detuneScale * (this._detuneSlider.value().val() - 0.5),
      now
    );

    const triangleVoice = {
      osc: audio.createOscillator(),
      gain: audio.createGain(),
    };
    triangleVoice.osc.type = "triangle";
    triangleVoice.osc.connect(triangleVoice.gain);
    triangleVoice.osc.start(now);
    triangleVoice.gain.connect(this._gain);
    triangleVoice.gain.gain.setValueAtTime(0, now);
    triangleVoice.osc.detune.setValueAtTime(
      this._detuneScale * (this._detuneSlider.value().val() - 0.5),
      now
    );

    const sawtoothVoice = {
      osc: audio.createOscillator(),
      gain: audio.createGain(),
    };
    sawtoothVoice.osc.type = "sawtooth";
    sawtoothVoice.osc.connect(sawtoothVoice.gain);
    sawtoothVoice.osc.start(now);
    sawtoothVoice.gain.connect(this._gain);
    sawtoothVoice.gain.gain.setValueAtTime(0, now);
    sawtoothVoice.osc.detune.setValueAtTime(
      this._detuneScale * (this._detuneSlider.value().val() - 0.5),
      now
    );

    const squareVoice = {
      osc: audio.createOscillator(),
      gain: audio.createGain(),
    };
    squareVoice.osc.type = "square";
    squareVoice.osc.connect(squareVoice.gain);
    squareVoice.osc.start(now);
    squareVoice.gain.connect(this._gain);
    squareVoice.gain.gain.setValueAtTime(0, now);
    squareVoice.osc.detune.setValueAtTime(
      this._detuneScale * (this._detuneSlider.value().val() - 0.5),
      now
    );

    this._voices = {};
    this._voices["sine"] = sineVoice;
    this._voices["triangle"] = triangleVoice;
    this._voices["sawtooth"] = sawtoothVoice;
    this._voices["square"] = squareVoice;

    this._startTime = now;
    this._beatLength = 60 / bpm;
    let last;
    for (let i = 0; i < this._steps.length; ++i) {
      const s = this._steps[i];
      const voice = this._voices[s._type];
      if (!voice) {
        console.log("No voice for " + s._type);
        continue;
      }
      s.play(
        voice.osc,
        voice.gain,
        now + (i * 60) / bpm,
        now + ((i + 1) * 60) / bpm
      );
      last = now + ((i + 1) * 60) / bpm;
    }
    this._timer.stop(last);

    this._lastSelected = null;
    this._currentStep = null;
    this._renderTimer = new TimeoutTimer();
    this._renderTimer.setDelay(this._beatLength);
    this._renderTimer.setListener(()=>{
      now = this.audio().currentTime;
      const t =
        Math.floor((now - this._startTime) / this._beatLength) % this._numSteps;
      this._currentStep = t;
      let s = this._steps[t];
      if (s && t != this._lastSelected) {
        // console.log("Changing step to " + t);
        for (let i = 0; i < this._steps.length; ++i) {
          const s = this._steps[i];
          if (i != t) {
            const b = copyStyle('b');
            b.backgroundColor = new Color(1, 1, i % 2 == 0 ? 1 : 0.8, 1);
            s._node.setBlockStyle(b);
          } else {
            const b = copyStyle('b');
            b.backgroundColor = new Color(0.5, 0, 0, 1);
            s._node.setBlockStyle(b);
          }
        }
        this._lastSelected = t;
        this.scheduleRepaint();
      }
      this._renderTimer.schedule();
    });
    // this._renderTimer.schedule();
  };

  node() {
    if (this._containerNode) {
      return this._containerNode;
    }
    const car = new BlockCaret('s');
    this._containerNode = car.root();
    car.label("Sequencer");
    // car.fitExact();

    this._containerNode.setNodeAlignmentMode(Direction.INWARD, Alignment.INWARD_VERTICAL);
    const onOff = this._containerNode.connectNode(Direction.INWARD, new BlockNode('b'));
    onOff.value().setLabel("Play");
    this._onButton = onOff;

    this._recordButton = onOff.connectNode(Direction.FORWARD, new BlockNode('b'));
    this._recordButton.value().setLabel("Record");

    this._recordButton.value().interact().setClickListener(()=>{
      this._recording = !this._recording;
      if (this._recording) {
        // Now recording
        const b = copyStyle('b');
        b.backgroundColor = new Color(1, 1, 0, 1);
        this._recordButton.value().setBlockStyle(b);
        this._recordButton.value().setLabel("Recording");
      } else {
        const b = copyStyle('b');
        this._recordButton.value().setBlockStyle(b);
        this._recordButton.value().setLabel("Record");
      }
      this.scheduleRepaint();
      return true;
    });

    const bpmSlider = onOff.connectNode(Direction.DOWNWARD, new SliderNode());
    bpmSlider.value().setVal(0.5);
    bpmSlider.value().setOnChange(()=>{
      //bpmSlider.value();
    });
    this._bpmSlider = bpmSlider;

    this._playing = false;
    onOff.value().interact().setClickListener(()=>{
      this._playing = !this._playing;
      if (this._playing) {
        // onOff.setLabel("Stop");
        const v = bpmSlider.value().val();
        const bpm = v * this._maxBpm;
        this.play(bpm);
      } else {
        onOff.value().setLabel("Play");
      }
      return true;
    });

    this._resetButton = this._recordButton.connectNode(Direction.FORWARD, new BlockNode('b'));
    this._resetButton.value().setLabel("Reset");
    this._resetButton.value().interact().setClickListener(()=>{
      const newFreq = 440;
      for (let i = 0; i < this._numSteps; ++i) {
        const step = this._steps[i];
        step.setFrequency(newFreq);
        step.setActive(false);
      }
      return true;
    });

    this._randomizeButton = this._resetButton.connectNode(Direction.FORWARD, new BlockNode('b'));
    this._randomizeButton.value().setLabel("Randomize");
    this._randomizeButton.value().interact().setClickListener(()=>{
      for (let i = 0; i < this._numSteps; ++i) {
        const step = this._steps[i];
        step.randomize();
        step.setActive(false);
      }
      return true;
    });

    this._detuneSlider = this._randomizeButton.connectNode(Direction.DOWNWARD, new SliderNode());
    this._detuneSlider.value().setVal(0.5);
    this._detuneSlider.value().setOnChange(()=>{
      for (let i = 0; i < Object.keys(this._voices).length; ++i) {
        const voice = this._voices[Object.keys(this._voices)[i]];
        voice.osc.detune.setValueAtTime(
          this._detuneScale * (this._detuneSlider.value().val() - 0.5),
          voice.osc.context.currentTime
        );
      }
    });

    const n = car.spawn('d', 'u', 'c');
    car.pull('d');
    const l = n.connectNode(Direction.BACKWARD, new BlockNode('s'));
    const y = copyStyle('b');
    y.backgroundColor = new Color(1, 1, 0, 1);
    l.value().setBlockStyle(y);
    l.value().setLabel("Oscillator");
    let rootStep = n;
    const voices = ["sine", "sawtooth", "square", "triangle"];
    for (let i = 0; i < this._numSteps; ++i) {
      const newStep = new SequenceStep(this, i);
      const v = voices[Math.floor(Math.random() * voices.length)];
      newStep._type = v;
      this._steps.push(newStep);
      rootStep.connectNode(Direction.FORWARD, newStep.node());
      rootStep = newStep.node();
      rootStep.value().interact().setClickListener(
        function () {
          const that = this[0];
          const i = this[1];
          if (that._playing) {
            return true;
          }
          that._currentStep = i;
          return false;
        },
        [this, i]
      );
    }
    let addStep = rootStep.connectNode(Direction.FORWARD, new BlockNode('u'));
    addStep.value().setLabel("+");

    addStep = n.connectNode(Direction.DOWNWARD, new BlockNode('u'));
    addStep.value().setLabel("+");
    return this._containerNode;
  };
}
