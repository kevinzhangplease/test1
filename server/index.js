import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// In-memory data store
const now = new Date();
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};

const today = now.toISOString().split('T')[0];

let projects = [
  {
    id: 'proj-1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website with modern design and improved UX',
    color: '#3b82f6',
    startDate: addDays(now, -10),
    endDate: addDays(now, 60),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj-2',
    name: 'Mobile App Launch',
    description: 'Develop and launch the iOS and Android mobile application',
    color: '#10b981',
    startDate: addDays(now, 5),
    endDate: addDays(now, 90),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let tasks = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    name: 'Discovery & Research',
    description: 'User research, competitor analysis, and requirements gathering',
    type: 'task',
    startDate: addDays(now, -10),
    endDate: addDays(now, 5),
    progress: 85,
    assignee: 'Alice Johnson',
    status: 'in-progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    projectId: 'proj-1',
    name: 'Design System Setup',
    description: 'Establish design tokens, component library, and style guide',
    type: 'task',
    startDate: addDays(now, -5),
    endDate: addDays(now, 15),
    progress: 60,
    assignee: 'Bob Smith',
    status: 'in-progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    projectId: 'proj-1',
    name: 'Design Review Sign-off',
    description: 'Stakeholder approval of final designs',
    type: 'milestone',
    startDate: addDays(now, 16),
    endDate: addDays(now, 16),
    progress: 0,
    assignee: 'Alice Johnson',
    status: 'not-started',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    projectId: 'proj-1',
    name: 'Frontend Development',
    description: 'Implement all pages and components based on approved designs',
    type: 'task',
    startDate: addDays(now, 17),
    endDate: addDays(now, 45),
    progress: 0,
    assignee: 'Carol White',
    status: 'not-started',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-5',
    projectId: 'proj-1',
    name: 'Website v1.0 Launch',
    description: 'Public launch of the redesigned website',
    type: 'deliverable',
    startDate: addDays(now, 58),
    endDate: addDays(now, 60),
    progress: 0,
    assignee: 'Bob Smith',
    status: 'not-started',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-6',
    projectId: 'proj-2',
    name: 'Technical Architecture',
    description: 'Define tech stack, API design, and database schema',
    type: 'task',
    startDate: addDays(now, 5),
    endDate: addDays(now, 18),
    progress: 0,
    assignee: 'David Lee',
    status: 'not-started',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-7',
    projectId: 'proj-2',
    name: 'MVP Feature Development',
    description: 'Build core features: auth, dashboard, notifications',
    type: 'task',
    startDate: addDays(now, 19),
    endDate: addDays(now, 55),
    progress: 0,
    assignee: 'Eve Martinez',
    status: 'not-started',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-8',
    projectId: 'proj-2',
    name: 'Beta Release',
    description: 'Release to beta testers and gather feedback',
    type: 'milestone',
    startDate: addDays(now, 56),
    endDate: addDays(now, 56),
    progress: 0,
    assignee: 'David Lee',
    status: 'not-started',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-9',
    projectId: 'proj-2',
    name: 'QA & Bug Fixing',
    description: 'Comprehensive testing and bug resolution before launch',
    type: 'task',
    startDate: addDays(now, 57),
    endDate: addDays(now, 75),
    progress: 0,
    assignee: 'Frank Wilson',
    status: 'not-started',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-10',
    projectId: 'proj-2',
    name: 'App Store Release',
    description: 'Submit and publish to iOS App Store and Google Play',
    type: 'deliverable',
    startDate: addDays(now, 88),
    endDate: addDays(now, 90),
    progress: 0,
    assignee: 'Eve Martinez',
    status: 'not-started',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let connectedUsers = 0;

io.on('connection', (socket) => {
  connectedUsers++;
  io.emit('users-count', connectedUsers);
  console.log(`Client connected. Total users: ${connectedUsers}`);

  // Send initial data
  socket.on('get-data', () => {
    socket.emit('data', { projects, tasks });
  });

  // Project events
  socket.on('create-project', (projectData) => {
    const project = {
      ...projectData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects.push(project);
    io.emit('project-created', project);
  });

  socket.on('update-project', (projectData) => {
    const index = projects.findIndex((p) => p.id === projectData.id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...projectData, updatedAt: new Date().toISOString() };
      io.emit('project-updated', projects[index]);
    }
  });

  socket.on('delete-project', (projectId) => {
    projects = projects.filter((p) => p.id !== projectId);
    tasks = tasks.filter((t) => t.projectId !== projectId);
    io.emit('project-deleted', projectId);
  });

  // Task events
  socket.on('create-task', (taskData) => {
    const task = {
      ...taskData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.push(task);
    io.emit('task-created', task);
  });

  socket.on('update-task', (taskData) => {
    const index = tasks.findIndex((t) => t.id === taskData.id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...taskData, updatedAt: new Date().toISOString() };
      io.emit('task-updated', tasks[index]);
    }
  });

  socket.on('delete-task', (taskId) => {
    tasks = tasks.filter((t) => t.id !== taskId);
    io.emit('task-deleted', taskId);
  });

  socket.on('disconnect', () => {
    connectedUsers--;
    io.emit('users-count', connectedUsers);
    console.log(`Client disconnected. Total users: ${connectedUsers}`);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
