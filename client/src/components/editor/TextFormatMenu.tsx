import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Bold, Italic, Underline, Strikethrough, 
  Heading1, Heading2, List, ListOrdered, 
  Quote, Code 
} from "lucide-react";

interface TextFormatMenuPosition {
  x: number;
  y: number;
}

interface TextFormatMenuProps {
  position: TextFormatMenuPosition;
  onFormat: (format: string) => void;
  onClose: () => void;
}

const TextFormatMenu = ({ position, onFormat, onClose }: TextFormatMenuProps) => {
  return (
    <Card
      style={{
        position: 'absolute',
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 50,
      }}
      className="bg-white border border-gray-200 rounded-lg shadow-lg py-1"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center px-2 border-b border-gray-100 pb-1">
        <Button
          variant="ghost"
          size="icon"
          className="p-2 text-gray-700 hover:bg-gray-100 rounded"
          title="Bold"
          onClick={() => onFormat('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-2 text-gray-700 hover:bg-gray-100 rounded"
          title="Italic"
          onClick={() => onFormat('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-2 text-gray-700 hover:bg-gray-100 rounded"
          title="Underline"
          onClick={() => onFormat('underline')}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-2 text-gray-700 hover:bg-gray-100 rounded"
          title="Strikethrough"
          onClick={() => onFormat('strike')}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center px-2 pt-1">
        <Button
          variant="ghost"
          size="icon"
          className="p-2 text-gray-700 hover:bg-gray-100 rounded"
          title="Heading 1"
          onClick={() => onFormat('heading1')}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-2 text-gray-700 hover:bg-gray-100 rounded"
          title="Heading 2"
          onClick={() => onFormat('heading2')}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-2 text-gray-700 hover:bg-gray-100 rounded"
          title="Bullet List"
          onClick={() => onFormat('bulletList')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-2 text-gray-700 hover:bg-gray-100 rounded"
          title="Numbered List"
          onClick={() => onFormat('orderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-2 text-gray-700 hover:bg-gray-100 rounded"
          title="Quote"
          onClick={() => onFormat('blockquote')}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-2 text-gray-700 hover:bg-gray-100 rounded"
          title="Code"
          onClick={() => onFormat('code')}
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default TextFormatMenu;
