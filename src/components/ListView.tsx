import { useState } from 'react';
import { Project, Task, TaskStatus, TaskType } from '../types';
import { format, parseISO } from 'date-fns';

interface Props {
  projects: Project[];
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onAddTask: (projectId: string) => void;
  onEditProject: (project: Project) => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  'not-started': { label: 'Not Started', color: 'bg-gray-100 text-gray-600' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-700' },
};

const TYPE_CONFIG: Record<TaskType, { label: string; color: string; icon: string }> = {
  task: { label: 'Task', color: 'bg-slate-100 text-slate-600', icon: '▣' },
  milestone: { label: 'Milestone', color: 'bg-purple-100 text-purple-700', icon: '◆' },
  deliverable: { label: 'Deliverable', color: 'bg-amber-100 text-amber-700', icon: '⬡' },
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'MMM d');
  } catch {
    return dateStr;
  }
}

export default function ListView({ projects, tasks, onEditTask, onAddTask, onEditProject }: Props) {
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(
    Object.fromEntries(projects.map((p) => [p.id, true]))
  );
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all');

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const getProjectTasks = (projectId: string) => {
    return tasks
      .filter((t) => t.projectId === projectId)
      .filter((t) => filterStatus === 'all' || t.status === filterStatus)
      .filter((t) => filterType === 'all' || t.type === filterType);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <span className="text-sm font-medium text-gray-600">Filter:</span>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TaskType | 'all')}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400 ml-auto">
          {tasks.filter(
            (t) =>
              (filterStatus === 'all' || t.status === filterStatus) &&
              (filterType === 'all' || t.type === filterType)
          ).length}{' '}
          tasks shown
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {projects.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm mt-1">Create a project to get started</p>
          </div>
        )}

        {projects.map((project) => {
          const projectTasks = getProjectTasks(project.id);
          const allProjectTasks = tasks.filter((t) => t.projectId === project.id);
          const completedCount = allProjectTasks.filter((t) => t.status === 'completed').length;
          const isExpanded = expandedProjects[project.id] !== false;

          return (
            <div key={project.id} className="mb-6">
              {/* Project header */}
              <div
                className="flex items-center gap-3 mb-2 group cursor-pointer"
                onClick={() => toggleProject(project.id)}
              >
                <span
                  className="text-gray-400 text-xs transition-transform"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                  ▶
                </span>
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <h3 className="font-semibold text-gray-900 text-sm">{project.name}</h3>
                <span className="text-xs text-gray-400">
                  {completedCount}/{allProjectTasks.length} completed
                </span>
                <div className="w-20 h-1.5 bg-gray-200 rounded-full ml-1">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${allProjectTasks.length ? (completedCount / allProjectTasks.length) * 100 : 0}%`,
                      backgroundColor: project.color,
                    }}
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditProject(project);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-gray-600 transition-all ml-auto"
                >
                  Edit project
                </button>
              </div>

              {/* Tasks */}
              {isExpanded && (
                <div className="ml-6 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Dates</div>
                    <div className="col-span-1">Progress</div>
                    <div className="col-span-1">Assignee</div>
                  </div>

                  {projectTasks.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      No tasks match the current filters
                    </div>
                  )}

                  {projectTasks.map((task) => {
                    const statusCfg = STATUS_CONFIG[task.status];
                    const typeCfg = TYPE_CONFIG[task.type];
                    return (
                      <div
                        key={task.id}
                        onClick={() => onEditTask(task)}
                        className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors last:border-b-0"
                      >
                        {/* Name */}
                        <div className="col-span-4 flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {task.name}
                          </span>
                        </div>

                        {/* Type */}
                        <div className="col-span-2 flex items-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeCfg.color}`}
                          >
                            <span>{typeCfg.icon}</span>
                            {typeCfg.label}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="col-span-2 flex items-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>
                        </div>

                        {/* Dates */}
                        <div className="col-span-2 flex items-center">
                          <span className="text-xs text-gray-500">
                            {task.type === 'milestone'
                              ? formatDate(task.startDate)
                              : `${formatDate(task.startDate)} – ${formatDate(task.endDate)}`}
                          </span>
                        </div>

                        {/* Progress */}
                        <div className="col-span-1 flex items-center">
                          {task.type !== 'milestone' ? (
                            <div className="flex items-center gap-1 w-full">
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${task.progress}%`,
                                    backgroundColor: project.color,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {task.progress}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>

                        {/* Assignee */}
                        <div className="col-span-1 flex items-center">
                          {task.assignee ? (
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: project.color }}
                              title={task.assignee}
                            >
                              {getInitials(task.assignee)}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add task row */}
                  <button
                    onClick={() => onAddTask(project.id)}
                    className="w-full px-4 py-2.5 text-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors text-left flex items-center gap-2"
                  >
                    <span>+</span>
                    <span>Add task</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
