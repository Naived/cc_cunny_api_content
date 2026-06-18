import { Hono } from 'hono';
import {
  getCategories,
  getCourses,
  getCourseLessons
} from '../controllers/courseController.js';

const router = new Hono();

router.get('/categories', getCategories);
router.get('/courses', getCourses);
router.get('/courses/:slug/lessons', getCourseLessons);

export default router;
