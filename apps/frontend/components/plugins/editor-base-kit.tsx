import { BaseAlignKit } from '@/components/plugins/align-base-kit';
import { BaseBasicBlocksKit } from '@/components/plugins/basic-blocks-base-kit';
import { BaseBasicMarksKit } from '@/components/plugins/basic-marks-base-kit';
import { BaseCalloutKit } from '@/components/plugins/callout-base-kit';
import { BaseCodeBlockKit } from '@/components/plugins/code-block-base-kit';
import { BaseColumnKit } from '@/components/plugins/column-base-kit';
import { BaseDateKit } from '@/components/plugins/date-base-kit';
import { BaseFontKit } from '@/components/plugins/font-base-kit';
import { BaseLineHeightKit } from '@/components/plugins/line-height-base-kit';
import { BaseLinkKit } from '@/components/plugins/link-base-kit';
import { BaseListKit } from '@/components/plugins/list-base-kit';
import { MarkdownKit } from '@/components/plugins/markdown-kit';
import { BaseMathKit } from '@/components/plugins/math-base-kit';
import { BaseMediaKit } from '@/components/plugins/media-base-kit';
import { BaseTableKit } from '@/components/plugins/table-base-kit';
import { BaseTocKit } from '@/components/plugins/toc-base-kit';
import { BaseToggleKit } from '@/components/plugins/toggle-base-kit';

export const BaseEditorKit = [
  ...BaseBasicBlocksKit,
  ...BaseCodeBlockKit,
  ...BaseTableKit,
  ...BaseToggleKit,
  ...BaseTocKit,
  ...BaseMediaKit,
  ...BaseCalloutKit,
  ...BaseColumnKit,
  ...BaseMathKit,
  ...BaseDateKit,
  ...BaseLinkKit,
  ...BaseBasicMarksKit,
  ...BaseFontKit,
  ...BaseListKit,
  ...BaseAlignKit,
  ...BaseLineHeightKit,
  ...MarkdownKit,
];
