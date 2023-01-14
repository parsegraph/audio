import { BlockStyle, copyStyle } from "parsegraph-block";

let unsel: BlockStyle;
let sel: BlockStyle;

export const getUnselStyle = () => {
  updateUnsel();
  return unsel;
};

export const getSelStyle = () => {
  updateUnsel();
  return sel;
};

function updateUnsel() {
  if (!unsel) {
    unsel = copyStyle("b");
    unsel.selectedBackgroundColor = unsel.backgroundColor;
    sel = copyStyle("s");
    //sel.backgroundColor = new parsegraph_Color(.8, .8, .8, 1);
    sel.selectedBackgroundColor = sel.backgroundColor;
    //sel.fontColor = new parsegraph_Color(1, 0, 0, 1);
    sel.selectedFontColor = sel.fontColor;
  }
}
