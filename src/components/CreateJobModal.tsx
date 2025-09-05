import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { useCreateJob } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const CreateJobModal = ({ isOpen, onClose, projectId }: CreateJobModalProps) => {
  const { user } = useAuth();
  const createJobMutation = useCreateJob();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    required_people: 1,
    publisher_name: user?.user_metadata?.full_name || "",
    publisher_email: user?.email || "",
    publisher_phone: "",
    deadline: undefined as Date | undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createJobMutation.mutate({
      project_id: projectId,
      title: formData.title,
      description: formData.description,
      required_people: formData.required_people,
      publisher_name: formData.publisher_name,
      publisher_email: formData.publisher_email,
      publisher_phone: formData.publisher_phone || undefined,
      deadline: formData.deadline ? format(formData.deadline, 'yyyy-MM-dd') : undefined,
      created_by: user?.id || "",
    }, {
      onSuccess: () => {
        onClose();
        setFormData({
          title: "",
          description: "",
          required_people: 1,
          publisher_name: user?.user_metadata?.full_name || "",
          publisher_email: user?.email || "",
          publisher_phone: "",
          deadline: undefined,
        });
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Job</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter job title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the job requirements, responsibilities, and any other details..."
              className="min-h-[120px]"
              required
            />
            <div className="flex items-center gap-2 mt-2">
              <Button type="button" variant="outline" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Images/Files
              </Button>
              <span className="text-sm text-muted-foreground">
                Attach relevant documents or images
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="required_people">Required Number of People</Label>
            <Input
              id="required_people"
              type="number"
              min="1"
              value={formData.required_people}
              onChange={(e) => setFormData({ ...formData, required_people: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publisher_name">Publisher Name</Label>
              <Input
                id="publisher_name"
                value={formData.publisher_name}
                onChange={(e) => setFormData({ ...formData, publisher_name: e.target.value })}
                placeholder="Your name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publisher_email">Publisher Email</Label>
              <Input
                id="publisher_email"
                type="email"
                value={formData.publisher_email}
                onChange={(e) => setFormData({ ...formData, publisher_email: e.target.value })}
                placeholder="your.email@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="publisher_phone">Publisher Phone (Optional)</Label>
            <Input
              id="publisher_phone"
              value={formData.publisher_phone}
              onChange={(e) => setFormData({ ...formData, publisher_phone: e.target.value })}
              placeholder="Your phone number"
            />
          </div>

          <div className="space-y-2">
            <Label>Application Deadline (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deadline ? format(formData.deadline, "PPP") : "Select deadline"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.deadline}
                  onSelect={(date) => setFormData({ ...formData, deadline: date })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createJobMutation.isPending}>
              {createJobMutation.isPending ? "Creating..." : "Create Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};