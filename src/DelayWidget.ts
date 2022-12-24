import generateID from "parsegraph-generateid";
import { BlockNode, BlockCaret } from "parsegraph-block";
import { Projector } from "parsegraph-projector";
import Direction, { Alignment } from "parsegraph-direction";
import { SliderNode } from "parsegraph-slider";

export default class DelayWidget {
  _proj: Projector;
  _containerNode: BlockNode;
  _id: string;
  _listeners: any[];
  _maxDelay: number;
  _delay: DelayNode;
  _onButton: BlockNode;
  _slider: SliderNode;

  constructor(proj: Projector) {
    this._id = generateID("Delay");
    this._proj = proj;
    this._containerNode = null;
    this._listeners = [];
    this._maxDelay = 5;
  }

  audio() {
    return this._proj.audio();
  }

  audioNode() {
    if (!this._delay) {
      this._delay = this.audio().createDelay(this._maxDelay);
    }
    return this._delay;
  }

  node() {
    if (this._containerNode) {
      return this._containerNode;
    }
    const car = new BlockCaret("s");
    this._containerNode = car.root();
    car.label("Delay");
    car.fitExact();

    this._containerNode.setNodeAlignmentMode(
      Direction.INWARD,
      Alignment.INWARD_VERTICAL
    );
    const onOff = new BlockNode("b");
    this._containerNode.connectNode(Direction.INWARD, onOff);
    onOff.value().setLabel("Play");
    this._onButton = onOff;

    const slider = new SliderNode();
    onOff.connectNode(Direction.DOWNWARD, slider);
    slider.value().setVal(0.5);
    slider.value().setOnChange((val: number) => {
      if (onOff.value().label() === "Stop") {
        this._delay.delayTime.value = this._maxDelay * val;
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
