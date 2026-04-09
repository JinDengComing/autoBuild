import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ProjectConfig {
  path: string;
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

class DeployService {
  private historyPath = path.join(__dirname, '../../deploy-history.json');

  private loadHistory(): DeployHistory[] {
    if (!fs.existsSync(this.historyPath)) {
      return [];
    }
    const content = fs.readFileSync(this.historyPath, 'utf8');
    return JSON.parse(content);
  }

  private saveHistory(history: DeployHistory[]) {
    fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2));
  }

  private addHistory(projectId: string, status: 'success' | 'failed', message: string) {
    const history = this.loadHistory();
    const newHistory: DeployHistory = {
      id: Date.now().toString(),
      projectId,
      timestamp: Date.now(),
      status,
      message,
    };
    history.push(newHistory);
    this.saveHistory(history);
  }

  async deploy(projectId: string, projectConfig: ProjectConfig): Promise<string> {
    try {
      // 1. 构建项目
      console.log('开始构建项目...');
      execSync('npm run build', { cwd: projectConfig.path, stdio: 'inherit' });

      // 2. 上传 dist 包
      console.log('开始上传 dist 包...');
      const distPath = path.join(projectConfig.path, 'dist');
      const sshCommand = `scp -r -P ${projectConfig.sshConfig.port} ${distPath} ${projectConfig.sshConfig.username}@${projectConfig.sshConfig.host}:/tmp`;
      execSync(sshCommand, { stdio: 'inherit' });

      // 3. 构建 Docker 镜像
      console.log('开始构建 Docker 镜像...');
      const dockerCommand = `ssh -p ${projectConfig.sshConfig.port} ${projectConfig.sshConfig.username}@${projectConfig.sshConfig.host} "docker build -t ${projectConfig.dockerConfig.imageName}:${projectConfig.dockerConfig.tag} /tmp/dist"`;
      execSync(dockerCommand, { stdio: 'inherit' });

      // 4. 推送 Docker 镜像到阿里云仓库
      console.log('开始推送 Docker 镜像...');
      const pushCommand = `ssh -p ${projectConfig.sshConfig.port} ${projectConfig.sshConfig.username}@${projectConfig.sshConfig.host} "docker push ${projectConfig.dockerConfig.imageName}:${projectConfig.dockerConfig.tag}"`;
      execSync(pushCommand, { stdio: 'inherit' });

      // 5. 执行部署脚本
      console.log('开始执行部署脚本...');
      const deployCommand = `ssh -p ${projectConfig.sshConfig.port} ${projectConfig.sshConfig.username}@${projectConfig.sshConfig.host} "${projectConfig.deployConfig.scriptPath}"`;
      execSync(deployCommand, { stdio: 'inherit' });

      const message = '部署成功';
      this.addHistory(projectId, 'success', message);
      return message;
    } catch (error) {
      const message = `部署失败: ${(error as Error).message}`;
      this.addHistory(projectId, 'failed', message);
      throw new Error(message);
    }
  }

  async uploadDist(projectId: string, projectConfig: ProjectConfig): Promise<string> {
    try {
      // 1. 构建项目
      console.log('开始构建项目...');
      execSync('npm run build', { cwd: projectConfig.path, stdio: 'inherit' });

      // 2. 上传 dist 包
      console.log('开始上传 dist 包...');
      const distPath = path.join(projectConfig.path, 'dist');
      const sshCommand = `scp -r -P ${projectConfig.sshConfig.port} ${distPath} ${projectConfig.sshConfig.username}@${projectConfig.sshConfig.host}:/tmp`;
      execSync(sshCommand, { stdio: 'inherit' });

      const message = '上传 dist 包成功';
      this.addHistory(projectId, 'success', message);
      return message;
    } catch (error) {
      const message = `上传 dist 包失败: ${(error as Error).message}`;
      this.addHistory(projectId, 'failed', message);
      throw new Error(message);
    }
  }

  async getDeployHistory(projectId: string): Promise<DeployHistory[]> {
    const history = this.loadHistory();
    return history.filter(item => item.projectId === projectId);
  }
}

export const deployService = new DeployService();