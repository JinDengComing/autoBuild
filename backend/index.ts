import express from 'express';
import cors from 'cors';
import { deployRouter } from './routes/deploy';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/deploy', deployRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});