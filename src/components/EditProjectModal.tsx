import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Project {
    id: string;
    project_name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
}

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onUpdate: (updates: any) => void;
}

const EditProjectModal = ({ isOpen, onClose, project, onUpdate }: EditProjectModalProps) => {
    const [formData, setFormData] = useState({
        project_name: "",
        description: "",
        start_date: undefined as Date | undefined,
        end_date: undefined as Date | undefined,
        status: "active",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (project) {
            setFormData({
                project_name: project.project_name,
                description: project.description || "",
                start_date: project.start_date ? new Date(project.start_date + 'T00:00:00') : undefined,
                end_date: project.end_date ? new Date(project.end_date + 'T00:00:00') : undefined,
                status: project.status || "active",
            });
        }
    }, [project]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        onUpdate({
            project_name: formData.project_name,
            description: formData.description || undefined,
            start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : undefined,
            end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : undefined,
            status: formData.status,
        });

        setIsSubmitting(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="project_name">Project Name</Label>
                        <Input
                            id="project_name"
                            value={formData.project_name}
                            onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                            placeholder="Enter project name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the project goals, scope, and any other details..."
                            className="min-h-[120px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select project status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="on-hold">On Hold</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date (Optional)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.start_date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.start_date ? format(formData.start_date, "PPP") : "Select start date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.start_date}
                                        onSelect={(date) => setFormData({ ...formData, start_date: date })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>End Date (Optional)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.end_date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.end_date ? format(formData.end_date, "PPP") : "Select end date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.end_date}
                                        onSelect={(date) => setFormData({ ...formData, end_date: date })}
                                        disabled={(date) =>
                                            formData.start_date ? date < formData.start_date : false
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Updating..." : "Update Project"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditProjectModal;
