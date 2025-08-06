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
    onSave(numValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
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
          "w-12 h-6 text-xs bg-background border border-border rounded px-1 text-center",
          className
        )}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        "text-xs hover:bg-muted rounded px-1 transition-colors min-w-[2rem] text-center",
        className
      )}
    >
      {value}%
    </button>
  );
};

export default EditableProgress;