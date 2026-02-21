"use client";

import { type Value, TrailingBlockPlugin } from "platejs";
import { type TPlateEditor, useEditorRef } from "platejs/react";

import { AlignKit } from "@/components/plugins/align-kit";
import { BasicBlocksKit } from "@/components/plugins/basic-blocks-kit";
import { BasicMarksKit } from "@/components/plugins/basic-marks-kit";
import { ColumnKit } from "@/components/plugins/column-kit";
import { DndKit } from "@/components/plugins/dnd-kit";
import { DocxKit } from "@/components/plugins/docx-kit";
import { EmojiKit } from "@/components/plugins/emoji-kit";
import { ExitBreakKit } from "@/components/plugins/exit-break-kit";
import { FontKit } from "@/components/plugins/font-kit";
import { LineHeightKit } from "@/components/plugins/line-height-kit";
import { LinkKit } from "@/components/plugins/link-kit";
import { ListKit } from "@/components/plugins/list-kit";
import { MediaKit } from "@/components/plugins/media-kit";
import { TableKit } from "@/components/plugins/table-kit";
import { TocKit } from "@/components/plugins/toc-kit";

export const EditorKit = [
  // Elements
  ...BasicBlocksKit,
  ...TableKit,
  ...TocKit,
  ...ColumnKit,
  ...LinkKit,

  // Marks
  ...BasicMarksKit,
  ...FontKit,

  // Block Style
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,

  // Collaboration
  // Editing
  ...DndKit,
  ...EmojiKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  // Parsers
  ...DocxKit,

  // UI
  ...MediaKit,
];

export type MyEditor = TPlateEditor<Value, (typeof EditorKit)[number]>;

export const useEditor = () => useEditorRef<MyEditor>();
