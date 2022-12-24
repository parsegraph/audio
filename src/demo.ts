import Navport, { render } from "parsegraph-viewport";
import TimingBelt from "parsegraph-timingbelt";
import { BasicProjector } from "parsegraph-projector";
import buildGraph from './buildFullAudio';

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
