import { useState, useEffect } from "react";
import { useEditor as useTiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import CodeBlock from "@tiptap/extension-code-block";

export interface TextFormatMenuPosition {
  x: number;
  y: number;
}

export interface UseEditorProps {
  content: string;
  onUpdate: (content: string) => void;
}

export const useEditor = ({ content, onUpdate }: UseEditorProps) => {
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<TextFormatMenuPosition>({ x: 0, y: 0 });
  const [isEditorReady, setIsEditorReady] = useState(false);
  
  const editor = useTiptapEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      Highlight,
      CodeBlock
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px]',
      },
    },
  });
  
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);
  
  useEffect(() => {
    if (editor) {
      setIsEditorReady(true);
    }
  }, [editor]);
  
  const handleTextSelection = () => {
    if (!editor) return;
    
    const { state } = editor;
    const { selection } = state;
    
    if (selection.empty) {
      setShowFormatMenu(false);
      return;
    }
    
    // Get the selection coordinates
    const { ranges } = selection;
    if (ranges.length > 0) {
      const domSelection = window.getSelection();
      if (domSelection && domSelection.rangeCount > 0) {
        const range = domSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Position the menu above the selection
        setMenuPosition({
          x: rect.left + (rect.width / 2) - 100, // Center the menu
          y: rect.top - 70 // Position above the text
        });
        
        setShowFormatMenu(true);
      }
    }
  };
  
  const formatText = (format: string) => {
    if (!editor) return;
    
    switch (format) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'strike':
        editor.chain().focus().toggleStrike().run();
        break;
      case 'heading1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'heading2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'code':
        const isCodeBlock = editor.isActive('codeBlock');
        
        if (isCodeBlock) {
          editor.chain().focus().toggleCodeBlock().run();
        } else if (editor.isActive('code')) {
          editor.chain().focus().unsetCode().run();
        } else {
          // Check if we have text selected
          if (editor.state.selection.empty) {
            // If no text is selected, toggle a code block
            editor.chain().focus().toggleCodeBlock().run();
          } else {
            // If text is selected, apply inline code
            editor.chain().focus().toggleCode().run();
          }
        }
        break;
    }
    
    setShowFormatMenu(false);
  };
  
  return {
    editor,
    isEditorReady,
    formatText,
    handleTextSelection,
    showFormatMenu,
    setShowFormatMenu,
    menuPosition,
  };
};
