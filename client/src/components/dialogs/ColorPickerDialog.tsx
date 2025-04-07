import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface ColorPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedColor: string | null;
  onSelectColor: (color: string | null) => void;
}

const ColorPickerDialog = ({ 
  open, 
  onOpenChange, 
  selectedColor, 
  onSelectColor 
}: ColorPickerDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Note Color</DialogTitle>
          <DialogDescription>
            Choose a background color for your note
          </DialogDescription>
        </DialogHeader>
        
        <RadioGroup 
          value={selectedColor || ""} 
          onValueChange={(value) => onSelectColor(value === "" ? null : value)}
          className="flex flex-wrap gap-4 pt-4"
        >
          <div className="flex flex-col items-center space-y-2">
            <RadioGroupItem value="" id="color-none" className="sr-only" />
            <Label 
              htmlFor="color-none" 
              className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-100"
            >
              {!selectedColor && <Check className="h-5 w-5 text-gray-500" />}
            </Label>
            <span className="text-xs text-gray-500">None</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <RadioGroupItem value="yellow" id="color-yellow" className="sr-only" />
            <Label 
              htmlFor="color-yellow" 
              className="w-12 h-12 rounded-full bg-note-yellow flex items-center justify-center cursor-pointer hover:opacity-90"
            >
              {selectedColor === "yellow" && <Check className="h-5 w-5 text-yellow-800" />}
            </Label>
            <span className="text-xs text-gray-500">Yellow</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <RadioGroupItem value="blue" id="color-blue" className="sr-only" />
            <Label 
              htmlFor="color-blue" 
              className="w-12 h-12 rounded-full bg-note-blue flex items-center justify-center cursor-pointer hover:opacity-90"
            >
              {selectedColor === "blue" && <Check className="h-5 w-5 text-blue-800" />}
            </Label>
            <span className="text-xs text-gray-500">Blue</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <RadioGroupItem value="green" id="color-green" className="sr-only" />
            <Label 
              htmlFor="color-green" 
              className="w-12 h-12 rounded-full bg-note-green flex items-center justify-center cursor-pointer hover:opacity-90"
            >
              {selectedColor === "green" && <Check className="h-5 w-5 text-green-800" />}
            </Label>
            <span className="text-xs text-gray-500">Green</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <RadioGroupItem value="pink" id="color-pink" className="sr-only" />
            <Label 
              htmlFor="color-pink" 
              className="w-12 h-12 rounded-full bg-note-pink flex items-center justify-center cursor-pointer hover:opacity-90"
            >
              {selectedColor === "pink" && <Check className="h-5 w-5 text-pink-800" />}
            </Label>
            <span className="text-xs text-gray-500">Pink</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <RadioGroupItem value="purple" id="color-purple" className="sr-only" />
            <Label 
              htmlFor="color-purple" 
              className="w-12 h-12 rounded-full bg-note-purple flex items-center justify-center cursor-pointer hover:opacity-90"
            >
              {selectedColor === "purple" && <Check className="h-5 w-5 text-purple-800" />}
            </Label>
            <span className="text-xs text-gray-500">Purple</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <RadioGroupItem value="orange" id="color-orange" className="sr-only" />
            <Label 
              htmlFor="color-orange" 
              className="w-12 h-12 rounded-full bg-note-orange flex items-center justify-center cursor-pointer hover:opacity-90"
            >
              {selectedColor === "orange" && <Check className="h-5 w-5 text-orange-800" />}
            </Label>
            <span className="text-xs text-gray-500">Orange</span>
          </div>
        </RadioGroup>
      </DialogContent>
    </Dialog>
  );
};

export default ColorPickerDialog;
