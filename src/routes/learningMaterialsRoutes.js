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
    // Disable this three routes bellow if you're in production !
    { method: 'POST', path: '/learning-materials', handler: createLearningMaterial },
    { method: 'PUT', path: '/learning-materials/{id}', handler: updateLearningMaterial },
    { method: 'DELETE', path: '/learning-materials/{id}', handler: deleteLearningMaterial },
  ];
  
  module.exports = learningMaterialsRoutes;
  