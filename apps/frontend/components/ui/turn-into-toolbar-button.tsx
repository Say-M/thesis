"use client";

import * as React from "react";

import type { TElement } from "platejs";
import type { DropdownMenuProps } from "@/components/ui/dropdown-menu";

import {
  CheckIcon,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  FileCodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  SquareIcon,
  TableOfContentsIcon,
} from "lucide-react";
import { KEYS } from "platejs";
import { useEditorRef, useSelectionFragmentProp } from "platejs/react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getBlockType, setBlockType } from "@/components/transforms";

import { ToolbarButton, ToolbarMenuGroup } from "./toolbar";

export const turnIntoItems = [
  {
    icon: <PilcrowIcon />,
    keywords: ["paragraph"],
    label: "Text",
    value: KEYS.p,
  },
  {
    icon: <Heading1Icon />,
    keywords: ["title", "h1"],
    label: "Heading 1",
    value: "h1",
  },
  {
    icon: <Heading2Icon />,
    keywords: ["subtitle", "h2"],
    label: "Heading 2",
    value: "h2",
  },
  {
    icon: <Heading3Icon />,
    keywords: ["subtitle", "h3"],
    label: "Heading 3",
    value: "h3",
  },
  {
    icon: <Heading4Icon />,
    keywords: ["subtitle", "h4"],
    label: "Heading 4",
    value: "h4",
  },
  {
    icon: <Heading5Icon />,
    keywords: ["subtitle", "h5"],
    label: "Heading 5",
    value: "h5",
  },
  {
    icon: <Heading6Icon />,
    keywords: ["subtitle", "h6"],
    label: "Heading 6",
    value: "h6",
  },
  {
    icon: <QuoteIcon />,
    keywords: ["citation", "blockquote", ">"],
    label: "Quote",
    value: KEYS.blockquote,
  },
  {
    icon: <TableOfContentsIcon />,
    label: "Table of contents",
    value: KEYS.toc,
  },
  {
    icon: <Columns3Icon />,
    label: "3 columns",
    value: "action_three_columns",
  },
];

export function TurnIntoToolbarButton(
  props: DropdownMenuProps,
) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement),
  });
  const selectedItem = React.useMemo(
    () =>
      turnIntoItems.find((item) => item.value === (value ?? KEYS.p)) ??
      turnIntoItems[0],
    [value],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          className="min-w-[125px]"
          pressed={open}
          tooltip="Turn into"
          isDropdown
        >
          {selectedItem.label}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar min-w-0"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
        align="start"
      >
        <DropdownMenuGroup>
          {turnIntoItems.map(({ icon, label, value: itemValue }) => (
            <DropdownMenuCheckboxItem
              key={itemValue}
              checked={value === itemValue}
              onCheckedChange={(checked) => {
                if (checked) {
                  setBlockType(editor, itemValue);
                }
              }}
            >
              {icon}
              {label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
