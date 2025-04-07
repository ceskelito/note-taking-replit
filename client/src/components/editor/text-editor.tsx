import { Editor } from '@tiptap/react';
import { useCallback } from 'react';

export type TextEditorProps = {
  editor: Editor | null;
  onSelectionChange?: () => void;
};

export function TextEditor({ editor, onSelectionChange }: TextEditorProps) {
  const handleSelectionChange = useCallback(() => {
    if (onSelectionChange) {
      onSelectionChange();
    }
  }, [onSelectionChange]);

  if (!editor) {
    return (
      <div className="editor-content border border-dashed border-gray-300 rounded-md p-4 text-gray-400 min-h-[200px]">
        Loading editor...
      </div>
    );
  }

  return (
    <div
      className="editor-content font-serif prose prose-lg max-w-none leading-relaxed"
      onClick={() => editor.commands.focus()}
      onMouseUp={handleSelectionChange}
      onKeyUp={handleSelectionChange}
    >
      <div className={editor.isEmpty ? 'text-gray-400' : ''}>
        {editor.view.dom}
      </div>
    </div>
  );
}
