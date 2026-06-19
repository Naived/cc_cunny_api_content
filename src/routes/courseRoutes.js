import { Hono } from 'hono';
import {
  getCategories,
  getCourses,
  getCategoryCourses,
  getCourseJourney,
  getCourseLessons
} from '../controllers/courseController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = new Hono();

router.get('/categories', getCategories);
router.get('/courses', getCourses);
router.get('/categories/:slug/courses', getCategoryCourses);
router.get('/courses/:slug/journey', optionalAuth, getCourseJourney);
router.get('/courses/:slug/lessons', getCourseLessons);

export default router;
