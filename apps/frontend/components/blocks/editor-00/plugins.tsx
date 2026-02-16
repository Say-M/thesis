import { useState } from "react";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";

import { ContentEditable } from "@/components/editor/editor-ui/content-editable";
import { FloatingLinkEditorPlugin } from "@/components/editor/plugins/floating-link-editor-plugin";
import { LinkPlugin } from "@/components/editor/plugins/link-plugin";
import { ListMaxIndentLevelPlugin } from "@/components/editor/plugins/list-max-indent-level-plugin";
import { BlockFormatDropDown } from "@/components/editor/plugins/toolbar/block-format-toolbar-plugin";
import { FormatBulletedList } from "@/components/editor/plugins/toolbar/block-format/format-bulleted-list";
import { FormatCheckList } from "@/components/editor/plugins/toolbar/block-format/format-check-list";
import { FormatHeading } from "@/components/editor/plugins/toolbar/block-format/format-heading";
import { FormatNumberedList } from "@/components/editor/plugins/toolbar/block-format/format-numbered-list";
import { FormatParagraph } from "@/components/editor/plugins/toolbar/block-format/format-paragraph";
import { FormatQuote } from "@/components/editor/plugins/toolbar/block-format/format-quote";
import { ClearFormattingToolbarPlugin } from "@/components/editor/plugins/toolbar/clear-formatting-toolbar-plugin";
import { ElementFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/element-format-toolbar-plugin";
import { FontFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/font-format-toolbar-plugin";
import { FontSizeToolbarPlugin } from "@/components/editor/plugins/toolbar/font-size-toolbar-plugin";
import { HistoryToolbarPlugin } from "@/components/editor/plugins/toolbar/history-toolbar-plugin";
import { LinkToolbarPlugin } from "@/components/editor/plugins/toolbar/link-toolbar-plugin";
import { ToolbarPlugin } from "@/components/editor/plugins/toolbar/toolbar-plugin";
import { Separator } from "@/components/ui/separator";

interface PluginsProps {
  placeholder?: string;
  minHeight?: string;
  showToolbar?: boolean;
  toolbarConfig?: {
    blockFormat?: boolean;
    fontFormat?: boolean;
    fontSize?: boolean;
    elementFormat?: boolean;
    link?: boolean;
    clearFormatting?: boolean;
    history?: boolean;
  };
}

export function Plugins({
  placeholder = "Start typing...",
  minHeight = "h-72",
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
}: PluginsProps) {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <div className="relative">
      {/* Toolbar Plugins */}
      {showToolbar && (
        <ToolbarPlugin>
          {({ blockType }) => (
            <div className="vertical-align-middle sticky top-0 z-10 flex flex-wrap gap-2 overflow-auto border-b p-1">
              {toolbarConfig.history && <HistoryToolbarPlugin />}

              {toolbarConfig.history && (
                <Separator orientation="vertical" className="h-7!" />
              )}

              {toolbarConfig.blockFormat && (
                <BlockFormatDropDown>
                  <FormatParagraph />
                  <FormatHeading levels={["h1", "h2", "h3"]} />
                  <FormatNumberedList />
                  <FormatBulletedList />
                  <FormatCheckList />
                  <FormatQuote />
                </BlockFormatDropDown>
              )}

              {toolbarConfig.fontFormat && <FontFormatToolbarPlugin />}

              {toolbarConfig.fontSize && (
                <>
                  <Separator orientation="vertical" className="h-7!" />
                  <FontSizeToolbarPlugin />
                </>
              )}

              {toolbarConfig.elementFormat && (
                <>
                  <Separator orientation="vertical" className="h-7!" />
                  <ElementFormatToolbarPlugin />
                </>
              )}

              {toolbarConfig.link && (
                <>
                  <Separator orientation="vertical" className="h-7!" />
                  <LinkToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} />
                </>
              )}

              {toolbarConfig.clearFormatting && (
                <>
                  <Separator orientation="vertical" className="h-7!" />
                  <ClearFormattingToolbarPlugin />
                </>
              )}
            </div>
          )}
        </ToolbarPlugin>
      )}

      {/* Editor Content */}
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <div className="">
              <div className="" ref={onRef}>
                <ContentEditable
                  placeholder={placeholder}
                  className={`ContentEditable__root relative block ${minHeight} min-h-full overflow-auto px-8 py-4 focus:outline-none`}
                />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        {/* Editor Plugins */}
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <ListMaxIndentLevelPlugin maxDepth={5} />
        <TabIndentationPlugin />

        {/* Floating Plugins */}
        {floatingAnchorElem && (
          <FloatingLinkEditorPlugin
            anchorElem={floatingAnchorElem}
            isLinkEditMode={isLinkEditMode}
            setIsLinkEditMode={setIsLinkEditMode}
          />
        )}
      </div>
    </div>
  );
}
