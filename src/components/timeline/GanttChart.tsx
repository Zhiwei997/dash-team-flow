import { useState, useEffect, useRef, useCallback } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
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

  if (!dateRange) return null;

  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  const totalDays = days.length;

  // Generate months for header
  const months = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end });
  const monthSpans = months.map(month => {
    const monthStart = month > dateRange.start ? month : dateRange.start;
    const monthEnd = endOfMonth(month) < dateRange.end ? endOfMonth(month) : dateRange.end;
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;
    const startOffset = differenceInDays(monthStart, dateRange.start);
    
    return {
      month,
      name: format(month, "MMMM yyyy"),
      daysCount: daysInMonth,
      startOffset,
    };
  });

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
            <div className="bg-muted/50 min-w-max">
              {/* Month Header Row */}
              <div className="flex border-b border-border/50">
                {monthSpans.map((monthSpan) => (
                  <div
                    key={monthSpan.month.toISOString()}
                    className="flex-shrink-0 p-2 text-center border-r border-border/30 last:border-r-0 bg-muted/30"
                    style={{ width: `${monthSpan.daysCount * 48}px` }}
                  >
                    <div className="text-sm font-semibold text-foreground">
                      {monthSpan.name}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Day Header Row */}
              <div className="flex">
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
                    {/* Group Timeline - Empty placeholder for alignment */}
                    <div className="relative h-12 bg-muted/10">
                      {/* No progress bar - just placeholder for group alignment */}
                    </div>

                    {/* Task Timelines */}
                    {!collapsedGroups.has(groupName) && groupTasks.map((task) => {
                      const { left, width } = getTaskBarPosition(task);
                      
                      return (
                        <div key={task.id} className="relative h-12 hover:bg-muted/20 transition-colors">
                          <div className="absolute inset-0 flex items-center">
                            <div
                              className={cn(
                                "absolute h-6 rounded-md cursor-pointer group transition-all hover:h-7 hover:shadow-lg"
                              )}
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                backgroundColor: task.color,
                                opacity: 0.7,
                              }}
                              onDoubleClick={() => setEditingTask(task)}
                            >
                              {/* Progress overlay - completed portion (darker) */}
                              <div 
                                className="absolute inset-0 rounded-md transition-all"
                                style={{ 
                                  width: `${task.progress}%`,
                                  backgroundColor: task.color,
                                  opacity: 1,
                                }}
                              />
                              
                              {/* Task content */}
                              <div className="flex items-center justify-between h-full px-2 text-xs text-white font-medium relative z-10">
                                <span className="truncate flex-1">
                                  {width > 15 ? task.task_name : task.assignee?.full_name?.charAt(0) || "T"}
                                </span>
                                {width > 20 && (
                                  <span className="ml-1 text-white/90 drop-shadow-sm">{task.progress}%</span>
                                )}
                              </div>
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