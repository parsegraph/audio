import { Projector } from "parsegraph-projector";
import generateID from "parsegraph-generateid";
import { BlockNode, BlockCaret } from "parsegraph-block";
import Direction, { Alignment } from "parsegraph-direction";
import { SliderNode } from "parsegraph-slider";

export default class EightBitWidget {
  _id: string;
  _containerNode: BlockNode;
  _listeners: any;
  _dither: number;
  _ditherSlider: SliderNode;
  _onButton: any;
  _audioNode: ScriptProcessorNode;
  _active: boolean;
  _projector: Projector;

  constructor(projector: Projector) {
    this._projector = projector;
    this._id = generateID("EightBitWidget");
    this._containerNode = null;
    this._listeners = [];
    this._audioNode = null;
    this._active = false;
    this._dither = 0.02;
    this._ditherSlider = null;
  }

  audioNode() {
    if (!this._audioNode) {
      const audio = this._projector.audio();
      this._audioNode = audio.createScriptProcessor(4096, 1, 1);
      this._audioNode.onaudioprocess = (audioProcessingEvent) => {
        // The input buffer is the song we loaded earlier
        const inputBuffer = audioProcessingEvent.inputBuffer;

        // The output buffer contains the samples that will be modified and played
        const outputBuffer = audioProcessingEvent.outputBuffer;

        // Loop through the output channels (in this case there is only one)
        for (
          let channel = 0;
          channel < outputBuffer.numberOfChannels;
          channel++
        ) {
          const inputData = inputBuffer.getChannelData(channel);
          if (!this._active) {
            outputBuffer.copyToChannel(inputData, channel, 0);
            continue;
          }

          const outputData = outputBuffer.getChannelData(channel);
          // Loop through the 4096 samples
          for (let sample = 0; sample < inputBuffer.length; sample++) {
            // console.log(((inputData[sample]*0xffffFFFF) &
            // (-1 << 24))/0xffffFFFF);
            outputData[sample] =
              ((inputData[sample] * 0xffffffff) & (-1 << 30)) / 0xffffffff;
            outputData[sample] =
              (1 - this._dither) * outputData[sample] +
              this._dither * Math.random();
          }
        }
      };
    }
    return this._audioNode;
  }

  node() {
    if (this._containerNode) {
      return this._containerNode;
    }
    const car = new BlockCaret("s");
    this._containerNode = car.root();
    car.label("8Bit");
    car.fitExact();

    this._containerNode.setNodeAlignmentMode(
      Direction.INWARD,
      Alignment.INWARD_VERTICAL
    );
    const onOff = car.spawn("i", "b");
    onOff.value().setLabel("Play");
    this._onButton = onOff;

    onOff
      .value()
      .interact()
      .setClickListener(() => {
        this._active = !this._active;
        if (this._active) {
          onOff.value().setLabel("Stop");
        } else {
          onOff.value().setLabel("Play");
        }
        return true;
      });

    this._ditherSlider = new SliderNode();
    const slider = this._ditherSlider.value();
    slider.setMin(0);
    slider.setMax(1);
    slider.setVal(this._dither);
    slider.setOnChange((val: number) => {
      this._dither = val;
    });
    car.node().connectNode(Direction.DOWNWARD, this._ditherSlider);

    return this._containerNode;
  }
}
