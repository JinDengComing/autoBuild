import { create } from 'zustand';
import Store from 'electron-store';

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
  addProject: (project: Project) => void;
  selectProject: (project: Project) => void;
  updateStatus: (status: string) => void;
  addLog: (log: string) => void;
  clearLogs: () => void;
}

// 初始化 electron-store
const electronStore = new Store({
  name: 'auto-build',
  defaults: {
    projects: [],
    deployHistory: [],
  },
});

// 创建 Zustand store
export const useAppStore = create<AppState>((set) => ({
  projects: electronStore.get('projects', []),
  selectedProject: null,
  status: '就绪',
  logs: [],
  addProject: (project) => {
    const projects = [...electronStore.get('projects', []), project];
    electronStore.set('projects', projects);
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
}));

// 保存部署历史
export const saveDeployHistory = (history: DeployHistory) => {
  const deployHistory = [...electronStore.get('deployHistory', []), history];
  electronStore.set('deployHistory', deployHistory);
};

// 获取部署历史
export const getDeployHistory = (projectId: string) => {
  const deployHistory = electronStore.get('deployHistory', []);
  return deployHistory.filter((item: DeployHistory) => item.projectId === projectId);
};