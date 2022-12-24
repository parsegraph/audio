import { Projector } from "parsegraph-projector";
import { SliderNode } from "parsegraph-slider";
import { BlockNode, BlockCaret } from "parsegraph-block";
import Direction, { Alignment } from "parsegraph-direction";

function makeDistortionCurve(amount: number) {
  const k = typeof amount === "number" ? amount : 50;
  const nSamples = 44100;
  const curve = new Float32Array(nSamples);
  const deg = Math.PI / 180;
  let i = 0;
  let x;
  for (; i < nSamples; ++i) {
    x = (i * 2) / nSamples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

export default class WaveShaperWidget {
  _proj: Projector;
  _active: boolean;
  _maxAmount: number;
  _oversampling: OverSampleType;
  _waveShapeNode: WaveShaperNode;
  _slider: SliderNode;
  _containerNode: BlockNode;
  _onButton: BlockNode;

  constructor(proj: Projector) {
    this._proj = proj;
    this._active = false;
    this._maxAmount = 100;
    this._oversampling = "none";
    this._containerNode = null;
  }

  audio() {
    return this._proj.audio();
  }

  audioNode() {
    if (!this._waveShapeNode) {
      const audio = this.audio();
      this._waveShapeNode = audio.createWaveShaper();
    }
    this._waveShapeNode.oversample = this._oversampling;
    if (this._slider) {
      this._waveShapeNode.curve = makeDistortionCurve(
        this._slider.value().val() * this._maxAmount
      );
    } else {
      this._waveShapeNode.curve = null;
    }
    return this._waveShapeNode;
  }

  node() {
    if (this._containerNode) {
      return this._containerNode;
    }
    let car = new BlockCaret("s");
    this._containerNode = car.root();
    car.label("WaveShaper");

    this._containerNode.setNodeAlignmentMode(
      Direction.INWARD,
      Alignment.INWARD_VERTICAL
    );
    this._onButton = new BlockNode("b");
    this._containerNode.connectNode(Direction.INWARD, this._onButton);
    this._onButton.value().setLabel("Play");
    this._onButton
      .value()
      .interact()
      .setClickListener(() => {
        this._active = !this._active;
        if (this._active) {
          this._onButton.value().setLabel("Stop");
          if (this._slider) {
            this._waveShapeNode.curve = makeDistortionCurve(
              this._slider.value().val() * this._maxAmount
            );
          }
          console.log("distortion on");
        } else {
          this._onButton.value().setLabel("Start");
          console.log("distortion off");
          this._waveShapeNode.curve = null;
        }
        return true;
      });

    const oversample = new BlockNode("b");
    this._onButton.connectNode(Direction.FORWARD, oversample);
    oversample.state().setScale(0.5);
    car = new BlockCaret(oversample);
    car.label("none");
    car.onClick(() => {
      this._oversampling = "none";
      if (this._active) {
        this._waveShapeNode.oversample = this._oversampling;
      }
      return true;
    });
    car.spawnMove("d", "b");
    car.label("2x");
    car.onClick(() => {
      this._oversampling = "2x";
      if (this._active) {
        this._waveShapeNode.oversample = this._oversampling;
      }
      return true;
    });
    car.spawnMove("d", "b");
    car.label("4x");
    car.onClick(() => {
      this._oversampling = "4x";
      if (this._active) {
        this._waveShapeNode.oversample = this._oversampling;
      }
      return true;
    });

    const slider = new SliderNode();
    this._onButton.connectNode(Direction.DOWNWARD, slider);
    slider.value().setVal(0.5);
    slider.value().setOnChange((val: number) => {
      if (this._active) {
        this._waveShapeNode.curve = makeDistortionCurve(val * this._maxAmount);
      }
    });
    this._slider = slider;

    return this._containerNode;
  }
}
