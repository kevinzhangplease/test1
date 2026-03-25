import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { ViewType, Project, Task } from './types';
import ListView from './components/ListView';
import CalendarView from './components/CalendarView';
import GanttView from './components/GanttView';
import ProjectModal from './components/ProjectModal';
import TaskModal from './components/TaskModal';

export default function App() {
  const {
    projects,
    tasks,
    connectedUsers,
    isConnected,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
  } = useSocket();

  const [activeView, setActiveView] = useState<ViewType>('gantt');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const filteredTasks = selectedProjectId
    ? tasks.filter((t) => t.projectId === selectedProjectId)
    : tasks;

  const openNewProject = () => {
    setEditingProject(null);
    setProjectModalOpen(true);
  };

  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectModalOpen(true);
  };

  const openNewTask = (projectId?: string) => {
    setEditingTask(null);
    setDefaultProjectId(projectId || null);
    setTaskModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setDefaultProjectId(null);
    setTaskModalOpen(true);
  };

  const views: { id: ViewType; label: string; icon: string }[] = [
    { id: 'list', label: 'List', icon: '☰' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'gantt', label: 'Gantt', icon: '📊' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-[#1e293b] text-white transition-all duration-300 ${
          sidebarCollapsed ? 'w-14' : 'w-64'
        } flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold">
                P
              </div>
              <span className="font-bold text-lg tracking-tight">ProjectFlow</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 border-b border-slate-700">
          {!sidebarCollapsed && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
              Views
            </p>
          )}
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                activeView === view.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title={sidebarCollapsed ? view.label : undefined}
            >
              <span className="text-base">{view.icon}</span>
              {!sidebarCollapsed && <span>{view.label}</span>}
            </button>
          ))}
        </nav>

        {/* Projects list */}
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between mb-2 px-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Projects
              </p>
              <button
                onClick={openNewProject}
                className="text-slate-400 hover:text-white transition-colors text-lg leading-none"
                title="New Project"
              >
                +
              </button>
            </div>
          )}

          {/* All projects option */}
          <button
            onClick={() => setSelectedProjectId(null)}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors mb-1 ${
              selectedProjectId === null
                ? 'bg-slate-600 text-white'
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
            title={sidebarCollapsed ? 'All Projects' : undefined}
          >
            <span className="w-3 h-3 rounded-full bg-slate-400 flex-shrink-0" />
            {!sidebarCollapsed && <span>All Projects</span>}
          </button>

          {projects.map((project) => (
            <div key={project.id} className="group relative mb-1">
              <button
                onClick={() =>
                  setSelectedProjectId(selectedProjectId === project.id ? null : project.id)
                }
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
                  selectedProjectId === project.id
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title={sidebarCollapsed ? project.name : undefined}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                {!sidebarCollapsed && (
                  <span className="truncate flex-1 text-left">{project.name}</span>
                )}
              </button>
              {!sidebarCollapsed && (
                <button
                  onClick={() => openEditProject(project)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-all text-xs"
                >
                  ✎
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Connection status */}
        <div className="px-4 py-3 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            {!sidebarCollapsed && (
              <span className="text-xs text-slate-400">
                {isConnected ? `${connectedUsers} online` : 'Disconnected'}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {selectedProjectId
                ? projects.find((p) => p.id === selectedProjectId)?.name || 'Projects'
                : 'All Projects'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredTasks.length} tasks across {selectedProjectId ? 1 : projects.length} project
              {projects.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Users indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-green-500 text-sm">●</span>
              <span className="text-sm text-gray-600 font-medium">{connectedUsers} online</span>
            </div>

            {/* View switcher */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeView === view.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>

            {/* New task button */}
            <button
              onClick={() => openNewTask(selectedProjectId || undefined)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + New Task
            </button>

            {/* New project button */}
            <button
              onClick={openNewProject}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              + New Project
            </button>
          </div>
        </header>

        {/* View content */}
        <main className="flex-1 overflow-hidden">
          {activeView === 'list' && (
            <ListView
              projects={selectedProjectId ? projects.filter((p) => p.id === selectedProjectId) : projects}
              tasks={filteredTasks}
              onEditTask={openEditTask}
              onAddTask={openNewTask}
              onEditProject={openEditProject}
            />
          )}
          {activeView === 'calendar' && (
            <CalendarView
              projects={projects}
              tasks={filteredTasks}
              onEditTask={openEditTask}
            />
          )}
          {activeView === 'gantt' && (
            <GanttView
              projects={selectedProjectId ? projects.filter((p) => p.id === selectedProjectId) : projects}
              tasks={filteredTasks}
              onEditTask={openEditTask}
              onAddTask={openNewTask}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {projectModalOpen && (
        <ProjectModal
          project={editingProject}
          onClose={() => setProjectModalOpen(false)}
          onCreate={createProject}
          onUpdate={updateProject}
          onDelete={deleteProject}
        />
      )}
      {taskModalOpen && (
        <TaskModal
          task={editingTask}
          projects={projects}
          defaultProjectId={defaultProjectId}
          onClose={() => setTaskModalOpen(false)}
          onCreate={createTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}
