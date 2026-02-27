"use client";

import * as React from "react";

import type { DropdownMenuProps } from "@/components/ui/dropdown-menu";

import { LineHeightPlugin } from "@platejs/basic-styles/react";
import { CheckIcon, WrapText } from "lucide-react";
import { useEditorRef, useSelectionFragmentProp } from "platejs/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ToolbarButton } from "./toolbar";

export function LineHeightToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const { defaultNodeValue, validNodeValues: values = [] } =
    editor.getInjectProps(LineHeightPlugin);

  const value = useSelectionFragmentProp({
    defaultValue: defaultNodeValue,
    getProp: (node) => node.lineHeight,
  });

  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Line height" isDropdown>
          <WrapText />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="min-w-0"
        align="start"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
      >
        <DropdownMenuGroup>
          {values.map((itemValue) => (
            <DropdownMenuCheckboxItem
              key={itemValue}
              className="min-w-[180px]"
              checked={value === itemValue}
              onCheckedChange={(checked) => {
                if (checked) {
                  editor
                    .getTransforms(LineHeightPlugin)
                    .lineHeight.setNodes(Number(itemValue));
                }
              }}
            >
              {itemValue}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
