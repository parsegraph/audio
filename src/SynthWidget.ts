import generateID from "parsegraph-generateid";
import { copyStyle, BlockStyle, BlockNode, BlockCaret } from "parsegraph-block";
import { Projector } from "parsegraph-projector";
import Direction, { Alignment } from "parsegraph-direction";
import { SliderNode } from "parsegraph-slider";
import Method from "parsegraph-method";
import { getSelStyle, getUnselStyle } from "./updateUnsel";

export default class SynthWidget {
  _id: string;
  _proj: Projector;
  _containerNode: BlockNode;
  _oscType: OscillatorType;
  _oscDetune: number;
  _types: any;
  _listeners: any[];
  _oscFrequency: number;
  _keyListener: Method;

  constructor(proj: Projector) {
    this._id = generateID("Synth");
    this._proj = proj;
    this._containerNode = null;
    this._oscType = "sine";
    this._oscDetune = 0;
    this._types = {};

    this._listeners = [];
    this._keyListener = new Method();
  }

  audio() {
    return this._proj.audio();
  }

  build() {
    const oscillator = this.audio().createOscillator();
    oscillator.frequency.value = this._oscFrequency;
    oscillator.type = this._oscType;
    oscillator.detune.value = this._oscDetune;
    return oscillator;
  }

  addListener(listener: Function, listenerThisArg?: any) {
    const l = [listener, listenerThisArg];
    this._listeners.push(l);
    return () => {
      for (let i = 0; i < this._listeners.length; ++i) {
        if (this._listeners[i] === l) {
          this._listeners.splice(i, 1);
        }
      }
    };
  }

  notePlayed(freq: number) {
    for (let i = 0; i < this._listeners.length; ++i) {
      const l = this._listeners[i];
      l[0].call(l[1], freq);
    }
  }

  setOscillatorType(oscType: OscillatorType) {
    this._oscType = oscType;
  }

  setOscillatorDetune(value: number) {
    this._oscDetune = value;
  }

  play(freq: number) {
    this._keyListener.call(freq);
    this.notePlayed(freq);
  }

  onPlay(keyListener: Function, keyListenerThisArg?: any) {
    this._keyListener.set(keyListener, keyListenerThisArg);
  }

  refreshTypes() {
    for (const type in this._types) {
      if (Object.prototype.hasOwnProperty.call(this._types, type)) {
        this._types[type]
          .value()
          .setBlockStyle(
            this._oscType == type ? getSelStyle() : getUnselStyle()
          );
      }
    }
  }

  node() {
    if (!this._containerNode) {
      const car = new BlockCaret("b");
      this._containerNode = car.root();
      car.label("Synthesizer");

      car.spawnMove("i", "u", "v");
      car.pull("d");
      car.push();
      car.shrink();
      car.spawnMove("d", "s");
      car.label("Type");
      car.push();
      ["sine", "square", "sawtooth", "triangle"].forEach((oscType, i) => {
        const t = oscType === this._oscType ? "b" : "s";
        if (i == 0) {
          car.spawnMove("i", t, "v");
          car.shrink();
        } else {
          car.spawnMove("f", t);
        }
        this._types[oscType] = car.node();
        car.onClick(function () {
          this.setOscillatorType(oscType);
          this.refreshTypes();
          return true;
        }, this);
        car.label(oscType);
      });
      this.refreshTypes();
      car.pop();
      car.pop();

      // Detune
      car.spawnMove("f", "u");
      car.spawnMove("d", "s");
      car.label("Detune");
      car.push();
      const detuneSlider = new SliderNode();
      car.node().connectNode(Direction.DOWNWARD, detuneSlider);
      car.move("d");
      detuneSlider.value().setOnChange((val: number) => {
        this.setOscillatorDetune(val * 200);
        console.log("Detune: " + this._oscDetune);
      });
      car.pop();

      car.moveToRoot();

      const keyBlock = copyStyle("s");
      // keyBlock.minHeight = keyBlock.minHeight * 10;
      keyBlock.horizontalSeparation = 0;
      keyBlock.verticalSeparation = 0;
      keyBlock.fontSize = keyBlock.fontSize / 3;
      [
        16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5,
        29.14, 30.87, 32.7, 34.65, 36.71, 38.89, 41.2, 43.65, 46.25, 49.0,
        51.91, 55.0, 58.27, 61.74, 65.41, 69.3, 73.42, 77.78, 82.41, 87.31,
        92.5, 98.0, 103.83, 110.0, 116.54, 123.47, 130.81, 138.59, 146.83,
        155.56, 164.81, 174.61, 185.0, 196.0, 207.65, 220.0, 233.08, 246.94,
        261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.0, 415.3,
        440.0, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.25, 698.46,
        739.99, 783.99, 830.61, 880.0, 932.33, 987.77, 1046.5, 1108.73, 1174.66,
        1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22, 1760.0, 1864.66,
        1975.53, 2093.0, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96,
        3135.96, 3322.44, 3520.0, 3729.31, 3951.07, 4186.01, 4434.92, 4698.63,
        4978.03, 5274.04, 5587.65, 5919.91, 6271.93, 6644.88, 7040.0, 7458.62,
        7902.13,
      ].forEach((freq, i) => {
        let key;
        if (i % 12 == 0) {
          if (i != 0) {
            car.pop();
          }
          key = car.spawnMove("d", "s");
          if (i == 0) {
            key
              .parentNode()
              .setNodeAlignmentMode(Direction.DOWNWARD, Alignment.CENTER);
          }
          car.push();
        } else {
          key = car.spawnMove("f", "s");
        }
        car.label("" + freq);
        key.value().setBlockStyle(keyBlock);
        key.value().interact().setImmediateClick(true);
        key
          .value()
          .interact()
          .setClickListener(() => {
            this.play(freq);
            return true;
          });
      });
      car.pop();
    }
    return this._containerNode;
  }
}
