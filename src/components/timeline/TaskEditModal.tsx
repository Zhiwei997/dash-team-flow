import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Task, useUpdateTask } from "@/hooks/useTasks";
import { ProjectMember } from "@/hooks/useProjects";

const taskFormSchema = z.object({
  task_name: z.string().min(1, "Task name is required"),
  assigned_to: z.string().optional(),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  end_date: z.date({
    required_error: "End date is required",
  }),
  module_name: z.string().optional(),
  color: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
}).refine((data) => data.end_date >= data.start_date, {
  message: "End date must be after start date",
  path: ["end_date"],
});

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  projectMembers: ProjectMember[];
}

const TaskEditModal = ({ task, isOpen, onClose, projectMembers }: TaskEditModalProps) => {
  const updateTaskMutation = useUpdateTask();

  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      task_name: "",
      assigned_to: "unassigned",
      start_date: new Date(),
      end_date: new Date(),
      module_name: "",
      color: "#3b82f6",
      progress: 0,
    },
  });

  // Update form when task changes
  useEffect(() => {
    if (task && isOpen) {
      // Handle assigned_to: convert null/empty to "unassigned" for the Select component
      const assignedValue = task.assigned_to &&
        projectMembers.some(member => member.user_id === task.assigned_to)
        ? task.assigned_to
        : "unassigned";

      form.reset({
        task_name: task.task_name || "",
        assigned_to: assignedValue,
        start_date: new Date(task.start_date),
        end_date: new Date(task.end_date),
        module_name: task.module_name || "",
        color: task.color || "#3b82f6",
        progress: task.progress || 0,
      });
    }
  }, [task, isOpen, form, projectMembers]);

  const onSubmit = async (values: z.infer<typeof taskFormSchema>) => {
    if (!task) return;

    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        project_id: task.project_id,
        updates: {
          task_name: values.task_name,
          assigned_to: values.assigned_to === "unassigned" ? null : values.assigned_to,
          start_date: format(values.start_date, "yyyy-MM-dd"),
          end_date: format(values.end_date, "yyyy-MM-dd"),
          module_name: values.module_name || null,
          color: values.color || "#3b82f6",
          progress: values.progress || 0,
        },
      });
      onClose();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const taskColors = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
    "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="task_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "unassigned"}
                    key={task?.id || "empty"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {projectMembers
                        .filter((member) => member.user_id && member.user?.full_name)
                        .map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.user?.full_name || member.user?.email || "Unknown User"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="module_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Module (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AiNDORA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="flex gap-2 flex-wrap">
                      {taskColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn(
                            "w-8 h-8 rounded border-2 transition-all",
                            field.value === color
                              ? "border-foreground scale-110"
                              : "border-border hover:scale-105"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => field.onChange(color)}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTaskMutation.isPending}>
                {updateTaskMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Task
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskEditModal;