import { BlockNode, BlockCaret } from "parsegraph-block";
import { Projector } from "parsegraph-projector";
import Direction, { Alignment } from "parsegraph-direction";
import Method from "parsegraph-method";
import { getSelStyle, getUnselStyle } from "./updateUnsel";
import { SliderNode } from "parsegraph-slider";

export default class FilterWidget {
  _listener: Method;
  _proj: Projector;
  _frequency: number;
  _q: number;
  _gain: number;
  _detune: number;
  _type: "passthrough" | BiquadFilterType;
  _containerNode: BlockNode;
  _types: any;
  _typeNode: BlockNode;
  _frequencyNode: BlockNode;
  _qNode: BlockNode;
  _gainNode: BlockNode;
  _detuneNode: BlockNode;

  constructor(proj: Projector) {
    this._proj = proj;
    this._frequency = 440;
    this._q = 0;
    this._gain = 0;
    this._detune = 0;
    this._type = "peaking";
    this._containerNode = null;
    this._types = {};

    this._listener = new Method();
  }

  update() {
    this._listener.call();
  }

  setUpdateListener(listener: Function, listenerThisArg?: any) {
    this._listener.set(listener, listenerThisArg);
  }

  setDetune(value: number) {
    this._detune = value;
    this.update();
  }

  setFrequency(value: number) {
    this._frequency = value;
    this.update();
  }

  setGain(value: number) {
    this._gain = value;
    this.update();
  }

  setQ(value: number) {
    this._q = value;
    this.update();
  }

  audio() {
    return this._proj.audio();
  }

  build() {
    const n = this.audio().createBiquadFilter();
    this.save(n);
    return n;
  }

  save(n: BiquadFilterNode) {
    if (!Number.isNaN(this._detune)) {
      n.detune.value = this._detune;
    }
    if (!Number.isNaN(this._q)) {
      n.Q.value = this._q;
    }
    if (!Number.isNaN(this._gain)) {
      n.gain.value = this._gain;
    }
    if (this._type !== "passthrough") {
      n.type = this._type;
    }
  }

  load(n: BiquadFilterNode) {
    this._detune = n.detune.value;
    this._q = n.Q.value;
    this._gain = n.gain.value;
    this._frequency = n.frequency.value;
    this._type = n.type;
    this.refreshTypes();
  }

  refreshTypes() {
    for (const type in this._types) {
      if (Object.prototype.hasOwnProperty.call(this._types, type)) {
        const node = this._types[type];
        if (this._type == type) {
          node.value().setBlockStyle(getSelStyle());
        } else {
          node.value().setBlockStyle(getUnselStyle());
        }
      }
    }
  }

  typeNode() {
    if (!this._typeNode) {
      const car = new BlockCaret("s");
      this._typeNode = car.root();
      car.label("Type");

      [
        "passthrough",
        "lowpass",
        "highpass",
        "bandpass",
        "lowshelf",
        "highshelf",
        "peaking",
        "notch",
        "allpass",
      ].forEach(function (type, i) {
        if (i == 0) {
          car.spawnMove("i", "s", "v");
        } else {
          car.spawnMove("f", "s");
        }
        car.label(type);
        car.node().value().interact().setImmediateClick(true);
        car
          .node()
          .value()
          .interact()
          .setClickListener(()=>{
            this._type = type;
            this.refreshTypes();
            this.update();
            return true;
          });

        this._types[type] = car.node();
      }, this);
      this.refreshTypes();
      this._typeNode = car.root();
    }
    return this._typeNode;
  }

  frequencyNode() {
    if (!this._frequencyNode) {
      const car = new BlockCaret("s");
      car.label("Frequency");
      this._frequencyNode = car.root();
      const MAXFS = 20000;
      let FS = 2000;
      car
        .node()
        .setNodeAlignmentMode(Direction.INWARD, Alignment.INWARD_VERTICAL);
      const magnitudeSlider = car
        .node()
        .connectNode(Direction.INWARD, new SliderNode());
      const valueSlider = car
        .node()
        .connectNode(Direction.DOWNWARD, new SliderNode());
      magnitudeSlider.value().setOnChange(() => {
        FS = magnitudeSlider.value().val() * MAXFS;
        if (valueSlider.value().val() > FS) {
          this.setFrequency(FS);
        }
        valueSlider.value().setVal(this._frequency / FS);
      });
      magnitudeSlider.value().setVal(FS / MAXFS);
      valueSlider.value().setVal(this._frequency / FS);
      valueSlider.value().setOnChange(() => {
        this.setFrequency(
          valueSlider.value().val() * magnitudeSlider.value().val() * FS
        );
      });
    }
    return this._frequencyNode;
  }

  qNode() {
    if (!this._qNode) {
      const car = new BlockCaret("s");
      car.label("Q");
      this._qNode = car.root();
      const MAXFS = 20000;
      let FS = 2000;
      car
        .node()
        .setNodeAlignmentMode(Direction.INWARD, Alignment.INWARD_VERTICAL);
      const magnitudeSlider = car
        .node()
        .connectNode(Direction.INWARD, new SliderNode());
      const valueSlider = car
        .node()
        .connectNode(Direction.DOWNWARD, new SliderNode());
      magnitudeSlider.value().setOnChange(() => {
        FS = magnitudeSlider.value().val() * MAXFS;
        if (valueSlider.value().val() > FS) {
          this.setQ(FS);
        }
        valueSlider.value().setVal(this._q / FS);
      });
      magnitudeSlider.value().setVal(FS / MAXFS);
      valueSlider.value().setVal(this._q / FS);
      valueSlider.value().setOnChange(() => {
        this.setQ(
          valueSlider.value().val() * magnitudeSlider.value().val() * FS
        );
      });
    }
    return this._qNode;
  }

  gainNode() {
    if (!this._gainNode) {
      const car = new BlockCaret("s");
      car.label("Gain");
      this._gainNode = car.root();
      const valueSlider = car
        .node()
        .connectNode(Direction.DOWNWARD, new SliderNode());
      valueSlider.value().setVal((this._gain + 40) / 80);
      valueSlider.value().setOnChange((val: number) => {
        this.setGain(-40 + 80 * val);
      });
    }
    return this._gainNode;
  }

  detuneNode() {
    if (!this._detuneNode) {
      const car = new BlockCaret("s");
      car.label("Detune");
      this._detuneNode = car.root();
      const MAXFS = 20000;
      let FS = 2000;
      const valueSlider = car
        .node()
        .connectNode(Direction.DOWNWARD, new SliderNode());
      valueSlider.value().setVal((this._gain + 40) / 80);

      const magnitudeSlider = car
        .node()
        .connectNode(Direction.INWARD, new SliderNode());
      magnitudeSlider.value().setOnChange((val: number) => {
        FS = magnitudeSlider.value().val() * MAXFS;
        if (val > FS) {
          this.setDetune(FS);
        }
        valueSlider.value().setVal(this._detune / FS);
      });
      magnitudeSlider.value().setVal(FS / MAXFS);
      valueSlider.value().setVal(this._detune / FS);
      valueSlider.value().setOnChange(() => {
        this.setDetune(
          valueSlider.value().val() * magnitudeSlider.value().val() * FS
        );
      });
    }
    return this._detuneNode;
  }

  node() {
    if (!this._containerNode) {
      const car = new BlockCaret("b");
      this._containerNode = car.root();
      car.label("BiquadFilterNode");

      car.connect("i", this.typeNode());
      car.align("i", "v");
      car.move("i");
      car
        .spawnMove("d", "u", "c")
        .connectNode(Direction.DOWNWARD, this.frequencyNode());
      car.pull("d");
      car.spawnMove("f", "u").connectNode(Direction.DOWNWARD, this.qNode());
      car.pull("d");
      car.spawnMove("f", "u").connectNode(Direction.DOWNWARD, this.gainNode());
      car.pull("d");
      car
        .spawnMove("f", "u")
        .connectNode(Direction.DOWNWARD, this.detuneNode());
    }
    return this._containerNode;
  }
}
