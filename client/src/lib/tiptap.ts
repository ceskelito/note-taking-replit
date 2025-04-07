// Import necessary Tiptap extensions
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import { Extension } from '@tiptap/core';

// Export a function to get all configured extensions
export function getExtensions() {
  return [
    StarterKit.configure({
      heading: false, // I'll add a custom configuration
      bulletList: false,
      orderedList: false,
    }),
    Underline,
    Link.configure({
      openOnClick: true,
      linkOnPaste: true,
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right'],
    }),
    Placeholder.configure({
      placeholder: 'Start writing your note...',
    }),
    Heading.configure({
      levels: [1, 2, 3],
    }),
    BulletList,
    OrderedList,
    ListItem,
    TextStyle,
    FontFamily.configure({
      types: ['textStyle'],
      defaultFamily: 'Inter',
      families: {
        'serif': 'Merriweather, serif',
        'sans-serif': 'Inter, sans-serif',
        'mono': 'JetBrains Mono, monospace',
      },
    }),
    Color.configure({
      types: ['textStyle'],
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Code,
    CodeBlock,
  ];
}
