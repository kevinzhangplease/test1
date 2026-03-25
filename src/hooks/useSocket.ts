import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Project,
  Task,
  CreateProjectPayload,
  UpdateProjectPayload,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '../types';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function useSocket() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const sock = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      sock.emit('get-data');
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onData = (data: { projects: Project[]; tasks: Task[] }) => {
      setProjects(data.projects);
      setTasks(data.tasks);
    };

    const onUsersCount = (count: number) => {
      setConnectedUsers(count);
    };

    // Project events
    const onProjectCreated = (project: Project) => {
      setProjects((prev) => [...prev, project]);
    };

    const onProjectUpdated = (project: Project) => {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    };

    const onProjectDeleted = (projectId: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setTasks((prev) => prev.filter((t) => t.projectId !== projectId));
    };

    // Task events
    const onTaskCreated = (task: Task) => {
      setTasks((prev) => [...prev, task]);
    };

    const onTaskUpdated = (task: Task) => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    };

    const onTaskDeleted = (taskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    };

    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);
    sock.on('data', onData);
    sock.on('users-count', onUsersCount);
    sock.on('project-created', onProjectCreated);
    sock.on('project-updated', onProjectUpdated);
    sock.on('project-deleted', onProjectDeleted);
    sock.on('task-created', onTaskCreated);
    sock.on('task-updated', onTaskUpdated);
    sock.on('task-deleted', onTaskDeleted);

    if (sock.connected) {
      onConnect();
    }

    return () => {
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
      sock.off('data', onData);
      sock.off('users-count', onUsersCount);
      sock.off('project-created', onProjectCreated);
      sock.off('project-updated', onProjectUpdated);
      sock.off('project-deleted', onProjectDeleted);
      sock.off('task-created', onTaskCreated);
      sock.off('task-updated', onTaskUpdated);
      sock.off('task-deleted', onTaskDeleted);
    };
  }, []);

  const createProject = useCallback((payload: CreateProjectPayload) => {
    getSocket().emit('create-project', payload);
  }, []);

  const updateProject = useCallback((payload: UpdateProjectPayload) => {
    getSocket().emit('update-project', payload);
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    getSocket().emit('delete-project', projectId);
  }, []);

  const createTask = useCallback((payload: CreateTaskPayload) => {
    getSocket().emit('create-task', payload);
  }, []);

  const updateTask = useCallback((payload: UpdateTaskPayload) => {
    getSocket().emit('update-task', payload);
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    getSocket().emit('delete-task', taskId);
  }, []);

  return {
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
  };
}
