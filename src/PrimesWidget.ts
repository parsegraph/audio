import PrimesModulo from "./PrimesModulo";
import { style, BlockCaret, DefaultBlockPalette } from "parsegraph-block";
import { BlockType } from "parsegraph-blockpainter";
import Color from "parsegraph-color";

const SLOT_STYLE = {
  ...style("s", true),
  backgroundColor: new Color(0.73, 0.726, 0.719, 0.2),
};

export default class PrimesWidget {
  position: number;
  knownPrimes: PrimesModulo[];
  caret: BlockCaret;
  _paused: boolean;

  constructor() {
    this.knownPrimes = [];
    this.position = 2;

    this.caret = new BlockCaret(
      "b",
      new DefaultBlockPalette(BlockType.SQUARE, true)
    );
    this.caret.node().value().setLabel("1");
  }

  isPaused() {
    return this._paused;
  }

  freezer(): any {
    return this.caret._freezer;
  }

  step() {
    // console.log("Stepping primes widget");
    // Check if any known prime is a multiple of the current position.
    this.caret.spawnMove("f", "b");
    this.caret.label("" + this.position);
    this.caret.id(this.position);
    this.caret.push();
    this.caret.pull("u");
    // this.caret.crease();
    const freeze = !!this.freezer();
    freeze && this.caret.freeze();
    let isPrime = true;

    for (let i = 0; i < this.knownPrimes.length; ++i) {
      const prime = this.knownPrimes[i];
      const modulus = prime.calculate(this.position);
      if (modulus == 0) {
        // It's a multiple, so there's no chance for primality.
        this.caret.spawnMove("u", "b");
        this.caret
          .node()
          .value()
          .setLabel("" + prime.frequency);
        isPrime = false;
      } else {
        this.caret.spawnMove("u", "s");
        this.caret.node().value().setBlockStyle(SLOT_STYLE);
      }
      this.caret
        .node()
        .state()
        .setId(this.position + ":" + prime.frequency);
      if (i === 0) {
        // this.caret.crease();
        freeze && this.caret.freeze();
      }
    }
    if (isPrime) {
      // The position is prime, so output it and add it to the list.
      this.caret.spawnMove("u", "b");
      this.caret.label("" + this.position);
      this.caret.id(this.position + ":" + this.position);
      this.knownPrimes.push(new PrimesModulo(this.position));
    }
    this.caret.pop();

    // Advance.
    ++this.position;
  }

  node(): any {
    return this.caret.root();
  }
}
