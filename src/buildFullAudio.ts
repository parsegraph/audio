import {
  DelayWidget,
  ConvolverWidget,
  SingleOscillatorWidget,
  EightBitWidget,
  WaveShaperWidget,
  SequencerWidget,
  FilterWidget,
  SynthWidget,
} from ".";
import { Projector } from "parsegraph-projector";
import { BlockCaret } from "parsegraph-block";
import Direction, { Alignment, PreferredAxis } from "parsegraph-direction";

const buildFullAudio = (proj: Projector) => {
  const audio = proj.audio();

  const compressor = audio.createDynamicsCompressor();
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  // compressor.reduction = -20;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;

  const car = new BlockCaret();
  car.fitExact();
  car.node().setNodeAlignmentMode(Direction.DOWNWARD, Alignment.CENTER);
  const myList = car.spawnMove("d", "u");
  myList.setLayoutPreference(PreferredAxis.VERTICAL);

  const bit = new EightBitWidget(proj);
  car.connect("d", bit.node());
  const sink = bit.audioNode();

  const waveShaperWidget = new WaveShaperWidget(proj);
  const bqf = audio.createBiquadFilter();
  bqf.type = "highpass";
  bqf.frequency.value = 1000;
  bqf.gain.value = 25;
  sink.connect(bqf);
  bqf.connect(waveShaperWidget.audioNode());
  waveShaperWidget.audioNode().connect(compressor);

  const convolverWidget = new ConvolverWidget(proj);
  const convolverNode = convolverWidget.audioNode();
  compressor.connect(convolverNode);

  const delayWidget = new DelayWidget(proj);
  const delay = delayWidget.audioNode();
  convolverNode.connect(delay);
  const delayGain = audio.createGain();
  delay.connect(delayGain);
  delayGain.gain.value = 0.1;
  delayGain.connect(convolverNode);

  convolverNode.connect(audio.destination);
  delayGain.connect(audio.destination);

  /* for(var i = 1; i <= 2; ++i) {
      var dl = audio.createDelay(.2*i);
      dl.delayTime.value = .2*i;
      compressor.connect(dl);
      //dl.connect(bqf);
      dl.connect(audio.destination);
  }*/

  const oscillatorWidget = new SingleOscillatorWidget(proj, bqf);

  const synth = new SynthWidget(proj);
  const osc = audio.createOscillator();
  osc.start();
  const g = audio.createGain();
  g.gain.value = 0;
  osc.connect(g);
  g.connect(sink);
  synth.onPlay((freq: number) => {
    osc.frequency.value = freq;
    osc.type = synth._oscType;
    osc.detune.value = synth._oscDetune;
    g.gain.linearRampToValueAtTime(0, audio.currentTime);
    g.gain.linearRampToValueAtTime(1, audio.currentTime + 0.1);
    g.gain.linearRampToValueAtTime(1, audio.currentTime + 0.9);
    g.gain.linearRampToValueAtTime(0, audio.currentTime + 1);
  });
  car.spawnMove("f", "u").connectNode(Direction.FORWARD, synth.node());
  car.pull("f");

  const sequencerWidget = new SequencerWidget(proj);
  // sequencerWidget.output().connect(sink);
  car.connect("d", sequencerWidget.node());
  sequencerWidget.useSynthesizer(synth);

  const filterWidget = new FilterWidget(proj);
  filterWidget.load(bqf);
  car.spawnMove("u", "u").connectNode(Direction.FORWARD, filterWidget.node());

  car.spawnMove("b", "u");
  car.push();
  car.spawnMove("d", "u");
  car.pull("d");
  car.connect("d", delayWidget.node());
  car.spawnMove("b", "u");
  car.connect("d", waveShaperWidget.node());
  car.pull("d");
  car.spawnMove("b", "u");
  car.connect("d", bit.node());
  car.pop();
  car.connect("u", convolverWidget.node());
  // car.connect('b', new Node(BUD));
  car.connect("b", oscillatorWidget.node());

  let isFiltering = true;
  filterWidget.setUpdateListener(function () {
    if (filterWidget._type == "passthrough") {
      if (isFiltering) {
        sink.disconnect(bqf);
        isFiltering = false;
        sink.connect(compressor);
      }
    } else if (!isFiltering) {
      filterWidget.save(bqf);
      isFiltering = true;
      sink.disconnect(compressor);
      sink.connect(bqf);
    } else {
      filterWidget.save(bqf);
      // sink.disconnect(bqf);
      // sink.connect(bqf);
    }
  });

  return car.root();
};
export default buildFullAudio;
