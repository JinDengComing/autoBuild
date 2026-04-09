import React from 'react';
import { Layout, Menu, Button, Modal, Form, Input, Card, Badge, Typography, Divider } from 'antd';
import { PlusOutlined, SettingOutlined, UploadOutlined, HistoryOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useAppStore, saveDeployHistory, getDeployHistory } from './store';
import './App.css';

const { Sider, Content, Footer } = Layout;
const { Title, Text } = Typography;

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

const App: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [form] = Form.useForm();
  const { projects, selectedProject, status, logs, addProject, selectProject, updateStatus, addLog } = useAppStore();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      const newProject: Project = {
        id: Date.now().toString(),
        name: values.name,
        path: values.path,
        description: values.description,
        sshConfig: {
          host: values.sshHost,
          port: values.sshPort,
          username: values.sshUsername,
          password: values.sshPassword,
        },
        dockerConfig: {
          imageName: values.dockerImageName,
          tag: values.dockerTag,
        },
        deployConfig: {
          scriptPath: values.deployScriptPath,
        },
      };
      addProject(newProject);
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleProjectSelect = (project: Project) => {
    selectProject(project);
  };

  const handleDeploy = () => {
    updateStatus('部署中');
    addLog('开始部署...');
    // 模拟部署过程
    setTimeout(() => {
      updateStatus('部署成功');
      addLog('部署成功！');
      // 保存部署历史
      saveDeployHistory({
        id: Date.now().toString(),
        projectId: selectedProject?.id || '',
        timestamp: Date.now(),
        status: 'success',
        message: '部署成功',
      });
    }, 2000);
  };

  const handleUploadDist = () => {
    updateStatus('上传中');
    addLog('开始上传 dist 包...');
    // 模拟上传过程
    setTimeout(() => {
      updateStatus('上传成功');
      addLog('上传成功！');
      // 保存部署历史
      saveDeployHistory({
        id: Date.now().toString(),
        projectId: selectedProject?.id || '',
        timestamp: Date.now(),
        status: 'success',
        message: '上传 dist 包成功',
      });
    }, 1500);
  };

  const handleViewHistory = () => {
    addLog('查看部署历史...');
    // 获取部署历史
    if (selectedProject) {
      const history = getDeployHistory(selectedProject.id) as Array<{
        id: string;
        projectId: string;
        timestamp: number;
        status: 'success' | 'failed';
        message: string;
      }>;
      history.forEach(item => {
        addLog(`${new Date(item.timestamp).toLocaleString()} - ${item.status === 'success' ? '成功' : '失败'}: ${item.message}`);
      });
    }
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={256} style={{ backgroundColor: '#001529' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          Auto Build
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[]}
          style={{ height: '100%', borderRight: 0 }}
        >
          <Menu.Item key="add" icon={<PlusOutlined />} onClick={showModal}>
            新增项目
          </Menu.Item>
          <Menu.SubMenu key="projects" title="项目列表">
            {projects.map(project => (
              <Menu.Item key={project.id} onClick={() => handleProjectSelect(project)}>
                {project.name}
              </Menu.Item>
            ))}
          </Menu.SubMenu>
          <Menu.Item key="settings" icon={<SettingOutlined />}>
            设置
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout style={{ display: 'flex', flexDirection: 'column' }}>
        <Content style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          {selectedProject ? (
            <Card title={selectedProject.name} style={{ width: '100%' }}>
              <p><Text strong>项目路径：</Text>{selectedProject.path}</p>
              <p><Text strong>项目描述：</Text>{selectedProject.description}</p>
              <Divider orientation="left">SSH 服务器配置</Divider>
              <p><Text strong>主机：</Text>{selectedProject.sshConfig.host}</p>
              <p><Text strong>端口：</Text>{selectedProject.sshConfig.port}</p>
              <p><Text strong>用户名：</Text>{selectedProject.sshConfig.username}</p>
              <p><Text strong>密码：</Text>****</p>
              <Divider orientation="left">Docker 镜像配置</Divider>
              <p><Text strong>镜像名称：</Text>{selectedProject.dockerConfig.imageName}</p>
              <p><Text strong>标签：</Text>{selectedProject.dockerConfig.tag}</p>
              <Divider orientation="left">部署配置</Divider>
              <p><Text strong>脚本路径：</Text>{selectedProject.deployConfig.scriptPath}</p>
              <Divider />
              <div style={{ display: 'flex', gap: 12 }}>
                <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleDeploy}>
                  一键部署
                </Button>
                <Button icon={<UploadOutlined />} onClick={handleUploadDist}>
                  仅上传 dist 包
                </Button>
                <Button icon={<HistoryOutlined />} onClick={handleViewHistory}>
                  查看历史部署记录
                </Button>
              </div>
            </Card>
          ) : (
            <div style={{ textAlign: 'center', marginTop: 100 }}>
              <Title level={4}>请选择一个项目或新增项目</Title>
            </div>
          )}
        </Content>
        <Footer style={{ backgroundColor: '#f0f2f5', padding: '12px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Badge status={status === '就绪' ? 'success' : status === '部署中' || status === '上传中' ? 'processing' : 'error'} text={status} />
            </div>
            <div style={{ width: '60%', height: 100, border: '1px solid #e8e8e8', borderRadius: 4, padding: 8, overflow: 'auto', backgroundColor: '#fafafa' }}>
              {logs.map((log, index) => (
                <div key={index} style={{ fontSize: 12, marginBottom: 4 }}>{log}</div>
              ))}
            </div>
          </div>
        </Footer>
      </Layout>
      <Modal
        title="新增项目"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="path" label="项目路径" rules={[{ required: true, message: '请输入项目路径' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea />
          </Form.Item>
          <Form.Item label="SSH 服务器配置">
            <Form.Item name="sshHost" label="主机" rules={[{ required: true, message: '请输入主机地址' }]} noStyle>
              <Input />
            </Form.Item>
            <Form.Item name="sshPort" label="端口" rules={[{ required: true, message: '请输入端口' }]} noStyle>
              <Input type="number" defaultValue={22} />
            </Form.Item>
            <Form.Item name="sshUsername" label="用户名" rules={[{ required: true, message: '请输入用户名' }]} noStyle>
              <Input />
            </Form.Item>
            <Form.Item name="sshPassword" label="密码" rules={[{ required: true, message: '请输入密码' }]} noStyle>
              <Input.Password />
            </Form.Item>
          </Form.Item>
          <Form.Item label="Docker 镜像配置">
            <Form.Item name="dockerImageName" label="镜像名称" rules={[{ required: true, message: '请输入镜像名称' }]} noStyle>
              <Input />
            </Form.Item>
            <Form.Item name="dockerTag" label="标签" rules={[{ required: true, message: '请输入标签' }]} noStyle>
              <Input defaultValue="latest" />
            </Form.Item>
          </Form.Item>
          <Form.Item name="deployScriptPath" label="部署脚本路径" rules={[{ required: true, message: '请输入部署脚本路径' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default App;