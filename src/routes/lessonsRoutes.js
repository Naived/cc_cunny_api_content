import { Hono } from 'hono';
import {
  getAllLessons,
  getLessonBySlug,
  createLesson,
  updateLesson,
  deleteLesson,
} from '../controllers/lessonsController.js';

const router = new Hono();

router.get('/lessons', getAllLessons);
router.get('/lessons/:slug', getLessonBySlug);
router.post('/lessons', createLesson);
router.put('/lessons/:slug', updateLesson);
router.delete('/lessons/:slug', deleteLesson);

export default router;
