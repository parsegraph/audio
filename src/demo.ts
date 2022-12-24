import Navport, { render } from "parsegraph-viewport";
import TimingBelt from "parsegraph-timingbelt";
import {
  EightBitWidget,
} from ".";
import { Projector, BasicProjector } from "parsegraph-projector";
import { BlockCaret } from "parsegraph-block";
import Direction, { Alignment, PreferredAxis } from "parsegraph-direction";

const buildGraph = (proj: Projector) => {
  const car = new BlockCaret();
  car.fitExact();
  car.node().setNodeAlignmentMode(Direction.DOWNWARD, Alignment.CENTER);
  const myList = car.spawnMove("d", "u");
  myList.setLayoutPreference(PreferredAxis.VERTICAL);

  const bit = new EightBitWidget(proj);
  car.connect("d", bit.node());
  return car.root();
};

document.addEventListener("DOMContentLoaded", () => {
  const viewport = new Navport(null);
  const belt = new TimingBelt();
  belt.setGovernor(false);
  belt.setBurstIdle(true);
  const proj = new BasicProjector();

  const root = buildGraph(proj);

  const topElem = document.getElementById("demo");
  topElem.style.position = "relative";
  viewport.setRoot(root);
  viewport.showInCamera(root);
  render(topElem, viewport, proj, belt);
});
