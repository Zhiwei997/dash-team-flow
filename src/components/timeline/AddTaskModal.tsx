import { useState } from "react";
import { Calendar, CalendarIcon, Plus, User } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useCreateTask } from "@/hooks/useTasks";
import { ProjectMember } from "@/hooks/useProjects";

interface AddTaskModalProps {
  projectId: string;
  projectMembers: ProjectMember[];
}

const AddTaskModal = ({ projectId, projectMembers }: AddTaskModalProps) => {
  const [open, setOpen] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [moduleName, setModuleName] = useState("");

  const createTaskMutation = useCreateTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskName || !startDate || !endDate) {
      return;
    }

    await createTaskMutation.mutateAsync({
      project_id: projectId,
      task_name: taskName,
      assigned_to: assignedTo === "unassigned" ? null : assignedTo || null,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      module_name: moduleName || null,
      color: getRandomColor(),
    });

    // Reset form
    setTaskName("");
    setAssignedTo("");
    setStartDate(undefined);
    setEndDate(undefined);
    setModuleName("");
    setOpen(false);
  };

  const getRandomColor = () => {
    const colors = [
      "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
      "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskName">Task Name</Label>
            <Input
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="moduleName">Module (Optional)</Label>
            <Input
              id="moduleName"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              placeholder="e.g., AiNDORA"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned Team Member</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">No assignment</SelectItem>
                {projectMembers.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {member.user?.full_name || member.user?.email}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending || !taskName || !startDate || !endDate}
            >
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskModal;