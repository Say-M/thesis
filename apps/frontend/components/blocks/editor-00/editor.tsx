"use client";

import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { EditorState, SerializedEditorState } from "lexical";

import { editorTheme } from "@/components/editor/themes/editor-theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { nodes } from "./nodes";
import { Plugins } from "./plugins";

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error);
  },
};

export interface EditorProps {
  /** Initial editor state (Lexical EditorState object) */
  editorState?: EditorState;
  /** Initial editor state (serialized JSON) */
  editorSerializedState?: SerializedEditorState;
  /** Callback when editor state changes (returns EditorState object) */
  onChange?: (editorState: EditorState) => void;
  /** Callback when editor state changes (returns serialized JSON) */
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void;
  /** Placeholder text shown when editor is empty */
  placeholder?: string;
  /** Minimum height of the editor content area (e.g., "h-72", "min-h-96") */
  minHeight?: string;
  /** Additional CSS classes for the editor container */
  className?: string;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Whether to show the toolbar */
  showToolbar?: boolean;
  /** Configure which toolbar items to show */
  toolbarConfig?: {
    /** Show block format dropdown (paragraph, headings, lists, quote) */
    blockFormat?: boolean;
    /** Show text formatting buttons (bold, italic, underline, strikethrough) */
    fontFormat?: boolean;
    /** Show font size controls */
    fontSize?: boolean;
    /** Show element formatting (alignment, indentation) */
    elementFormat?: boolean;
    /** Show link button */
    link?: boolean;
    /** Show clear formatting button */
    clearFormatting?: boolean;
    /** Show undo/redo buttons */
    history?: boolean;
  };
}

/**
 * A feature-rich text editor component built on Lexical
 *
 * @example
 * ```tsx
 * <Editor
 *   placeholder="Start writing..."
 *   minHeight="h-96"
 *   onSerializedChange={(state) => console.log(state)}
 *   toolbarConfig={{
 *     blockFormat: true,
 *     fontFormat: true,
 *     history: true,
 *   }}
 * />
 * ```
 */
export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
  placeholder = "Start typing...",
  minHeight = "h-72",
  className,
  readOnly = false,
  showToolbar = true,
  toolbarConfig = {
    blockFormat: true,
    fontFormat: true,
    fontSize: true,
    elementFormat: true,
    link: true,
    clearFormatting: true,
    history: true,
  },
}: EditorProps) {
  return (
    <div
      className={cn(
        "bg-background overflow-hidden rounded-lg border shadow",
        className
      )}
    >
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          editable: !readOnly,
          ...(editorState ? { editorState } : {}),
          ...(editorSerializedState
            ? { editorState: JSON.stringify(editorSerializedState) }
            : {}),
        }}
      >
        <TooltipProvider>
          <Plugins
            placeholder={placeholder}
            minHeight={minHeight}
            showToolbar={showToolbar}
            toolbarConfig={toolbarConfig}
          />

          <OnChangePlugin
            ignoreSelectionChange={true}
            onChange={(editorState) => {
              console.log({ editorState });

              onChange?.(editorState);
              onSerializedChange?.(editorState.toJSON());
            }}
          />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  );
}
