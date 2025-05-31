// learningMaterialsRoutes.js
const {
  getAllLearningMaterials,
  getLearningMaterialById,
  createLearningMaterial,
  updateLearningMaterial,
  deleteLearningMaterial,
} = require('../controllers/learningMaterialsController');

const learningMaterialsRoutes = [
  { method: 'GET', path: '/learning-materials', handler: getAllLearningMaterials },
  { method: 'GET', path: '/learning-materials/{id}', handler: getLearningMaterialById },
  // Disable these three routes below in production as per your note
  { method: 'POST', path: '/learning-materials', handler: createLearningMaterial },
  { method: 'PUT', path: '/learning-materials/{id}', handler: updateLearningMaterial },
  { method: 'DELETE', path: '/learning-materials/{id}', handler: deleteLearningMaterial },
];

module.exports = learningMaterialsRoutes;
  