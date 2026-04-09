import express from 'express';
import { deployService } from '../services/deploy';

const router = express.Router();

export const deployRouter = router;

router.post('/deploy', async (req, res) => {
  try {
    const { projectId, projectConfig } = req.body;
    const result = await deployService.deploy(projectId, projectConfig);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/upload-dist', async (req, res) => {
  try {
    const { projectId, projectConfig } = req.body;
    const result = await deployService.uploadDist(projectId, projectConfig);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/history/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const history = await deployService.getDeployHistory(projectId);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});