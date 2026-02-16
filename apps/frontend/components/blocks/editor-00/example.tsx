"use client";

import { useState } from "react";
import { SerializedEditorState } from "lexical";

import { Editor } from "./editor";

/**
 * Example: Basic Editor
 * Minimal configuration with default settings
 */
export function BasicEditorExample() {
  return <Editor placeholder="Start typing..." />;
}

/**
 * Example: Editor with State Management
 * Track and persist editor state
 */
export function StatefulEditorExample() {
  const [editorState, setEditorState] = useState<SerializedEditorState | null>(
    null
  );

  return (
    <div className="space-y-4">
      <Editor
        placeholder="Write something..."
        onSerializedChange={(state) => {
          setEditorState(state);
        }}
      />

      {editorState && (
        <div className="rounded-md bg-muted p-4">
          <p className="text-sm font-medium mb-2">Editor State (JSON):</p>
          <pre className="text-xs overflow-auto max-h-48">
            {JSON.stringify(editorState, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Customized Height
 * Configure minimum height for different use cases
 */
export function CustomHeightEditorExample() {
  return (
    <div className="space-y-4">
      {/* Short editor */}
      <Editor placeholder="Short editor..." minHeight="h-32" />

      {/* Medium editor (default) */}
      <Editor placeholder="Medium editor..." minHeight="h-72" />

      {/* Tall editor */}
      <Editor placeholder="Tall editor..." minHeight="h-96" />
    </div>
  );
}

/**
 * Example: Minimal Toolbar
 * Only show essential formatting options
 */
export function MinimalToolbarEditorExample() {
  return (
    <Editor
      placeholder="Minimal editor with basic formatting..."
      toolbarConfig={{
        blockFormat: true,
        fontFormat: true,
        fontSize: false,
        elementFormat: false,
        link: false,
        clearFormatting: false,
        history: true,
      }}
    />
  );
}

/**
 * Example: Full Featured Editor
 * All toolbar options enabled
 */
export function FullFeaturedEditorExample() {
  return (
    <Editor
      placeholder="Full-featured editor with all options..."
      minHeight="h-96"
      toolbarConfig={{
        blockFormat: true,
        fontFormat: true,
        fontSize: true,
        elementFormat: true,
        link: true,
        clearFormatting: true,
        history: true,
      }}
    />
  );
}

/**
 * Example: Read-Only Editor
 * Display content without editing capability
 */
export function ReadOnlyEditorExample() {
  const [savedContent, setSavedContent] =
    useState<SerializedEditorState | null>(null);

  return (
    <div className="space-y-4">
      {/* Editable editor to create content */}
      <div>
        <p className="text-sm font-medium mb-2">Edit Content:</p>
        <Editor
          placeholder="Type something to see in read-only mode..."
          minHeight="h-32"
          editorSerializedState={savedContent || undefined}
          onSerializedChange={setSavedContent}
        />
      </div>

      {/* Read-only display */}
      {savedContent && (
        <div>
          <p className="text-sm font-medium mb-2">Read-Only Display:</p>
          <Editor
            editorSerializedState={savedContent}
            readOnly={true}
            showToolbar={false}
            minHeight="h-32"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Example: Custom Styled Editor
 * Apply custom styling to the editor container
 */
export function CustomStyledEditorExample() {
  return (
    <Editor
      placeholder="Custom styled editor..."
      className="border-2 border-primary shadow-lg"
      minHeight="h-64"
    />
  );
}

/**
 * Example: Form Integration
 * Use editor within a form
 */
export function FormIntegratedEditorExample() {
  const [content, setContent] = useState<SerializedEditorState | null>(null);
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting:", { title, content });
    alert("Form submitted! Check console for data.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter title..."
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Content</label>
        <Editor
          placeholder="Write your content..."
          minHeight="h-64"
          onSerializedChange={setContent}
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Submit
      </button>
    </form>
  );
}

/**
 * Example: Multiple Editors
 * Multiple independent editor instances
 */
export function MultipleEditorsExample() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Description</h3>
        <Editor placeholder="Enter description..." minHeight="h-32" />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Notes</h3>
        <Editor
          placeholder="Add your notes..."
          minHeight="h-48"
          toolbarConfig={{
            blockFormat: false,
            fontFormat: true,
            fontSize: false,
            elementFormat: false,
            link: false,
            clearFormatting: true,
            history: true,
          }}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Full Content</h3>
        <Editor placeholder="Write full content..." minHeight="h-96" />
      </div>
    </div>
  );
}
