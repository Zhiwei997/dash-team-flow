import { useState, useEffect, useRef, useCallback } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays } from "date-fns";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Task, useUpdateTask } from "@/hooks/useTasks";
import { ProjectMember } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";
import TaskEditModal from "./TaskEditModal";
import EditableProgress from "./EditableProgress";

interface GanttChartProps {
  tasks: Task[];
  projectMembers?: ProjectMember[];
}

interface GroupedTasks {
  [key: string]: Task[];
}

const GanttChart = ({ tasks, projectMembers = [] }: GanttChartProps) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<{ task: Task; startX: number; initialLeft: number; initialWidth: number } | null>(null);
  const [resizingTask, setResizingTask] = useState<{ task: Task; handle: 'start' | 'end'; startX: number; initialLeft: number; initialWidth: number } | null>(null);
  
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const updateTaskMutation = useUpdateTask();

  // Calculate date range based on tasks
  useEffect(() => {
    if (tasks.length === 0) {
      const today = new Date();
      setDateRange({
        start: startOfWeek(today),
        end: endOfWeek(addDays(today, 60))
      });
      return;
    }

    const allDates = tasks.flatMap(task => [
      new Date(task.start_date),
      new Date(task.end_date)
    ]);

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    setDateRange({
      start: startOfWeek(addDays(minDate, -7)),
      end: endOfWeek(addDays(maxDate, 14))
    });
  }, [tasks]);

  // Synchronize scroll between header and body
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    
    if (headerScrollRef.current && e.currentTarget !== headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollLeft;
    }
    
    if (bodyScrollRef.current && e.currentTarget !== bodyScrollRef.current) {
      bodyScrollRef.current.scrollLeft = scrollLeft;
    }
  };

  // Group tasks by module
  const groupedTasks: GroupedTasks = tasks.reduce((acc, task) => {
    const group = task.module_name || "General";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(task);
    return acc;
  }, {} as GroupedTasks);

  const toggleGroup = (groupName: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName);
    } else {
      newCollapsed.add(groupName);
    }
    setCollapsedGroups(newCollapsed);
  };

  // Task progress update handler
  const handleProgressUpdate = useCallback(async (taskId: string, progress: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        project_id: task.project_id,
        updates: { progress },
      });
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  }, [tasks, updateTaskMutation]);

  // Task bar position calculation
  const getTaskBarPosition = useCallback((task: Task) => {
    if (!dateRange) return { left: 0, width: 0 };
    
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);
    const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;
    
    const startOffset = differenceInDays(taskStart, dateRange.start);
    const duration = differenceInDays(taskEnd, taskStart) + 1;
    
    const left = Math.max(0, (startOffset / totalDays) * 100);
    const width = Math.min(100 - left, (duration / totalDays) * 100);
    
    return { left, width };
  }, [dateRange]);

  // Drag and drop handlers
  const handleTaskMouseDown = useCallback((e: React.MouseEvent, task: Task) => {
    if (!timelineRef.current || !dateRange) return;
    
    e.preventDefault();
    const rect = timelineRef.current.getBoundingClientRect();
    const { left, width } = getTaskBarPosition(task);
    
    setDraggedTask({
      task,
      startX: e.clientX,
      initialLeft: left,
      initialWidth: width,
    });
  }, [dateRange, getTaskBarPosition]);

  const handleTaskResizeMouseDown = useCallback((e: React.MouseEvent, task: Task, handle: 'start' | 'end') => {
    if (!timelineRef.current || !dateRange) return;
    
    e.preventDefault();
    e.stopPropagation();
    const rect = timelineRef.current.getBoundingClientRect();
    const { left, width } = getTaskBarPosition(task);
    
    setResizingTask({
      task,
      handle,
      startX: e.clientX,
      initialLeft: left,
      initialWidth: width,
    });
  }, [dateRange, getTaskBarPosition]);

  // Mouse move handler for drag/resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current || !dateRange) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;
      const dayWidth = rect.width / totalDays;
      
      if (draggedTask) {
        const deltaX = e.clientX - draggedTask.startX;
        const deltaDays = Math.round(deltaX / dayWidth);
        
        const newStartDate = addDays(new Date(draggedTask.task.start_date), deltaDays);
        const newEndDate = addDays(new Date(draggedTask.task.end_date), deltaDays);
        
        // Update task dates
        updateTaskMutation.mutate({
          id: draggedTask.task.id,
          project_id: draggedTask.task.project_id,
          updates: {
            start_date: format(newStartDate, "yyyy-MM-dd"),
            end_date: format(newEndDate, "yyyy-MM-dd"),
          },
        });
      }
      
      if (resizingTask) {
        const deltaX = e.clientX - resizingTask.startX;
        const deltaDays = Math.round(deltaX / dayWidth);
        
        if (resizingTask.handle === 'start') {
          const newStartDate = addDays(new Date(resizingTask.task.start_date), deltaDays);
          const endDate = new Date(resizingTask.task.end_date);
          
          if (newStartDate <= endDate) {
            updateTaskMutation.mutate({
              id: resizingTask.task.id,
              project_id: resizingTask.task.project_id,
              updates: {
                start_date: format(newStartDate, "yyyy-MM-dd"),
              },
            });
          }
        } else {
          const startDate = new Date(resizingTask.task.start_date);
          const newEndDate = addDays(new Date(resizingTask.task.end_date), deltaDays);
          
          if (newEndDate >= startDate) {
            updateTaskMutation.mutate({
              id: resizingTask.task.id,
              project_id: resizingTask.task.project_id,
              updates: {
                end_date: format(newEndDate, "yyyy-MM-dd"),
              },
            });
          }
        }
      }
    };

    const handleMouseUp = () => {
      setDraggedTask(null);
      setResizingTask(null);
    };

    if (draggedTask || resizingTask) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedTask, resizingTask, dateRange, updateTaskMutation]);

  if (!dateRange) return null;

  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  const totalDays = days.length;

  const getTaskPosition = (task: Task) => {
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);
    
    const startOffset = differenceInDays(taskStart, dateRange!.start);
    const duration = differenceInDays(taskEnd, taskStart) + 1;
    
    const left = Math.max(0, (startOffset / totalDays) * 100);
    const width = Math.min(100 - left, (duration / totalDays) * 100);
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const renderGroupProgress = (groupTasks: Task[]) => {
    const totalProgress = groupTasks.reduce((sum, task) => sum + task.progress, 0);
    const avgProgress = groupTasks.length > 0 ? Math.round(totalProgress / groupTasks.length) : 0;
    
    if (groupTasks.length === 0) return null;

    const earliestStart = new Date(Math.min(...groupTasks.map(t => new Date(t.start_date).getTime())));
    const latestEnd = new Date(Math.max(...groupTasks.map(t => new Date(t.end_date).getTime())));
    
    const position = getTaskPosition({
      start_date: format(earliestStart, "yyyy-MM-dd"),
      end_date: format(latestEnd, "yyyy-MM-dd"),
    } as Task);

    return (
      <div
        className="absolute h-6 bg-muted border border-border rounded"
        style={position}
      >
        <div className="flex items-center justify-between h-full px-2 text-xs">
          <span className="text-muted-foreground font-medium">100%</span>
          <span className="text-muted-foreground">{avgProgress}%</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="border border-border rounded-lg bg-background overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[400px_1fr] border-b border-border">
          <div className="p-4 bg-muted/50 border-r border-border">
            <div className="grid grid-cols-[1fr_100px_60px] gap-4 items-center">
              <span className="text-sm font-medium text-muted-foreground">Task</span>
              <span className="text-sm font-medium text-muted-foreground">Assignee</span>
              <span className="text-sm font-medium text-muted-foreground">Progress</span>
            </div>
          </div>
          <div 
            ref={headerScrollRef}
            className="overflow-x-hidden" 
            onScroll={handleScroll}
          >
            <div className="flex bg-muted/50 min-w-max">
              {days.map((day, index) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-shrink-0 w-12 p-2 text-center border-r border-border last:border-r-0",
                    index % 7 === 0 || index % 7 === 6 ? "bg-muted/70" : ""
                  )}
                >
                  <div className="text-xs text-muted-foreground">
                    {format(day, "EEE")}
                  </div>
                  <div className="text-xs font-medium">
                    {format(day, "dd")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks Container */}
        <div className="relative">
          {/* Tasks Body */}
          <div className="grid grid-cols-[400px_1fr]">
            {/* Left Panel - Task Info (Sticky) */}
            <div className="bg-background border-r border-border divide-y divide-border max-h-[600px] overflow-y-auto">
              {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                <div key={groupName}>
                  {/* Group Header */}
                  <div className="p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <button
                      onClick={() => toggleGroup(groupName)}
                      className="flex items-center gap-2 text-left w-full"
                    >
                      {collapsedGroups.has(groupName) ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span className="font-semibold text-foreground">{groupName}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {Math.round(groupTasks.reduce((sum, task) => sum + task.progress, 0) / groupTasks.length)}%
                      </span>
                    </button>
                  </div>

                  {/* Group Tasks */}
                  {!collapsedGroups.has(groupName) && groupTasks.map((task) => (
                    <div key={task.id} className="p-3 hover:bg-muted/30 transition-colors">
                      <div className="grid grid-cols-[1fr_100px_60px] gap-4 items-center">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {task.task_name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {format(new Date(task.start_date), "MMM dd")} - {format(new Date(task.end_date), "MMM dd")}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {task.assignee?.full_name || "Unassigned"}
                        </div>
                        <div className="flex justify-center">
                          <EditableProgress
                            value={task.progress}
                            onSave={(progress) => handleProgressUpdate(task.id, progress)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Right Panel - Timeline */}
            <div 
              ref={bodyScrollRef}
              className="overflow-x-auto max-h-[600px] overflow-y-hidden"
              onScroll={handleScroll}
            >
              <div 
                ref={timelineRef}
                className="relative divide-y divide-border"
                style={{ width: `${totalDays * 48}px` }}
              >
                {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                  <div key={groupName}>
                    {/* Group Timeline */}
                    <div className="relative h-12 bg-muted/20">
                      <div className="absolute inset-0 flex items-center">
                        {renderGroupProgress(groupTasks)}
                      </div>
                    </div>

                    {/* Task Timelines */}
                    {!collapsedGroups.has(groupName) && groupTasks.map((task) => {
                      const { left, width } = getTaskBarPosition(task);
                      
                      return (
                        <div key={task.id} className="relative h-12 hover:bg-muted/20 transition-colors">
                          <div className="absolute inset-0 flex items-center">
                            <div
                              className={cn(
                                "absolute h-6 rounded-md cursor-pointer group transition-all hover:h-7 hover:shadow-lg",
                                draggedTask?.task.id === task.id && "opacity-50",
                                resizingTask?.task.id === task.id && "ring-2 ring-primary"
                              )}
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                backgroundColor: task.color,
                              }}
                              onMouseDown={(e) => handleTaskMouseDown(e, task)}
                              onDoubleClick={() => setEditingTask(task)}
                            >
                              {/* Progress overlay */}
                              <div 
                                className="absolute inset-0 bg-white/20 rounded-md transition-all"
                                style={{ width: `${task.progress}%` }}
                              />
                              
                              {/* Task content */}
                              <div className="flex items-center justify-between h-full px-2 text-xs text-white font-medium relative z-10">
                                <span className="truncate flex-1">
                                  {width > 15 ? task.task_name : task.assignee?.full_name?.charAt(0) || "T"}
                                </span>
                                {width > 20 && (
                                  <span className="ml-1 text-white/80">{task.progress}%</span>
                                )}
                              </div>
                              
                              {/* Resize handles */}
                              <div
                                className="absolute left-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-l-md transition-opacity"
                                onMouseDown={(e) => handleTaskResizeMouseDown(e, task, 'start')}
                              />
                              <div
                                className="absolute right-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-r-md transition-opacity"
                                onMouseDown={(e) => handleTaskResizeMouseDown(e, task, 'end')}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {tasks.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <p>No tasks yet. Click "Add Task" to get started!</p>
        </div>
      )}

      {/* Task Edit Modal */}
      <TaskEditModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        projectMembers={projectMembers}
      />
    </>
  );
};

export default GanttChart;