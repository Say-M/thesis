"use client";
import { Plate, usePlateEditor, type PlateEditor } from "platejs/react";
import { EditorContainer } from "@/components/ui/editor";
import { Editor } from "@/components/ui/editor";
import type { Value } from "platejs";

import { EditorKit } from "./editor-kit";
import { FixedToolbarButtons } from "../ui/fixed-toolbar-buttons";
import { FixedToolbar } from "../ui/fixed-toolbar";
import { cn } from "@/lib/utils";

function PlateEditor({
  onChange,
  value = [],
  readOnly,
}: {
  onChange?: (value: Value) => void;
  value: Value;
  readOnly?: boolean;
}) {
  const editor = usePlateEditor({
    plugins: EditorKit,
    value,
  });

  return (
    <Plate
      editor={editor}
      readOnly={readOnly}
      onChange={({ value }) => onChange?.(value)}
    >
      {!readOnly && (
        <FixedToolbar className="overflow-hidden w-full border border-b-0 rounded-t-md">
          <FixedToolbarButtons />
        </FixedToolbar>
      )}
      <EditorContainer className={cn(readOnly && "border-0")}>
        <Editor
          variant={readOnly ? "none" : "fullWidth"}
          placeholder="Type your amazing content here..."
        />
      </EditorContainer>
    </Plate>
  );
}

export default PlateEditor;
