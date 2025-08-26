import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  X, 
  File,
  AlertCircle,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { formatFileSize } from "@/lib/utils";
import { 
  useUploadProjectFile,
} from "@/hooks/useProjectFiles";
import { useUserProjects } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";

interface UploadFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId: string;
}

interface FileWithDetails {
  file: File;
  name: string;
  description: string;
  progress: number;
  error?: string;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export const UploadFilesModal: React.FC<UploadFilesModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultProjectId 
}) => {
  const { toast } = useToast();
  const { data: projects = [] } = useUserProjects();
  const uploadMutation = useUploadProjectFile();
  
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId);
  const [files, setFiles] = useState<FileWithDetails[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const error = file.size > MAX_FILE_SIZE ? `File exceeds 500MB limit` : undefined;
      
      return {
        file,
        name: nameWithoutExt,
        description: "",
        progress: 0,
        error,
      };
    });
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFile = (index: number, updates: Partial<FileWithDetails>) => {
    setFiles(prev => prev.map((file, i) => i === index ? { ...file, ...updates } : file));
  };

  const validFiles = files.filter(f => !f.error);
  const canUpload = validFiles.length > 0 && !isUploading;

  const handleUpload = async () => {
    if (!canUpload) return;
    
    setIsUploading(true);
    
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const fileDetails = validFiles[i];
        const fileIndex = files.findIndex(f => f === fileDetails);
        
        updateFile(fileIndex, { progress: 0 });
        
        await uploadMutation.mutateAsync({
          file: fileDetails.file,
          projectId: selectedProjectId,
          description: fileDetails.description || undefined,
        });
        
        updateFile(fileIndex, { progress: 100 });
      }
      
      toast({
        title: "Files uploaded",
        description: `Successfully uploaded ${validFiles.length} file${validFiles.length !== 1 ? 's' : ''}`,
      });
      
      onClose();
      setFiles([]);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Some files failed to upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onClose();
      setFiles([]);
    }
  };

  React.useEffect(() => {
    setSelectedProjectId(defaultProjectId);
  }, [defaultProjectId]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Project Selector */}
          <div>
            <Label htmlFor="project-select">Project</Label>
            <Select 
              value={selectedProjectId} 
              onValueChange={setSelectedProjectId}
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dropzone */}
          <div>
            <Label>Files</Label>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
                }
                ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} disabled={isUploading} />
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                or click to select files
              </p>
              <p className="text-xs text-muted-foreground">
                Max 500 MB per file
              </p>
            </div>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-3">
              <Label>Selected Files</Label>
              {files.map((fileDetails, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <File className="h-4 w-4" />
                      <span className="font-medium">{fileDetails.file.name}</span>
                      <Badge variant="secondary">
                        {formatFileSize(fileDetails.file.size)}
                      </Badge>
                      {fileDetails.error && (
                        <Badge variant="destructive" className="flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>Error</span>
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {fileDetails.error && (
                    <p className="text-sm text-destructive">
                      {fileDetails.error}
                    </p>
                  )}

                  {!fileDetails.error && (
                    <>
                      <div>
                        <Label htmlFor={`name-${index}`}>File Name</Label>
                        <Input
                          id={`name-${index}`}
                          value={fileDetails.name}
                          onChange={(e) => updateFile(index, { name: e.target.value })}
                          disabled={isUploading}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`description-${index}`}>Description (optional)</Label>
                        <Textarea
                          id={`description-${index}`}
                          value={fileDetails.description}
                          onChange={(e) => updateFile(index, { description: e.target.value })}
                          placeholder="Enter file description"
                          rows={2}
                          disabled={isUploading}
                        />
                      </div>

                      {isUploading && fileDetails.progress > 0 && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Uploading...</span>
                            <span>{fileDetails.progress}%</span>
                          </div>
                          <Progress value={fileDetails.progress} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!canUpload}
          >
            {isUploading ? 'Uploading...' : `Upload ${validFiles.length} file${validFiles.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};