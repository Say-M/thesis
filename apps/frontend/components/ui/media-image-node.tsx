"use client";

import * as React from "react";

import type { TImageElement } from "platejs";
import type { PlateElementProps } from "platejs/react";

import { useDraggable } from "@platejs/dnd";
import { Image, ImagePlugin, useMediaState } from "@platejs/media/react";
import { ResizableProvider, useResizableValue } from "@platejs/resizable";
import {
  PlateElement,
  useEditorPlugin,
  useElement,
  useRemoveNodeButton,
  withHOC,
} from "platejs/react";

import { cn } from "@/lib/utils";

import { Caption, CaptionTextarea } from "./caption";
import { MediaToolbar } from "./media-toolbar";
import {
  mediaResizeHandleVariants,
  Resizable,
  ResizeHandle,
} from "./resize-handle";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon, Trash2Icon } from "lucide-react";
import { TextAlignPlugin } from "@platejs/basic-styles/react";
import { Alignment } from "@platejs/basic-styles";
import { Button } from "./button";

export const ImageElement = withHOC(
  ResizableProvider,
  function ImageElement(props: PlateElementProps<TImageElement>) {
    const { editor, tf } = useEditorPlugin(TextAlignPlugin);
    const element = useElement();
    const { props: buttonProps } = useRemoveNodeButton({ element });
    const { align = "center", focused, readOnly, selected } = useMediaState();
    const width = useResizableValue("width");

    const { isDragging, handleRef } = useDraggable({
      element: props.element,
    });

    return (
      <MediaToolbar plugin={ImagePlugin}>
        <PlateElement {...props} className="py-2.5">
          <figure className="group relative m-0" contentEditable={false}>
            <Resizable
              align={align}
              options={{
                align,
                readOnly,
              }}
            >
              {!readOnly && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <ToggleGroup
                    size="icon-xs"
                    variant="outline"
                    className="bg-background"
                    type="single"
                    value={align}
                    onValueChange={(value) => {
                      tf.textAlign.setNodes(value as Alignment);
                      editor.tf.focus();
                    }}
                  >
                    <ToggleGroupItem value="left">
                      <AlignLeftIcon />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="center">
                      <AlignCenterIcon />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="right">
                      <AlignRightIcon />
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <Button size="icon-xs" className="rounded-sm" {...buttonProps}>
                    <Trash2Icon />
                  </Button>
                </div>
              )}
              <ResizeHandle
                className={mediaResizeHandleVariants({ direction: "left" })}
                options={{ direction: "left" }}
              />
              <Image
                ref={handleRef}
                className={cn(
                  "block w-full max-w-full cursor-pointer object-cover px-0",
                  "rounded-sm",
                  focused && selected && "ring-2 ring-ring ring-offset-2",
                  isDragging && "opacity-50",
                )}
                alt={props.attributes.alt as string | undefined}
              />
              <ResizeHandle
                className={mediaResizeHandleVariants({
                  direction: "right",
                })}
                options={{ direction: "right" }}
              />
            </Resizable>

            <Caption style={{ width }} align={align}>
              <CaptionTextarea
                readOnly={readOnly}
                onFocus={(e) => {
                  e.preventDefault();
                }}
                placeholder="Write a caption..."
              />
            </Caption>
          </figure>

          {props.children}
        </PlateElement>
      </MediaToolbar>
    );
  },
);
