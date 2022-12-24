import generateID from "parsegraph-generateid";
import { BlockNode, BlockCaret } from "parsegraph-block";
import { Projector } from "parsegraph-projector";
import Direction, {Alignment} from "parsegraph-direction";

export default class WhiteNoiseWidget {
  _proj: Projector;
  _id: string;
  _containerNode: BlockNode;
  _listeners: any[];
  _audioNode: ScriptProcessorNode;
  _active: boolean;
  _onButton: BlockNode;

  constructor(proj:Projector) {
    this._id = generateID("WhiteNoise");
    this._proj = proj;
    this._containerNode = null;
    this._listeners = [];
    this._audioNode = null;
  }

  audio() {
    return this._proj.audio();
  }

  audioNode() {
    if (!this._audioNode) {
      const audio = this.audio();
      this._audioNode = audio.createScriptProcessor(4096, 1, 1);
      this._audioNode.onaudioprocess = (audioProcessingEvent)=>{
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
          const outputData = outputBuffer.getChannelData(channel);

          // Loop through the 4096 samples
          for (let sample = 0; sample < inputBuffer.length; sample++) {
            if (this._active) {
              outputData[sample] = Math.random();
            } else {
              outputData[sample] = inputData[sample];
            }
          }
        }
      };
    }
    return this._audioNode;
  };

  node() {
    if (this._containerNode) {
      return this._containerNode;
    }
    const car = new BlockCaret('s');
    this._containerNode = car.root();
    car.label("WhiteNoise");
    car.fitExact();

    this._containerNode.setNodeAlignmentMode(
      Direction.INWARD,
      Alignment.INWARD_VERTICAL
    );
    const onOff = car.spawn('i', 'b');
    onOff.value().setLabel("Play");
    this._onButton = onOff;

    onOff.value().interact().setClickListener(()=>{
      this._active = !this._active;
      if (this._active) {
        onOff.value().setLabel("Stop");
      } else {
        onOff.value().setLabel("Play");
      }
      return true;
    });

    return this._containerNode;
  };
}
