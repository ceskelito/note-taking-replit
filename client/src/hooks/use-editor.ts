import { useState, useEffect, useCallback } from 'react';
import { useEditor as useTiptapEditor } from '@tiptap/react';
import { getExtensions } from '@/lib/tiptap';
import { Editor } from '@tiptap/core';

export interface EditorHook {
  editor: Editor | null;
  handleSelectionChange: () => void;
}

export interface UseEditorProps {
  content: string;
  onUpdate?: (params: { editor: Editor }) => void;
  onSelectionUpdate?: (params: { editor: Editor }) => void;
}

export function useEditor({
  content,
  onUpdate,
  onSelectionUpdate,
}: UseEditorProps): EditorHook {
  const editor = useTiptapEditor({
    extensions: getExtensions(),
    content,
    autofocus: 'end',
    onUpdate,
    onSelectionUpdate,
  });

  const handleSelectionChange = useCallback(() => {
    if (editor && onSelectionUpdate) {
      onSelectionUpdate({ editor });
    }
  }, [editor, onSelectionUpdate]);

  return {
    editor,
    handleSelectionChange,
  };
}
