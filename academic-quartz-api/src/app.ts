import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './features/auth/auth.routes';
import learningRoutes from './features/learning/learning.routes';
import periodRoutes from './features/period/period.routes';
import subjectRoutes from './features/subject/subject.routes';
import checklistTemplatesRoutes from './features/checklist-template/checklist-template.routes';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true, 
}));

app.use(express.json());

// Routes for authentication
app.use('/api/auth', authRoutes);
// Routes for expected learning
app.use('/api/learnings', learningRoutes);
// Routes for periods
app.use('/api/periods', periodRoutes);
// Routes for subjects
app.use('/api/subjects', subjectRoutes);
// Routes for checklist templates
app.use('/api/checklist-templates', checklistTemplatesRoutes);

// Conection to MongoDB
const { MONGODB_URI, API_USER, API_PASSWORD } = process.env;
if (!MONGODB_URI || !API_USER || !API_PASSWORD) {
  console.error('Faltan variables de entorno para la conexión a MongoDB (MONGODB_URI, API_USER o API_PASSWORD)');
  process.exit(1);
}

const mongoUri = MONGODB_URI.replace('<user>', encodeURIComponent(API_USER)).replace('<password>', encodeURIComponent(API_PASSWORD));

mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
