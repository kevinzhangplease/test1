import { useState, useRef, useEffect } from 'react';
import {
  addDays,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isToday,
} from 'date-fns';
import { Project, Task } from '../types';

interface Props {
  projects: Project[];
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onAddTask: (projectId: string) => void;
}

type ZoomLevel = 'week' | 'month' | 'quarter';

const ZOOM_CONFIG: Record<ZoomLevel, { dayWidth: number; label: string }> = {
  week: { dayWidth: 40, label: 'Week' },
  month: { dayWidth: 16, label: 'Month' },
  quarter: { dayWidth: 6, label: 'Quarter' },
};

const LEFT_PANEL_WIDTH = 260;

function getDateRange(tasks: Task[], projects: Project[]) {
  const allDates: Date[] = [];
  [...tasks].forEach((t) => {
    try {
      allDates.push(parseISO(t.startDate), parseISO(t.endDate));
    } catch {}
  });
  [...projects].forEach((p) => {
    try {
      allDates.push(parseISO(p.startDate), parseISO(p.endDate));
    } catch {}
  });

  if (allDates.length === 0) {
    const now = new Date();
    return { start: addDays(now, -7), end: addDays(now, 60) };
  }

  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  return {
    start: addDays(startOfWeek(minDate, { weekStartsOn: 1 }), -7),
    end: addDays(endOfWeek(maxDate, { weekStartsOn: 1 }), 14),
  };
}

function TaskBar({
  task,
  project,
  rangeStart,
  dayWidth,
  rowHeight,
  onClick,
}: {
  task: Task;
  project: Project | undefined;
  rangeStart: Date;
  dayWidth: number;
  rowHeight: number;
  onClick: () => void;
}) {
  const color = project?.color ?? '#6b7280';
  let startDate: Date, endDate: Date;
  try {
    startDate = parseISO(task.startDate);
    endDate = parseISO(task.endDate);
  } catch {
    return null;
  }

  const left = differenceInDays(startDate, rangeStart) * dayWidth;
  const duration = Math.max(1, differenceInDays(endDate, startDate) + 1);
  const width = duration * dayWidth;

  if (task.type === 'milestone') {
    const size = rowHeight * 0.55;
    return (
      <g
        onClick={onClick}
        style={{ cursor: 'pointer' }}
        className="group"
      >
        <rect
          x={left + dayWidth / 2 - size / 2}
          y={(rowHeight - size) / 2}
          width={size}
          height={size}
          transform={`rotate(45 ${left + dayWidth / 2} ${rowHeight / 2})`}
          fill={color}
          rx={2}
        />
        <title>{task.name}</title>
      </g>
    );
  }

  const barHeight = rowHeight * 0.55;
  const barY = (rowHeight - barHeight) / 2;
  const progressWidth = (task.progress / 100) * width;

  // Deliverable: diagonal stripe pattern
  const isDeliverable = task.type === 'deliverable';
  const patternId = `stripe-${task.id}`;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} className="group">
      {isDeliverable && (
        <defs>
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
          </pattern>
        </defs>
      )}

      {/* Background bar */}
      <rect
        x={left}
        y={barY}
        width={width}
        height={barHeight}
        fill={color}
        opacity={0.25}
        rx={4}
      />
      {/* Progress bar */}
      <rect
        x={left}
        y={barY}
        width={progressWidth}
        height={barHeight}
        fill={color}
        rx={4}
        opacity={0.9}
      />
      {/* Stripe overlay for deliverables */}
      {isDeliverable && (
        <rect
          x={left}
          y={barY}
          width={width}
          height={barHeight}
          fill={`url(#${patternId})`}
          rx={4}
        />
      )}
      {/* Outline */}
      <rect
        x={left}
        y={barY}
        width={width}
        height={barHeight}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        rx={4}
        opacity={0.7}
      />
      {/* Task name label */}
      {width > 60 && (
        <text
          x={left + 8}
          y={barY + barHeight / 2 + 1}
          fontSize={11}
          fill="white"
          dominantBaseline="middle"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          <tspan>{task.name.length > Math.floor(width / 8) ? task.name.slice(0, Math.floor(width / 8) - 1) + '…' : task.name}</tspan>
        </text>
      )}
      <title>{task.name} ({task.progress}%)</title>
    </g>
  );
}

export default function GanttView({ projects, tasks, onEditTask, onAddTask }: Props) {
  const [zoom, setZoom] = useState<ZoomLevel>('month');
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);

  const { dayWidth } = ZOOM_CONFIG[zoom];
  const ROW_HEIGHT = 44;
  const HEADER_HEIGHT = 60;

  const allDates = getDateRange(tasks, projects);
  const rangeStart = allDates.start;
  const rangeEnd = allDates.end;
  const totalDays = differenceInDays(rangeEnd, rangeStart) + 1;
  const totalWidth = totalDays * dayWidth;

  const todayLeft = differenceInDays(new Date(), rangeStart) * dayWidth;

  // Sync horizontal scroll between header and body
  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Build rows
  const rows: Array<{ type: 'project'; project: Project } | { type: 'task'; task: Task; project: Project }> = [];
  projects.forEach((project) => {
    rows.push({ type: 'project', project });
    if (!collapsedProjects[project.id]) {
      const projectTasks = tasks.filter((t) => t.projectId === project.id);
      projectTasks.forEach((task) => {
        rows.push({ type: 'task', task, project });
      });
      // "Add task" placeholder row
    }
  });

  const svgHeight = rows.length * ROW_HEIGHT;

  // Build time header ticks
  const buildHeaderTicks = () => {
    if (zoom === 'week') {
      // Show each week label
      const weeks = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 });
      return weeks.map((weekStart) => {
        const x = differenceInDays(weekStart, rangeStart) * dayWidth;
        return {
          x,
          label: format(weekStart, 'MMM d'),
          width: 7 * dayWidth,
        };
      });
    } else if (zoom === 'month') {
      const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd });
      return months.map((monthStart) => {
        const x = differenceInDays(startOfMonth(monthStart), rangeStart) * dayWidth;
        const monthEnd = endOfMonth(monthStart);
        const daysInMonth = differenceInDays(monthEnd, startOfMonth(monthStart)) + 1;
        return {
          x,
          label: format(monthStart, 'MMM yyyy'),
          width: daysInMonth * dayWidth,
        };
      });
    } else {
      // Quarter: show quarters
      const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd });
      const quarters = months.filter((m) => m.getMonth() % 3 === 0);
      return quarters.map((qStart) => {
        const x = differenceInDays(startOfMonth(qStart), rangeStart) * dayWidth;
        const qMonth = qStart.getMonth();
        const q = Math.floor(qMonth / 3) + 1;
        return {
          x,
          label: `Q${q} ${qStart.getFullYear()}`,
          width: 90 * dayWidth,
        };
      });
    }
  };

  const headerTicks = buildHeaderTicks();

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      const scrollTo = Math.max(0, todayLeft - 200);
      scrollRef.current.scrollLeft = scrollTo;
      if (headerScrollRef.current) headerScrollRef.current.scrollLeft = scrollTo;
    }
  }, [todayLeft]);

  const toggleProject = (projectId: string) => {
    setCollapsedProjects((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  if (projects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm mt-1">Create a project to see the Gantt chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-4 flex-shrink-0 bg-gray-50">
        <span className="text-sm font-medium text-gray-600">Zoom:</span>
        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
          {(['week', 'month', 'quarter'] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-3 py-1 text-sm font-medium transition-colors capitalize ${
                zoom === z ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {ZOOM_CONFIG[z].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 ml-auto text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-3 rounded bg-blue-500 opacity-80" />
            <span>Task</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-500 rotate-45 rounded-sm" />
            <span>Milestone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-3 rounded bg-orange-400 opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.4) 2px, rgba(255,255,255,0.4) 4px)' }} />
            <span>Deliverable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-4 bg-red-500" />
            <span>Today</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - fixed */}
        <div className="flex-shrink-0 flex flex-col" style={{ width: LEFT_PANEL_WIDTH }}>
          {/* Left panel header */}
          <div
            className="flex-shrink-0 flex items-center px-4 border-b border-r border-gray-200 bg-gray-50 font-medium text-xs text-gray-500 uppercase tracking-wider"
            style={{ height: HEADER_HEIGHT }}
          >
            Task / Project
          </div>

          {/* Left panel rows */}
          <div className="flex-1 overflow-y-hidden border-r border-gray-200">
            {rows.map((row, idx) => {
              if (row.type === 'project') {
                const { project } = row;
                const isCollapsed = collapsedProjects[project.id];
                const projectTaskCount = tasks.filter((t) => t.projectId === project.id).length;
                return (
                  <div
                    key={`proj-${project.id}`}
                    className="flex items-center gap-2 px-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ height: ROW_HEIGHT }}
                    onClick={() => toggleProject(project.id)}
                  >
                    <span className="text-gray-400 text-xs w-3 flex-shrink-0" style={{ transform: isCollapsed ? '' : 'rotate(90deg)', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                    <span className="font-semibold text-sm text-gray-800 truncate flex-1">{project.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{projectTaskCount}</span>
                  </div>
                );
              } else {
                const { task, project } = row;
                const typeIcon = task.type === 'milestone' ? '◆' : task.type === 'deliverable' ? '★' : '▣';
                return (
                  <div
                    key={`task-${task.id}`}
                    className="flex items-center gap-2 pl-8 pr-3 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors"
                    style={{ height: ROW_HEIGHT }}
                    onClick={() => onEditTask(task)}
                  >
                    <span className="text-xs flex-shrink-0" style={{ color: project.color }}>{typeIcon}</span>
                    <span className="text-sm text-gray-700 truncate flex-1">{task.name}</span>
                    {task.type !== 'milestone' && (
                      <span className="text-xs text-gray-400 flex-shrink-0">{task.progress}%</span>
                    )}
                  </div>
                );
              }
            })}
          </div>
        </div>

        {/* Right panel - scrollable */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Timeline header */}
          <div
            ref={headerScrollRef}
            className="flex-shrink-0 overflow-x-hidden border-b border-gray-200 bg-gray-50"
            style={{ height: HEADER_HEIGHT }}
          >
            <div style={{ width: totalWidth, height: HEADER_HEIGHT, position: 'relative' }}>
              {/* Month/week labels */}
              {headerTicks.map((tick, i) => (
                <div
                  key={i}
                  className="absolute top-0 border-l border-gray-200 h-full flex items-center"
                  style={{ left: tick.x, width: tick.width }}
                >
                  <span className="px-2 text-xs font-semibold text-gray-600 sticky left-0">{tick.label}</span>
                </div>
              ))}
              {/* Sub-ticks for week view: show day labels */}
              {zoom === 'week' && Array.from({ length: totalDays }, (_, i) => {
                const d = addDays(rangeStart, i);
                const x = i * dayWidth;
                const dayNum = d.getDay();
                return (
                  <div
                    key={`day-${i}`}
                    className="absolute bottom-0 flex items-center justify-center"
                    style={{ left: x, width: dayWidth, height: 24 }}
                  >
                    <span className={`text-xs ${dayNum === 0 || dayNum === 6 ? 'text-gray-300' : 'text-gray-400'}`}>
                      {format(d, 'd')}
                    </span>
                  </div>
                );
              })}
              {/* Today line in header */}
              {todayLeft >= 0 && todayLeft <= totalWidth && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-400"
                  style={{ left: todayLeft }}
                />
              )}
            </div>
          </div>

          {/* Gantt chart body */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-auto"
            onScroll={handleBodyScroll}
          >
            <div style={{ width: totalWidth, minHeight: svgHeight }}>
              <svg width={totalWidth} height={Math.max(svgHeight, 200)}>
                {/* Grid background */}
                {/* Weekend columns */}
                {Array.from({ length: totalDays }, (_, i) => {
                  const d = addDays(rangeStart, i);
                  const dayOfWeek = d.getDay();
                  if (dayOfWeek === 0 || dayOfWeek === 6) {
                    return (
                      <rect
                        key={`weekend-${i}`}
                        x={i * dayWidth}
                        y={0}
                        width={dayWidth}
                        height={Math.max(svgHeight, 200)}
                        fill="#f9fafb"
                      />
                    );
                  }
                  return null;
                })}

                {/* Horizontal row lines */}
                {rows.map((_, idx) => (
                  <line
                    key={`hline-${idx}`}
                    x1={0}
                    y1={(idx + 1) * ROW_HEIGHT}
                    x2={totalWidth}
                    y2={(idx + 1) * ROW_HEIGHT}
                    stroke="#f1f5f9"
                    strokeWidth={1}
                  />
                ))}

                {/* Vertical month lines */}
                {headerTicks.map((tick, i) => (
                  <line
                    key={`vline-${i}`}
                    x1={tick.x}
                    y1={0}
                    x2={tick.x}
                    y2={Math.max(svgHeight, 200)}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />
                ))}

                {/* Task bars */}
                {rows.map((row, idx) => {
                  if (row.type !== 'task') return null;
                  const { task, project } = row;
                  const y = idx * ROW_HEIGHT;
                  return (
                    <g key={`bar-${task.id}`} transform={`translate(0, ${y})`}>
                      <TaskBar
                        task={task}
                        project={project}
                        rangeStart={rangeStart}
                        dayWidth={dayWidth}
                        rowHeight={ROW_HEIGHT}
                        onClick={() => onEditTask(task)}
                      />
                    </g>
                  );
                })}

                {/* Today line */}
                {todayLeft >= 0 && todayLeft <= totalWidth && (
                  <g>
                    <line
                      x1={todayLeft}
                      y1={0}
                      x2={todayLeft}
                      y2={Math.max(svgHeight, 200)}
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                    />
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
