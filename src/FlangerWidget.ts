import { Projector } from "parsegraph-projector";
import { BlockCaret, BlockNode } from "parsegraph-block";
import generateID from "parsegraph-generateid";
import Direction, { Alignment } from "parsegraph-direction";
import { SliderNode } from "parsegraph-slider";

export default class FlangerWidget {
  _id: string;
  _proj: Projector;
  _containerNode: BlockNode;
  _listeners: any[];
  _maxDelay: number;
  _delay: DelayNode;
  _gain: GainNode;
  _osc: OscillatorNode;
  _onButton: BlockNode;
  _slider: SliderNode;

  audio() {
    return this._proj.audio();
  }

  constructor(proj: Projector) {
    this._id = generateID("Flanger");
    this._proj = proj;
    this._containerNode = null;
    this._listeners = [];
    this._maxDelay = 5;
    this._delay = this.audio().createDelay(this._maxDelay);
    this._gain = this.audio().createGain();
    this._gain.gain.setValueAtTime(
      this._maxDelay / 2,
      this.audio().currentTime
    );
    this._osc.connect(this._gain);
    this._osc = this.audio().createOscillator();
    this._osc.frequency.setValueAtTime(5, this.audio().currentTime);
    this._osc.start();
    this._gain.connect(this._delay.delayTime);
  }

  audioNode() {
    return this._delay;
  }

  node() {
    if (this._containerNode) {
      return this._containerNode;
    }
    const car = new BlockCaret("s");
    this._containerNode = car.root();
    car.label("Flange");
    car.fitExact();

    this._containerNode.setNodeAlignmentMode(
      Direction.INWARD,
      Alignment.INWARD_VERTICAL
    );
    const onOff = this._containerNode.connectNode(
      Direction.INWARD,
      new BlockNode("b")
    );
    onOff.value().setLabel("Play");
    this._onButton = onOff;

    const slider = onOff.connectNode(Direction.DOWNWARD, new SliderNode());
    slider.value().setVal(0.5);
    slider.value().setOnChange(() => {
      if (onOff.value().label() === "Stop") {
        this._delay.delayTime.value =
          this._maxDelay * this._slider.value().val();
      }
    });
    this._slider = slider;

    onOff
      .value()
      .interact()
      .setClickListener(() => {
        if (onOff.value().label() === "Play") {
          onOff.value().setLabel("Stop");
          this._delay.delayTime.value =
            this._slider.value().val() * this._maxDelay;
        } else {
          onOff.value().setLabel("Play");
          this._delay.delayTime.value = 0;
        }
        return true;
      });

    return this._containerNode;
  }
}
