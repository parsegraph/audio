import generateID from "parsegraph-generateid";
import { BlockNode, BlockCaret } from "parsegraph-block";
import { Projector } from "parsegraph-projector";
import Direction, { Alignment } from "parsegraph-direction";
import { SliderNode } from "parsegraph-slider";
import { getSelStyle, getUnselStyle } from "./updateUnsel";

export default class OscillatorWidget {
  _proj: Projector;
  _containerNode: BlockNode;
  _oscType: OscillatorType;
  _oscFrequency: number;
  _oscDetune: number;
  _types: any;
  _id: string;

  constructor(proj: Projector) {
    this._id = generateID("Oscillator");
    this._proj = proj;
    this._containerNode = null;
    this._oscType = "sine";
    this._oscFrequency = 440;
    this._oscDetune = 0;
    this._types = {};
  }

  audio() {
    return this._proj.audio();
  }

  build() {
    const audio = this.audio();
    const oscillator = audio.createOscillator();
    oscillator.frequency.setValueAtTime(this._oscFrequency, audio.currentTime);
    oscillator.type = this._oscType;
    oscillator.detune.setValueAtTime(this._oscDetune, audio.currentTime);
    return oscillator;
  }

  setOscillatorType(oscType: OscillatorType) {
    this._oscType = oscType;
  }

  setOscillatorFrequency(value: number) {
    this._oscFrequency = value;
  }

  setOscillatorDetune(value: number) {
    this._oscDetune = value;
  }

  refreshTypes() {
    for (const type in this._types) {
      if (Object.prototype.hasOwnProperty.call(this._types, type)) {
        this._types[type].setBlockStyle(
          this._oscType == type ? getSelStyle() : getUnselStyle()
        );
      }
    }
  }

  node() {
    let FS = 500;
    const MAXFS = 3000;
    if (!this._containerNode) {
      const car = new BlockCaret("b");
      this._containerNode = car.root();
      car.label("Oscillator");
      // car.fitExact();

      car.spawnMove("i", "b", "v");

      car.push();
      car.pull("d");
      car.shrink();
      car.spawnMove("d", "s");
      car.label("Type");
      car.push();
      ["sine", "square", "sawtooth", "triangle"].forEach(function (oscType, i) {
        const t = oscType === this._oscType ? "b" : "s";
        if (i == 0) {
          car.spawnMove("i", t, "v");
          car.shrink();
        } else {
          car.spawnMove("f", t);
        }
        this._types[oscType] = car.node();
        car.onClick(() => {
          this.setOscillatorType(oscType);
          this.refreshTypes();
          return true;
        });
        car.label(oscType);
      }, this);
      this.refreshTypes();
      car.pop();
      car.pop();

      // Frequency
      car.spawnMove("f", "u");
      car.push();
      car.pull("d");
      car.spawnMove("d", "s");
      car.label("Frequency");
      car
        .node()
        .setNodeAlignmentMode(Direction.INWARD, Alignment.INWARD_VERTICAL);
      const fsSlider = car
        .node()
        .connectNode(Direction.INWARD, new SliderNode());
      fsSlider.value().setVal(FS / MAXFS);
      fsSlider.value().setOnChange(() => {
        FS = fsSlider.value().val() * MAXFS;
        if (this._oscFrequency > FS) {
          this.setOscillatorFrequency(FS);
        }
        freqSlider.value().setVal(FS > 0 ? this._oscFrequency / FS : 0);
      });
      car.pull("d");
      const freqSlider = car
        .node()
        .connectNode(Direction.DOWNWARD, new SliderNode());
      car.move("d");
      freqSlider.value().setVal(this._oscFrequency / FS);
      freqSlider.value().setOnChange((val: number) => {
        this.setOscillatorFrequency(val * FS);
        // console.log("Frequency=" + this._oscFrequency);
      });
      car.pop();

      // Detune
      car.spawnMove("f", "u");
      car.spawnMove("d", "s");
      car.label("Detune");
      car.push();
      const detuneSlider = car
        .node()
        .connectNode(Direction.DOWNWARD, new SliderNode());
      car.move("d");
      detuneSlider.value().setOnChange((val) => {
        this.setOscillatorDetune(val * 200);
        // console.log("Detune: " + this._oscDetune.value);
      });
      car.pop();
    }
    return this._containerNode;
  }
}
