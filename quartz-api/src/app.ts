import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './features/auth/auth.routes';
import learningRoutes from './features/learning/learning.routes';
import periodRoutes from './features/period/period.routes';
import subjectRoutes from './features/subject/subject.routes';
import checklistTemplatesRoutes from './features/checklist-template/checklist-template.routes';
import studentValuationRoutes from './features/student-valuation/student-valuation.routes';
import usersRoutes from './features/users/users.routes';
import schoolRoutes from './features/school/school.routes';
import conceptRoutes from './features/concept/concept.routes';
import reportRoutes from './features/report/report.routes';
import institutionRoutes from './features/institution/institution.routes';
import dashboardRoutes from './features/dashboard/dashboard.routes';
import { errorHandler } from './middlewares/error.middleware';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
const app = express();
app.use(cors({
  origin: process.env.WEB_ORIGIN, // Frontend URL
  credentials: true,
}));
app.use(express.json());
// Root router: the api.quartzedu.co subdomain already identifies the API, so no '/api' prefix
const router = express.Router();
// Health check for the host (public, no tenant data)
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
// Routes for authentication
router.use('/auth', authRoutes);
// Routes for expected learning
router.use('/learnings', learningRoutes);
// Routes for periods
router.use('/periods', periodRoutes);
// Routes for subjects
router.use('/subjects', subjectRoutes);
// Routes for checklist templates
router.use('/checklist-templates', checklistTemplatesRoutes);
// Routes for student valuations
router.use('/student-valuations', studentValuationRoutes);
// Routes for users (students listing by institution)
router.use('/users', usersRoutes);
// Routes for schools
router.use('/schools', schoolRoutes);
// Routes for concepts
router.use('/concepts', conceptRoutes);
// Routes for reports (dynamic PDFs, never persisted)
router.use('/reports', reportRoutes);
// Routes for institution settings (periods per year, enabled reports)
router.use('/institutions', institutionRoutes);
// Routes for the analytics dashboard (read-only, in-memory cached)
router.use('/dashboard', dashboardRoutes);

app.use('/', router);

app.use(errorHandler);

// Conection to MongoDB
const { MONGODB_URI, API_USER, API_PASSWORD } = process.env;
if (!MONGODB_URI || !API_USER || !API_PASSWORD) {
  console.error('Faltan variables de entorno para la conexión a MongoDB (MONGODB_URI, API_USER o API_PASSWORD)');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('Falta la variable de entorno JWT_SECRET');
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
    process.exit(1);
  });
