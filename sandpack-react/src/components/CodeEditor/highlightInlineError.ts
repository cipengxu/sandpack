import type { Extension } from "@codemirror/state";
import type { DecorationSet, EditorView, ViewUpdate } from "@codemirror/view";
import { Decoration, ViewPlugin } from "@codemirror/view";

export function highlightInlineError(): Extension {
  return activeLineHighlighter;
}

const lineDeco = Decoration.line({ attributes: { class: "cm-errorLine" } });

const activeLineHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor() {
      this.decorations = Decoration.none;
    }

    update(update: ViewUpdate) {
      let message = null;

      update.transactions.forEach((trans) => {
        // Overlap the types, it seems the original
        // doesn't match what it really is.
        interface Annotations {
          annotations: Array<{ type: string }>;
        }

        ((trans as unknown) as Annotations).annotations?.forEach((element) => {
          if (element.type === "error") {
            message = element;
          }

          if (element.type === "clean-error") {
            message = element;
          }
        });
      });

      if (message !== null) {
        this.decorations = this.getDecoration(update.view, message);
      }
    }

    getDecoration(
      view: EditorView,
      message: { type: "clean-error" } | { type: "error"; value: number } | null
    ) {
      if (message === null || message.type === "clean-error") {
        return Decoration.none;
      }

      if (message.type === "error") {
        const doc = (view.state.doc as unknown) as { text: string[] };

        // It calculates the position for a given line
        const position = doc.text.reduce((acc, curr, i) => {
          // -1 is to fix the array index
          if (i < message.value - 1) {
            return acc + curr.length + 1;
          }
          return acc;
        }, 0);

        return Decoration.set([lineDeco.range(position)]);
      }

      return Decoration.none;
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
