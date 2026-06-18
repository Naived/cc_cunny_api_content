// learningMaterialsRoutes.js
import { Hono } from 'hono';
import {
  getAllLearningMaterials,
  getLearningMaterialById,
  createLearningMaterial,
  updateLearningMaterial,
  deleteLearningMaterial,
} from '../controllers/learningMaterialsController.js';

const router = new Hono();

router.get('/learning-materials', getAllLearningMaterials);
router.get('/learning-materials/:id', getLearningMaterialById);

// Disable these three routes below in production as per your note
router.post('/learning-materials', createLearningMaterial);
router.put('/learning-materials/:id', updateLearningMaterial);
router.delete('/learning-materials/:id', deleteLearningMaterial);

export default router;