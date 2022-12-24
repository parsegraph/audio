import generateID from 'parsegraph-generateid';
import { BlockNode, BlockStyle, BlockCaret, copyStyle } from "parsegraph-block";
import { Projector } from "parsegraph-projector";
import Direction, {Alignment} from "parsegraph-direction";
import { SliderNode } from "parsegraph-slider";
import Color from 'parsegraph-color';
import OnOffWidget from './OnOffWidget';

export default class SingleOscillatorWidget {
  _id:string;
  _proj:Projector;
  _containerNode:BlockNode;
  _osc:OscillatorNode;
  _gain:GainNode;
  _sink:AudioDestinationNode;
  _minFrequency:number;
  _frequencyRange:number;
  _maxTremoloFreq:number
  _maxTremoloRange:number;
  _maxWarbleFreq:number;
  _maxWarbleRange:number;
  _slowestFreq:number;
  _sliderCurve:number;
  _offStyle:BlockStyle;
  _redStyle:BlockStyle;
  _bulb: BlockNode;
  _tremolo:OscillatorNode;
  _tremoloSink:GainNode;
  _warble:OscillatorNode;
  _warbleSink:GainNode;
  _masterSwitch: OnOffWidget;
  _freqSlider: SliderNode;
  _tremoloSwitch: OnOffWidget;
  _tremoloSlider: SliderNode;
  _tremoloScaleSlider:SliderNode;
  _warbleScaleSlider: SliderNode;
  _warbleSwitch: OnOffWidget;
  _warbleSlider: SliderNode;

  constructor(proj: Projector) {
    this._id = generateID("SingleOscillator");
    this._proj = proj;
    this._containerNode = null;
    this._osc = null;
    this._gain = null;
    this._sink = null;
    this._minFrequency = 16;
    this._frequencyRange = 2000;
    this._maxTremoloFreq = 40;
    this._maxTremoloRange = 1.5;
    this._maxWarbleFreq = 100;
    this._maxWarbleRange = 2000;
    this._slowestFreq = 1 / 5;
    this._sliderCurve = 2;
  }

  node() {
    if (!this._containerNode) {
      const car = new BlockCaret('b');
      car.node().value().interact().setIgnoreMouse(true);
      this._containerNode = car.root();
      car.label("Single Oscillator");
      car.spawnMove("i", "u", "v");

      const offStyle = copyStyle('u');
      offStyle.backgroundColor = new Color(0.7, 0.7, 0.7, 1);
      offStyle.borderColor = new Color(0.5, 0.5, 0.5, 1);
      offStyle.minWidth *= 4;
      offStyle.minHeight *= 4;
      offStyle.borderRoundness *= 2.5;
      offStyle.borderThickness *= 2;
      this._offStyle = offStyle;

      const redStyle = copyStyle('u');
      redStyle.backgroundColor = new Color(1, 0, 0, 1);
      redStyle.borderColor = new Color(1, 0.5, 0.5, 1);
      redStyle.minWidth *= 4;
      redStyle.minHeight *= 4;
      redStyle.borderRoundness *= 2.5;
      redStyle.borderThickness *= 2;
      this._redStyle = redStyle;
      car.node().value().setBlockStyle(offStyle);
      car.node().value().interact().setIgnoreMouse(true);
      this._bulb = car.node();
      car.spawnMove("d", "u", "c");
      car.pull("d");

      this._masterSwitch = new OnOffWidget();
      car.connect("d", this._masterSwitch.node());
      this._masterSwitch.setOnOn(()=>{
        this.play();
        return true;
      });
      this._masterSwitch.setOnOff(()=>{
        this.stop();
        return true;
      });

      const whiteStyle = copyStyle('s');
      whiteStyle.borderColor = new Color(0.2, 0.2, 0.2, 1);
      whiteStyle.backgroundColor = new Color(1, 1, 1, 1);
      car.spawnMove("f", "u");
      car.pull("d");

      car.push();
      car.spawnMove("d", "s");
      car.label("Frequency");
      this._freqSlider = new SliderNode();
      car.node().setNodeAlignmentMode(Direction.INWARD, Alignment.INWARD_VERTICAL);
      car.node().connectNode(Direction.INWARD, this._freqSlider);
      this._freqSlider.value().setVal(0.05);
      this._freqSlider.value().setOnChange((val:number)=>{
        if (!this._osc) {
          return;
        }
        this._osc.frequency.exponentialRampToValueAtTime(
          this._minFrequency +
            this._frequencyRange *
              Math.pow(val, this._sliderCurve),
          this.audio().currentTime + 0.1
        );
      });
      car.pop();
      car.spawnMove("f", "u");
      car.pull("d");

      car.push();

      this._tremoloSwitch = new OnOffWidget();
      car.connect("d", this._tremoloSwitch.node());
      this._tremoloSwitch.setOnOn(this.refresh, this);
      this._tremoloSwitch.setOnOff(this.refresh, this);
      car.move("d");
      car.spawnMove("d", "s");
      car.label("Tremolo");

      car.node().setNodeAlignmentMode(Direction.INWARD, Alignment.INWARD_VERTICAL);
      this._tremoloSlider = new SliderNode();
      car.node().connectNode(Direction.INWARD, this._tremoloSlider);
      this._tremoloSlider.value().setVal(0.3);
      this._tremoloSlider.value().setOnChange((val: number)=>{
        if (!this._osc || !val) {
          return;
        }
        this._tremolo.frequency.setTargetAtTime(
          Math.max(
            this._slowestFreq,
            this._maxTremoloFreq *
              Math.pow(val, this._sliderCurve)
          ),
          this.audio().currentTime,
          0.1
        );
      });

      this._tremoloScaleSlider = new SliderNode();
      car.node().connectNode(Direction.DOWNWARD, this._tremoloScaleSlider);
      car.move('d');
      this._tremoloScaleSlider.value().setVal(1);
      this._tremoloScaleSlider.value().setOnChange(()=>this.refresh());
      car.pop();
      car.spawnMove("f", "u");
      car.pull("d");

      car.push();
      this._warbleSwitch = new OnOffWidget();
      car.connect("d", this._warbleSwitch.node());
      this._warbleSwitch.setOnOn(this.refresh, this);
      this._warbleSwitch.setOnOff(this.refresh, this);
      car.move("d");
      car.spawnMove("d", "s");
      car.label("Warble");

      this._warbleSlider = new SliderNode();
      car.node().setNodeAlignmentMode(Direction.INWARD, Alignment.INWARD_VERTICAL);
      car.node().connectNode(Direction.INWARD, this._warbleSlider);
      car.move('i');
      this._warbleSlider.value().setVal(0.3);
      this._warbleSlider.value().setOnChange((val:number)=>{
        if (!this._osc) {
          return;
        }
        this._warble.frequency.setTargetAtTime(
          Math.max(
            this._slowestFreq,
            this._maxWarbleFreq *
              Math.pow(val, this._sliderCurve)
          ),
          this.audio().currentTime,
          0.1
        );
      });
      car.move("o");
      this._warbleScaleSlider = new SliderNode();
      car.node().connectNode(Direction.DOWNWARD, this._warbleScaleSlider);
      car.move('d');

      this._warbleScaleSlider.value().setVal(1);
      this._warbleScaleSlider.value().setOnChange((val:number)=>{
        if (!this._osc || !val) {
          return;
        }
        this._warbleSink.gain.setValueAtTime(
          this._maxWarbleRange *
            Math.pow(val, this._sliderCurve),
          this.audio().currentTime
        );
      });
      car.pop();
    }
    return this._containerNode;
  };

  refresh() {
    if (!this._osc) {
      return;
    }
    this._osc.frequency.setValueAtTime(
      this._minFrequency +
        this._frequencyRange *
          Math.pow(this._freqSlider.value().val(), this._sliderCurve),
      this.audio().currentTime
    );
    if (this._tremoloSwitch.value()) {
      this._tremolo.frequency.setValueAtTime(
        this._maxTremoloFreq *
          Math.pow(this._tremoloSlider.value().val(), this._sliderCurve),
        this.audio().currentTime
      );
      this._tremoloSink.gain.setValueAtTime(
        this._maxTremoloRange *
          Math.pow(this._tremoloScaleSlider.value().val(), this._sliderCurve),
        this.audio().currentTime
      );
      // console.log(this._maxTremoloRange * Math.pow(
      //   this._tremoloScaleSlider.value(), this._sliderCurve));
    } else {
      this._tremolo.frequency.setValueAtTime(0, this.audio().currentTime, 0.1);
      this._tremoloSink.gain.setValueAtTime(0, this.audio().currentTime);
    }
    if (this._warbleSwitch.value()) {
      this._warble.frequency.setValueAtTime(
        this._maxWarbleFreq *
          Math.pow(this._warbleSlider.value().val(), this._sliderCurve),
        this.audio().currentTime
      );
      this._warbleSink.gain.setValueAtTime(
        this._maxWarbleRange *
          Math.pow(this._warbleScaleSlider.value().val(), this._sliderCurve),
        this.audio().currentTime
      );
    } else {
      this._warble.frequency.setValueAtTime(0, this.audio().currentTime);
      this._warbleSink.gain.setValueAtTime(0, this.audio().currentTime);
    }
  };

  audioOut() {
    if (this._osc) {
      return this._osc;
    }
    this._osc = this.audio().createOscillator();
    this._osc.start();
    this._gain = this.audio().createGain();
    this._osc.connect(this._gain);

    this._gain.connect(this._sink);
    this._tremolo = this.audio().createOscillator();
    this._tremolo.start();

    this._tremoloSink = this.audio().createGain();

    this._warble = this.audio().createOscillator();
    this._warble.start();

    this._warbleSink = this.audio().createGain();
    this._warbleSink.gain.setValueAtTime(
      this._maxWarbleRange *
        Math.pow(this._warbleScaleSlider.value().val(), this._sliderCurve),
      this.audio().currentTime
    );
    this.stop();

    return this._osc;
  };

  audio() {
    return this._proj.audio();
  }

  scheduleRepaint() {
    //this._graph.scheduleRepaint();
  }

  play() {
    if (!this._sink) {
      this._sink = this.audio().destination;
    }
    if (!this._osc) {
      // Create the node if needed.
      this.audioOut();
    }
    this._bulb.value().setBlockStyle(this._redStyle);
    this.scheduleRepaint();

    // this._gain.gain.cancelScheduledValues(this.audio().currentTime);
    this._gain.gain.setTargetAtTime(1, this.audio().currentTime, 0.1);

    // this._loudnessNode = this.audio().createConstantSource();
    // this._loudnessNode.connect(this._gain.gain);

    this._tremolo.connect(this._tremoloSink);
    this._tremoloSink.connect(this._gain.gain);
    this._warble.connect(this._warbleSink);
    this._warbleSink.connect(this._osc.detune);

    this.refresh();
  };

  stop() {
    if (!this._gain) {
      return;
    }
    this._bulb.value().setBlockStyle(this._offStyle);
    this.scheduleRepaint();

    // this._gain.gain.cancelScheduledValues(this.audio().currentTime);
    this._gain.gain.setTargetAtTime(0, this.audio().currentTime, 0.1);
    this._osc.frequency.setTargetAtTime(0, this.audio().currentTime, 0.1);
    this._tremolo.frequency.setTargetAtTime(0, this.audio().currentTime, 0.1);
    this._warble.frequency.setTargetAtTime(0, this.audio().currentTime, 0.1);
  };
}
