import { Editor } from '@tiptap/react';
import { Bold, Italic, Underline, Heading1, Heading2, ListOrdered, List, Link, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

export type FormatMenuProps = {
  editor: Editor;
  position: { x: number, y: number };
  onClose: () => void;
};

export function FormatMenu({ editor, position, onClose }: FormatMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Adjust position if menu goes off screen
  useEffect(() => {
    if (!menuRef.current) return;
    
    const rect = menuRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    
    let newX = position.x;
    if (newX + rect.width > windowWidth) {
      newX = windowWidth - rect.width - 20;
    }

    menuRef.current.style.left = `${newX}px`;
    menuRef.current.style.top = `${position.y}px`;
  }, [position]);

  return (
    <div 
      ref={menuRef}
      className="format-menu fixed bg-white rounded-lg shadow-xl border border-gray-200 p-1 flex items-center space-x-1 z-50"
      style={{ 
        top: position.y, 
        left: position.x,
        transform: 'translateX(-50%)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      <Button 
        size="icon" 
        variant={editor.isActive('bold') ? 'default' : 'ghost'} 
        className="h-8 w-8" 
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button 
        size="icon" 
        variant={editor.isActive('italic') ? 'default' : 'ghost'} 
        className="h-8 w-8" 
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      
      <Button 
        size="icon" 
        variant={editor.isActive('underline') ? 'default' : 'ghost'} 
        className="h-8 w-8" 
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
      
      <div className="h-5 border-r border-gray-300 mx-1"></div>
      
      <Button 
        size="icon" 
        variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'} 
        className="h-8 w-8" 
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      
      <Button 
        size="icon" 
        variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'} 
        className="h-8 w-8" 
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      
      <div className="h-5 border-r border-gray-300 mx-1"></div>
      
      <Button 
        size="icon" 
        variant={editor.isActive('bulletList') ? 'default' : 'ghost'} 
        className="h-8 w-8" 
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      
      <Button 
        size="icon" 
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'} 
        className="h-8 w-8" 
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <div className="h-5 border-r border-gray-300 mx-1"></div>
      
      <Button 
        size="icon" 
        variant={editor.isActive('link') ? 'default' : 'ghost'} 
        className="h-8 w-8" 
        onClick={() => {
          const url = window.prompt('URL');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          } else if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
          }
        }}
        title="Link"
      >
        <Link className="h-4 w-4" />
      </Button>
    </div>
  );
}
