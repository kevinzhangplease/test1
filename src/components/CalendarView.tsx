import { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
  isSameMonth,
  isToday,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths,
} from 'date-fns';
import { Project, Task } from '../types';

interface Props {
  projects: Project[];
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

function getProjectColor(projects: Project[], projectId: string): string {
  return projects.find((p) => p.id === projectId)?.color ?? '#6b7280';
}

export default function CalendarView({ projects, tasks, onEditTask }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => {
      try {
        const start = parseISO(task.startDate);
        const end = parseISO(task.endDate);
        if (task.type === 'milestone') {
          return isSameDay(day, start);
        }
        return isWithinInterval(day, { start, end });
      } catch {
        return false;
      }
    });
  };

  const isTaskStart = (task: Task, day: Date) => {
    try {
      return isSameDay(parseISO(task.startDate), day);
    } catch {
      return false;
    }
  };

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MAX_VISIBLE = 3;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
        >
          ‹
        </button>
        <h2 className="text-lg font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 overflow-hidden" style={{ gridTemplateRows: `repeat(${days.length / 7}, 1fr)` }}>
        {days.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);
          const visibleTasks = dayTasks.slice(0, MAX_VISIBLE);
          const hiddenCount = dayTasks.length - MAX_VISIBLE;

          return (
            <div
              key={day.toISOString()}
              className={`border-r border-b border-gray-100 p-1 min-h-0 overflow-hidden ${
                !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              {/* Day number */}
              <div className="flex items-center justify-end mb-1">
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    isCurrentDay
                      ? 'bg-blue-600 text-white'
                      : isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-0.5">
                {visibleTasks.map((task) => {
                  const color = getProjectColor(projects, task.projectId);
                  const isStart = isTaskStart(task, day);

                  if (task.type === 'milestone') {
                    return (
                      <button
                        key={task.id}
                        onClick={() => onEditTask(task)}
                        className="w-full flex items-center gap-1 px-1 py-0.5 rounded hover:opacity-80 transition-opacity"
                        title={task.name}
                      >
                        <span
                          className="w-2.5 h-2.5 flex-shrink-0 rotate-45 border-2 rounded-sm"
                          style={{ borderColor: color, backgroundColor: color }}
                        />
                        <span className="text-xs truncate font-medium" style={{ color }}>
                          {task.name}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={task.id}
                      onClick={() => onEditTask(task)}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-xs text-white truncate hover:opacity-80 transition-opacity ${
                        task.type === 'deliverable' ? 'deliverable-stripe' : ''
                      }`}
                      style={{
                        backgroundColor: color,
                        opacity: isStart ? 1 : 0.85,
                        borderLeft: isStart ? `3px solid ${color}` : 'none',
                        fontWeight: isStart ? 600 : 400,
                      }}
                      title={task.name}
                    >
                      {isStart ? task.name : ''}
                    </button>
                  );
                })}

                {hiddenCount > 0 && (
                  <div className="text-xs text-gray-500 px-1 font-medium">
                    +{hiddenCount} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-gray-200 flex items-center gap-6">
        <span className="text-xs font-medium text-gray-500">Legend:</span>
        {projects.map((project) => (
          <div key={project.id} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <span className="text-xs text-gray-600">{project.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rotate-45 border-2 border-purple-500 rounded-sm" />
          <span className="text-xs text-gray-600">Milestone</span>
        </div>
      </div>
    </div>
  );
}
