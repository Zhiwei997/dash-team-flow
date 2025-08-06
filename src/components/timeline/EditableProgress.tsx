import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface EditableProgressProps {
  value: number;
  onSave: (value: number) => void;
  className?: string;
}

const EditableProgress = ({ value, onSave, className }: EditableProgressProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value.toString());
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const numValue = Math.max(0, Math.min(100, parseInt(editValue) || 0));
    if (numValue !== value) {
      onSave(numValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value.toString());
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min="0"
        max="100"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(
          "w-14 h-7 text-xs bg-background border border-primary rounded px-2 text-center focus:outline-none focus:ring-2 focus:ring-primary/20",
          className
        )}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        "text-xs hover:bg-muted/60 rounded px-2 py-1 transition-colors min-w-[3rem] text-center border border-transparent hover:border-border",
        className
      )}
    >
      {value}%
    </button>
  );
};

export default EditableProgress;