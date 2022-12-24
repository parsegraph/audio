import generateID from "parsegraph-generateid";
import { BlockNode, BlockCaret, copyStyle } from "parsegraph-block";
import Method from 'parsegraph-method';
import Color from 'parsegraph-color';

export default class OnOffWidget {
  _id: string;
  _containerNode: BlockNode;
  _onListener: Method;
  _offListener: Method;
  _isOn: boolean;

  constructor() {
    this._id = generateID("OnOff");
    this._containerNode = null;
    this._onListener = new Method();
    this._offListener = new Method();
    this._isOn = false;
  }

  turnOff() {
    if (!this._isOn) {
      return;
    }
    this._isOn = false;
    this._offListener.call();
  };

  setOnOff(
      offListener: ()=>void,
      offListenerThisArg?:any,
  ) {
    this._offListener.set(offListener, offListenerThisArg);
  };

  turnOn() {
    if (this._isOn) {
      return;
    }
    this._isOn = true;
    this._onListener.call();
  };

  value() {
    return this._isOn;
  };

  setOnOn(
      onListener: ()=>void,
      onListenerThisArg?:any,
  ) {
    this._onListener.set(onListener, onListenerThisArg);
  }

  node() {
    if (!this._containerNode) {
      // Switch case.
      const car = new BlockCaret('s');
      this._containerNode = car.root();
      car.node().value().interact().setIgnoreMouse(true);
      car.shrink();

      // Off button.
      car.spawnMove('i', 'b', 'v');
      car.label('Off');
      car.onClick(function() {
        this.turnOff();
        return true;
      }, this);
      const blackStyle = copyStyle('s');
      blackStyle.backgroundColor = new Color(0, 0, 0, 1);
      blackStyle.fontColor = new Color(1, 0, 0, 1);
      car.node().value().setBlockStyle(blackStyle);

      // On button.
      car.spawnMove('f', 'b');
      car.label('On');
      car.onClick(function() {
        this.turnOn();
        return true;
      }, this);
      const whiteStyle = copyStyle('s');
      whiteStyle.borderColor = new Color(0.2, 0.2, 0.2, 1);
      whiteStyle.backgroundColor = new Color(1, 1, 1, 1);
      car.node().value().setBlockStyle(whiteStyle);
    }
    return this._containerNode;
  };
}
