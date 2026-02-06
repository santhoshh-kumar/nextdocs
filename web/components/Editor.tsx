"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";

export default function Editor() {
  const editor = useCreateBlockNote();

  return (
    <BlockNoteView
      editor={editor}
      shadCNComponents={
        {
          // We will be passing modified ShadCN components here.
        }
      }
    />
  );
}
