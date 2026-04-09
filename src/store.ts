import { create } from 'zustand';

// 条件导入 ipcRenderer，仅在 Electron 环境中使用
let ipcRenderer: any;
try {
  ipcRenderer = require('electron').ipcRenderer;
} catch (e) {
  // 在浏览器环境中，使用 localStorage 实现
  ipcRenderer = {
    invoke: async (channel: string, ...args: any[]) => {
      console.log(`Browser IPC call: ${channel}`, args);
      // 使用 localStorage 存储数据
      if (channel === 'get-projects') {
        const projects = localStorage.getItem('projects');
        return projects ? JSON.parse(projects) : [];
      }
      if (channel === 'add-project') {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        projects.push(args[0]);
        localStorage.setItem('projects', JSON.stringify(projects));
        return projects;
      }
      if (channel === 'save-deploy-history') {
        const deployHistory = JSON.parse(localStorage.getItem('deployHistory') || '[]');
        deployHistory.push(args[0]);
        localStorage.setItem('deployHistory', JSON.stringify(deployHistory));
        return deployHistory;
      }
      if (channel === 'get-deploy-history') {
        const deployHistory = JSON.parse(localStorage.getItem('deployHistory') || '[]');
        return deployHistory.filter((item: any) => item.projectId === args[0]);
      }
      return null;
    }
  };
}

interface Project {
  id: string;
  name: string;
  path: string;
  description: string;
  sshConfig: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
  dockerConfig: {
    imageName: string;
    tag: string;
  };
  deployConfig: {
    scriptPath: string;
  };
}

interface DeployHistory {
  id: string;
  projectId: string;
  timestamp: number;
  status: 'success' | 'failed';
  message: string;
}

interface AppState {
  projects: Project[];
  selectedProject: Project | null;
  status: string;
  logs: string[];
  addProject: (project: Project) => Promise<void>;
  selectProject: (project: Project) => void;
  updateStatus: (status: string) => void;
  addLog: (log: string) => void;
  clearLogs: () => void;
  loadProjects: () => Promise<void>;
}

// 创建 Zustand store
export const useAppStore = create<AppState>((set) => ({
  projects: [],
  selectedProject: null,
  status: '就绪',
  logs: [],
  addProject: async (project) => {
    const projects = await ipcRenderer.invoke('add-project', project);
    set({ projects });
  },
  selectProject: (project) => {
    set({ selectedProject: project });
  },
  updateStatus: (status) => {
    set({ status });
  },
  addLog: (log) => {
    set((state) => ({
      logs: [...state.logs, log],
    }));
  },
  clearLogs: () => {
    set({ logs: [] });
  },
  loadProjects: async () => {
    const projects = await ipcRenderer.invoke('get-projects');
    set({ projects });
  },
}));

// 保存部署历史
export const saveDeployHistory = async (history: DeployHistory) => {
  await ipcRenderer.invoke('save-deploy-history', history);
};

// 获取部署历史
export const getDeployHistory = async (projectId: string) => {
  return await ipcRenderer.invoke('get-deploy-history', projectId);
};