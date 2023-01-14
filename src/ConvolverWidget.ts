import generateID from "parsegraph-generateid";
import { BlockNode, BlockCaret } from "parsegraph-block";
import { Projector } from "parsegraph-projector";
import Direction from "parsegraph-direction";
import { SliderNode } from "parsegraph-slider";

// https://stackoverflow.com/questions/22525934/connecting-convolvernode-to-an-oscillatornode-with-the-web-audio-the-simple-wa
export function impulseResponse(
  audioContext: AudioContext,
  duration: number,
  decay: number,
  reverse: boolean
) {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioContext.createBuffer(2, length, sampleRate);
  const impulseL = impulse.getChannelData(0);
  const impulseR = impulse.getChannelData(1);

  if (!decay) decay = 2.0;
  for (let i = 0; i < length; i++) {
    const n = reverse ? length - i : i;
    impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
  }
  return impulse;
}

export default class ConvolverWidget {
  _id: string;
  _proj: Projector;
  _duration: number;
  _decay: number;
  _maxDecay: number;
  _maxDuration: number;
  _reversed: boolean;
  _containerNode: BlockNode;
  _convolver: ConvolverNode;

  constructor(proj: Projector) {
    this._id = generateID("Convolver");
    this._proj = proj;
    this._containerNode = null;

    this._duration = 0.25;
    this._decay = 0.25;

    this._maxDuration = 8;
    this._maxDecay = 8;
    this._reversed = false;
  }

  audio() {
    return this._proj.audio();
  }

  private refresh() {
    const convolver = this.audioNode();
    if (this._duration == 0 || this._decay == 0) {
      convolver.buffer = null;
    } else {
      convolver.buffer = impulseResponse(
        this.audio(),
        this._duration,
        this._decay,
        this._reversed
      );
    }
  }

  audioNode() {
    if (!this._convolver) {
      this._convolver = this.audio().createConvolver();
      this.refresh();
    }
    return this._convolver;
  }

  node() {
    if (this._containerNode) {
      return this._containerNode;
    }
    const car = new BlockCaret("b");
    this._containerNode = car.root();
    car.label("Convolver");

    car.spawnMove("i", "u", "v");
    car.pull("d");
    car.shrink();
    const aSlider = new SliderNode();
    car.label("Decay");
    car.node().connectNode(Direction.DOWNWARD, aSlider);
    car.spawnMove("f", "u");
    car.pull("d");
    car.shrink();
    const bSlider = new SliderNode();
    car.label("Duration");
    car.node().connectNode(Direction.DOWNWARD, bSlider);

    aSlider.value().setVal(this._decay / this._maxDecay);
    aSlider.value().setOnChange(() => {
      this._decay = Math.pow(aSlider.value().val(), 2) * this._maxDecay;
      this.refresh();
    });
    bSlider.value().setVal(this._duration / this._maxDuration);
    bSlider.value().setOnChange(() => {
      this._duration = Math.pow(bSlider.value().val(), 2) * this._maxDuration;
      this.refresh();
    });

    car.spawnMove("f", "u");
    car.pull("d");
    car.shrink();
    const reversedButton = car.spawn("d", "s");
    reversedButton.value().setLabel("Reverse");
    reversedButton
      .value()
      .interact()
      .setClickListener(() => {
        this._reversed = !this._reversed;
        this.refresh();
        return true;
      });

    return this._containerNode;
  }
}
