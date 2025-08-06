import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays } from "date-fns";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface GanttChartProps {
  tasks: Task[];
}

interface GroupedTasks {
  [key: string]: Task[];
}

const GanttChart = ({ tasks }: GanttChartProps) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>();

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
    <div className="border border-border rounded-lg bg-background">
      {/* Header */}
      <div className="grid grid-cols-[300px_1fr] border-b border-border">
        <div className="p-4 bg-muted/50 border-r border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Assigned</span>
            <span className="text-sm font-medium text-muted-foreground">Progress</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex min-w-max bg-muted/50">
            {days.map((day, index) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex-shrink-0 w-12 p-2 text-center border-r border-border last:border-r-0",
                  index % 7 === 0 || index % 7 === 6 ? "bg-muted" : ""
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

      {/* Tasks */}
      <div className="divide-y divide-border">
        {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
          <div key={groupName}>
            {/* Group Header */}
            <div className="grid grid-cols-[300px_1fr] hover:bg-muted/50">
              <div className="p-3 border-r border-border">
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
                  <span className="text-xs text-muted-foreground">100%</span>
                </button>
              </div>
              <div className="relative h-12 overflow-x-auto">
                <div className="absolute inset-0 flex items-center" style={{ width: `${totalDays * 48}px` }}>
                  {renderGroupProgress(groupTasks)}
                </div>
              </div>
            </div>

            {/* Group Tasks */}
            {!collapsedGroups.has(groupName) && groupTasks.map((task) => (
              <div key={task.id} className="grid grid-cols-[300px_1fr] hover:bg-muted/50">
                <div className="p-3 border-r border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {task.task_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {task.assignee?.full_name || "Unassigned"}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground ml-2">
                      {task.progress}%
                    </div>
                  </div>
                </div>
                <div className="relative h-12 overflow-x-auto">
                  <div className="absolute inset-0 flex items-center" style={{ width: `${totalDays * 48}px` }}>
                    <div
                      className="absolute h-6 rounded flex items-center"
                      style={{
                        ...getTaskPosition(task),
                        backgroundColor: task.color,
                      }}
                    >
                      <div className="flex items-center justify-between w-full px-2 text-xs text-white">
                        <span className="truncate">{task.assignee?.full_name || task.task_name}</span>
                      </div>
                      <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b" style={{ width: `${task.progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <p>No tasks yet. Click "Add Task" to get started!</p>
        </div>
      )}
    </div>
  );
};

export default GanttChart;