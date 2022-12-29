import { BlockNode } from "parsegraph-block";
import { Projector } from "parsegraph-projector";
import Direction from "parsegraph-direction";
import { SliderNode } from "parsegraph-slider";

export default class EnvelopeGeneratorWidget {
  _proj: Projector;
  _containerNode: BlockNode;
  _attackSlider: SliderNode;
  _decaySlider: SliderNode;
  _sustainLengthSlider: SliderNode;
  _sustainLevelSlider: SliderNode;
  _releaseSlider: SliderNode;
  _pitchSlider: SliderNode;
  _onButton: BlockNode;

  constructor(proj: Projector) {
    this._proj = proj;
  }

  node() {
    if (this._containerNode) {
      return this._containerNode;
    }

    this._containerNode = new BlockNode("b");

    let prior = this._containerNode;

    // Attack
    const attackBud = prior.connectNode(Direction.DOWNWARD, new BlockNode("u"));
    const attackLabel = attackBud.connectNode(
      Direction.BACKWARD,
      new BlockNode("u")
    );
    attackLabel.value().setLabel("Attack");
    attackLabel.state().setScale(0.5);
    let stepSlider = attackBud.connectNode(Direction.FORWARD, new SliderNode());
    stepSlider.state().setScale(0.5);
    this._attackSlider = stepSlider;
    this._attackSlider.value().setVal(Math.random());
    prior = attackBud;

    // Decay
    const decayBud = prior.connectNode(Direction.DOWNWARD, new BlockNode("u"));
    const decayLabel = decayBud.connectNode(
      Direction.BACKWARD,
      new BlockNode("b")
    );
    decayLabel.value().setLabel("Decay");
    decayLabel.state().setScale(0.5);
    stepSlider = decayBud.connectNode(Direction.FORWARD, new SliderNode());
    stepSlider.state().setScale(0.5);
    this._decaySlider = stepSlider;
    this._decaySlider.value().setVal(Math.random());
    prior = decayBud;

    // Sustain
    const sustainBud = prior.connectNode(
      Direction.DOWNWARD,
      new BlockNode("u")
    );
    const sustainLabel = sustainBud.connectNode(
      Direction.BACKWARD,
      new BlockNode("b")
    );
    sustainLabel.value().setLabel("Sustain");
    sustainLabel.state().setScale(0.5);
    const sustainSliders = sustainBud.connectNode(
      Direction.FORWARD,
      new BlockNode("u")
    );
    sustainSliders.state().setScale(0.5);
    stepSlider = sustainSliders.connectNode(
      Direction.FORWARD,
      new SliderNode()
    );

    const lenSlider = sustainSliders
      .connectNode(Direction.DOWNWARD, new BlockNode("u"))
      .connectNode(Direction.FORWARD, new SliderNode());
    this._sustainLengthSlider = lenSlider;
    this._sustainLengthSlider.value().setVal(Math.random());

    this._sustainLevelSlider = stepSlider;
    this._sustainLevelSlider.value().setVal(0.6 + 0.4 * Math.random());
    prior = sustainBud;

    // Release
    const releaseBud = prior.connectNode(
      Direction.DOWNWARD,
      new BlockNode("u")
    );
    const releaseLabel = releaseBud.connectNode(
      Direction.BACKWARD,
      new BlockNode("b")
    );
    releaseLabel.value().setLabel("Release");
    releaseLabel.state().setScale(0.5);
    stepSlider = releaseBud.connectNode(Direction.FORWARD, new SliderNode());
    stepSlider.state().setScale(0.5);
    this._releaseSlider = stepSlider;
    this._releaseSlider.value().setVal(Math.random());
    prior = releaseBud;

    return this._containerNode;
  }

  playNote(osc: OscillatorNode, gain: GainNode, start: number, end: number) {
    const len = end - start;
    osc.frequency.setValueAtTime(
      16 + 7902 * this._pitchSlider.value().val(),
      start
    );
    // this._lastOsc = osc;
    if (this._onButton.value().label() == "Off") {
      // console.log("Step is off!");
      gain.gain.setValueAtTime(0, start);
      return;
    }
    // gain.gain.setValueAtTime(0, start);
    // gain.gain.linearRampToValueAtTime(1, start + .2);
    // gain.gain.setValueAtTime(1, start + len * .8);
    // gain.gain.linearRampToValueAtTime(0, end);
    // console.log(this._i, start, end);

    const envelopeSize =
      this._attackSlider.value().val() +
      this._decaySlider.value().val() +
      this._sustainLengthSlider.value().val() +
      this._releaseSlider.value().val();

    const ae = this._attackSlider.value().val() / envelopeSize;
    const de = this._decaySlider.value().val() / envelopeSize;
    const se = this._sustainLengthSlider.value().val() / envelopeSize;
    const re = this._releaseSlider.value().val() / envelopeSize;

    gain.gain.linearRampToValueAtTime(1, start + len * ae);
    gain.gain.exponentialRampToValueAtTime(
      this._sustainLevelSlider.value().val(),
      start + len * (ae + de)
    );
    gain.gain.setValueAtTime(
      this._sustainLevelSlider.value().val(),
      start + len * (ae + de + se)
    );
    gain.gain.linearRampToValueAtTime(0, start + len * (ae + de + se + re));
  }
}
