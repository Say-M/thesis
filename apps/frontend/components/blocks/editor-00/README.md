# Rich Text Editor Component

A feature-rich, reusable text editor component built on [Lexical](https://lexical.dev/) with a beautiful UI inspired by [shadcn-editor](https://shadcn-editor.vercel.app/).

## Features

✅ **Block Formatting**: Paragraphs, headings (H1-H3), lists (ordered, unordered, checklist), quotes  
✅ **Text Formatting**: Bold, italic, underline, strikethrough  
✅ **Font Controls**: Adjustable font size  
✅ **Element Formatting**: Text alignment (left, center, right, justify), indentation  
✅ **Links**: Insert and edit hyperlinks  
✅ **History**: Undo/redo functionality  
✅ **Fully Configurable**: Show/hide toolbar sections, custom height, placeholder, read-only mode  
✅ **State Management**: Export/import editor state as JSON  
✅ **Responsive**: Works beautifully on all screen sizes

## Installation

This component uses the existing editor infrastructure:

```tsx
import { Editor } from "@/components/blocks/editor-00/editor";
```

## Basic Usage

```tsx
import { Editor } from "@/components/blocks/editor-00/editor";

export function MyComponent() {
  return <Editor placeholder="Start typing..." />;
}
```

## Props

| Prop                    | Type                                     | Default             | Description                                                     |
| ----------------------- | ---------------------------------------- | ------------------- | --------------------------------------------------------------- |
| `editorState`           | `EditorState`                            | `undefined`         | Initial editor state (Lexical EditorState object)               |
| `editorSerializedState` | `SerializedEditorState`                  | `undefined`         | Initial editor state (serialized JSON)                          |
| `onChange`              | `(editorState: EditorState) => void`     | `undefined`         | Callback when editor state changes (returns EditorState object) |
| `onSerializedChange`    | `(state: SerializedEditorState) => void` | `undefined`         | Callback when editor state changes (returns serialized JSON)    |
| `placeholder`           | `string`                                 | `"Start typing..."` | Placeholder text shown when editor is empty                     |
| `minHeight`             | `string`                                 | `"h-72"`            | Minimum height of the editor content area (Tailwind class)      |
| `className`             | `string`                                 | `undefined`         | Additional CSS classes for the editor container                 |
| `readOnly`              | `boolean`                                | `false`             | Whether the editor is read-only                                 |
| `showToolbar`           | `boolean`                                | `true`              | Whether to show the toolbar                                     |
| `toolbarConfig`         | `object`                                 | All enabled         | Configure which toolbar items to show (see below)               |

### Toolbar Configuration

```tsx
toolbarConfig={{
  blockFormat: true,       // Paragraph, headings, lists, quote
  fontFormat: true,        // Bold, italic, underline, strikethrough
  fontSize: true,          // Font size controls
  elementFormat: true,     // Alignment, indentation
  link: true,              // Link button
  clearFormatting: true,   // Clear formatting button
  history: true,           // Undo/redo buttons
}}
```

## Examples

### 1. Basic Editor

```tsx
<Editor placeholder="Start typing..." />
```

### 2. Custom Height

```tsx
<Editor placeholder="Write something..." minHeight="h-96" />
```

### 3. Minimal Toolbar (Only Basic Formatting)

```tsx
<Editor
  placeholder="Simple editor..."
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
```

### 4. With State Management

```tsx
import { useState } from "react";
import { SerializedEditorState } from "lexical";

export function MyComponent() {
  const [content, setContent] = useState<SerializedEditorState | null>(null);

  return (
    <Editor
      placeholder="Write something..."
      onSerializedChange={(state) => {
        setContent(state);
        // Save to database, localStorage, etc.
      }}
    />
  );
}
```

### 5. Read-Only Display

```tsx
<Editor
  editorSerializedState={savedContent}
  readOnly={true}
  showToolbar={false}
  minHeight="h-48"
/>
```

### 6. Form Integration

```tsx
export function ArticleForm() {
  const [content, setContent] = useState<SerializedEditorState | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveArticle({ content });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Editor
        placeholder="Write your article..."
        minHeight="h-96"
        onSerializedChange={setContent}
      />
      <button type="submit">Publish</button>
    </form>
  );
}
```

### 7. Custom Styling

```tsx
<Editor
  placeholder="Custom styled..."
  className="border-2 border-primary shadow-lg rounded-xl"
  minHeight="h-64"
/>
```

## Keyboard Shortcuts

| Shortcut                                 | Action             |
| ---------------------------------------- | ------------------ |
| `Ctrl/Cmd + Z`                           | Undo               |
| `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` | Redo               |
| `Ctrl/Cmd + B`                           | Bold               |
| `Ctrl/Cmd + I`                           | Italic             |
| `Ctrl/Cmd + U`                           | Underline          |
| `Ctrl/Cmd + K`                           | Insert/Remove Link |
| `Tab`                                    | Indent             |
| `Shift + Tab`                            | Outdent            |

## Supported Node Types

- **Paragraph**: Basic text blocks
- **Headings**: H1, H2, H3
- **Quote**: Block quotes
- **List**: Ordered lists, unordered lists, checklists
- **Link**: Hyperlinks
- **Code**: Code blocks with syntax highlighting
- **Text Formatting**: Bold, italic, underline, strikethrough

## Saving and Loading Content

### Saving Content

```tsx
<Editor
  onSerializedChange={(state) => {
    // Save to your backend
    localStorage.setItem("editorContent", JSON.stringify(state));
  }}
/>
```

### Loading Content

```tsx
const savedContent = JSON.parse(localStorage.getItem('editorContent') || 'null')

<Editor
  editorSerializedState={savedContent}
/>
```

## Advanced Usage

### Multiple Editors on Same Page

```tsx
export function MultiEditor() {
  const [intro, setIntro] = useState<SerializedEditorState | null>(null);
  const [main, setMain] = useState<SerializedEditorState | null>(null);
  const [conclusion, setConclusion] = useState<SerializedEditorState | null>(
    null
  );

  return (
    <div className="space-y-6">
      <div>
        <label>Introduction</label>
        <Editor
          placeholder="Intro..."
          minHeight="h-32"
          onSerializedChange={setIntro}
        />
      </div>

      <div>
        <label>Main Content</label>
        <Editor
          placeholder="Main content..."
          minHeight="h-96"
          onSerializedChange={setMain}
        />
      </div>

      <div>
        <label>Conclusion</label>
        <Editor
          placeholder="Conclusion..."
          minHeight="h-32"
          onSerializedChange={setConclusion}
        />
      </div>
    </div>
  );
}
```

## Styling Customization

The editor uses your theme colors and respects your Tailwind configuration. You can customize:

1. **Container styling** via `className` prop
2. **Height** via `minHeight` prop (accepts any Tailwind height class)
3. **Theme** via the `editorTheme` in `@/components/editor/themes/editor-theme`

## Architecture

```
editor-00/
├── editor.tsx      # Main component with configuration
├── nodes.ts        # Lexical node types
├── plugins.tsx     # Editor plugins and toolbar
├── example.tsx     # Usage examples
└── README.md       # This file
```

## Dependencies

The editor relies on these existing components:

- `@/components/editor/plugins/*` - Toolbar plugins
- `@/components/editor/editor-ui/*` - UI components
- `@/components/editor/themes/*` - Editor styling
- `@/components/ui/*` - shadcn/ui components

## References

- [Lexical Documentation](https://lexical.dev/)
- [shadcn-editor](https://shadcn-editor.vercel.app/)
- [Block Format Toolbar](https://shadcn-editor.vercel.app/docs/plugins/toolbar/block-format-toolbar)
- [Font Format Toolbar](https://shadcn-editor.vercel.app/docs/plugins/toolbar/font-format-toolbar)
- [History Toolbar](https://shadcn-editor.vercel.app/docs/plugins/toolbar/history-toolbar)

## License

This component is part of your application and follows your project's license.
