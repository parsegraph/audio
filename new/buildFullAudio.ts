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
import {Projector } from 'parsegraph-projector';
import {BlockCaret} from 'parsegraph-block';
import Direction, {Alignment, PreferredAxis} from 'parsegraph-direction';

const buildFullAudio = (proj: Projector)=>{
  const car = new BlockCaret();
  car.fitExact();
  car.node().setNodeAlignmentMode(Direction.DOWNWARD, Alignment.CENTER);
  const myList = car.spawnMove('d', 'u');
  myList.setLayoutPreference(PreferredAxis.VERTICAL);

  const bit = new EightBitWidget(proj);
  car.connect("d", bit.node());
    // var sink = bit.audioNode();

    const waveShaperWidget = new WaveShaperWidget(graph);
    /* var bqf = audio.createBiquadFilter();
  bqf.type = "highpass";
  bqf.frequency.value = 1000;
  bqf.gain.value = 25;
  sink.connect(bqf);
  bqf.connect(waveShaperWidget.audioNode());
  waveShaperWidget.audioNode().connect(compressor);*/

    const convolverWidget = new ConvolverWidget(graph);
    // var convolverNode = convolverWidget._convolver;

    // compressor.connect(convolverNode);

    const delayWidget = new DelayWidget(graph);
    // var delay = delayWidget.audioNode();
    // convolverNode.connect(delay);
    /* delayGain = audio.createGain();
  delay.connect(delayGain);
  delayGain.gain.value = 0.1;
  delayGain.connect(convolverNode);

  convolverNode.connect(audio.destination);
  delayGain.connect(audio.destination);
  */

    /* for(var i = 1; i <= 2; ++i) {
      var dl = audio.createDelay(.2*i);
      dl.delayTime.value = .2*i;
      compressor.connect(dl);
      //dl.connect(bqf);
      dl.connect(audio.destination);
  }*/

    const oscillatorWidget = new SingleOscillatorWidget(graph);

    const car = new Caret(myList);
    car.setGlyphAtlas(this._graph.glyphAtlas());

    const synth = new SynthWidget(graph);
    synth.onPlay(function (freq) {
      const osc = audio.createOscillator();
      osc.frequency.value = freq;
      osc.type = synth._oscType;
      osc.detune.value = synth._oscDetune;
      osc.start();
      const g = audio.createGain();
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(1, audio.currentTime + 0.3);
      g.gain.linearRampToValueAtTime(0, audio.currentTime + 0.6);
      osc.connect(g);
      g.connect(sink);
    }, this);
    car.spawnMove("f", "u").connectNode("f", synth.node());
    car.pull("f");

    const sequencerWidget = new SequencerWidget(graph);
    // sequencerWidget.output().connect(sink);
    car.connect("d", sequencerWidget.node());
    sequencerWidget.useSynthesizer(synth);

    const filterWidget = new FilterWidget(graph);
    // filterWidget.load(bqf);
    car.spawnMove("u", "u").connectNode("f", filterWidget.node());

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
        sink.disconnect(bqf);
        sink.connect(bqf);
      }
    }, this);
}
