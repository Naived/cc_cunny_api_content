// learningMaterialsController.js
const pool = require('../config/database');
const isPostgres = process.env.DB_TYPE === 'postgres';

// Normalize sub-materials & body format
function normalizeMaterialFormat(material) {
  return {
    ...material,
    sub_materials: Array.isArray(material.sub_materials)
      ? material.sub_materials.map(item =>
          Array.isArray(item) ? { topic: item[0] } :
          typeof item === 'string' ? { topic: item } :
          item
        )
      : [],
    sub_body_materials: Array.isArray(material.sub_body_materials)
      ? material.sub_body_materials.map(item =>
          Array.isArray(item) ? { body: item[0] } :
          typeof item === 'string' ? { body: item } :
          item
        )
      : [],
  };
}

// Safe JSON parse helper
function tryParseJSON(value, fallback = []) {
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

// Parse material record
function parseMaterial(row) {
  const parsed = isPostgres ? row : {
    ...row,
    sub_materials: tryParseJSON(row.sub_materials),
    sub_body_materials: tryParseJSON(row.sub_body_materials),
  };
  return normalizeMaterialFormat(parsed);
}

// GET All
const getAllLearningMaterials = async (req, h) => {
  try {
    const query = 'SELECT * FROM learning_materials';
    const result = await pool.query(query);
    const rows = isPostgres ? result?.rows : (Array.isArray(result) ? result[0] : []);

    if (!rows || rows.length === 0) {
      return h.response({
        error: false,
        message: 'No learning materials found.',
        learningMaterials: [],
      }).code(200);
    }

    const parsedRows = rows.map(parseMaterial);

    return h.response({
      error: false,
      message: 'Learning materials retrieved successfully.',
      learningMaterials: parsedRows,
    }).code(200);
  } catch (err) {
    return h.response({
      error: true,
      message: `Failed to retrieve learning materials. ${err.message}`,
    }).code(500);
  }
};

// GET by ID
const getLearningMaterialById = async (req, h) => {
  const { id } = req.params;
  try {
    const query = isPostgres
      ? 'SELECT * FROM learning_materials WHERE id = $1'
      : 'SELECT * FROM learning_materials WHERE id = ?';

    const rows = isPostgres
      ? (await pool.query(query, [id])).rows
      : (await pool.query(query, [id]))[0];

    if (!rows || rows.length === 0) {
      return h.response({
        error: true,
        message: `No learning material found with ID: ${id}`,
      }).code(404);
    }

    const material = parseMaterial(rows[0]);

    return h.response({
      error: false,
      message: 'Learning material retrieved successfully.',
      learningMaterial: material,
    }).code(200);
  } catch (err) {
    return h.response({
      error: true,
      message: `Failed to retrieve learning material. ${err.message}`,
    }).code(500);
  }
};

// CREATE
const createLearningMaterial = async (req, h) => {
  const { title, description, learning_image_path, sub_body_materials, sub_materials } = req.payload;
  try {
    const query = isPostgres
      ? `INSERT INTO learning_materials (title, description, sub_materials, sub_body_materials, learning_image_path, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`
      : `INSERT INTO learning_materials (title, description, sub_materials, sub_body_materials, learning_image_path, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;

    const params = [
      title,
      description,
      JSON.stringify(sub_materials),
      JSON.stringify(sub_body_materials),
      learning_image_path,
    ];

    const result = isPostgres
      ? (await pool.query(query, params)).rows[0]
      : (await pool.query(query, params))[0];

    const newId = isPostgres ? result.id : result.insertId;

    return h.response({
      error: false,
      message: 'Learning material created successfully.',
      learningMaterial: {
        id: newId,
        title,
        description,
        sub_materials,
        sub_body_materials,
        learning_image_path,
      },
    }).code(201);
  } catch (err) {
    return h.response({
      error: true,
      message: `Failed to create learning material. ${err.message}`,
    }).code(500);
  }
};

// UPDATE
const updateLearningMaterial = async (req, h) => {
  const { id } = req.params;
  const { title, description, learning_image_path, sub_body_materials, sub_materials } = req.payload;
  try {
    const query = isPostgres
      ? `UPDATE learning_materials SET title = $1, description = $2, learning_image_path = $3, sub_materials = $4, sub_body_materials = $5, updated_at = NOW()
         WHERE id = $6`
      : `UPDATE learning_materials SET title = ?, description = ?, learning_image_path = ?, sub_materials = ?, sub_body_materials = ?, updated_at = NOW()
         WHERE id = ?`;

    const params = [
      title,
      description,
      learning_image_path,
      JSON.stringify(sub_materials),
      JSON.stringify(sub_body_materials),
      id,
    ];

    const result = isPostgres
      ? (await pool.query(query, params)).rowCount
      : (await pool.query(query, params))[0].affectedRows;

    if (result === 0) {
      return h.response({
        error: true,
        message: `No learning material found with ID: ${id}`,
      }).code(404);
    }

    return h.response({
      error: false,
      message: 'Learning material updated successfully.',
      learningMaterial: {
        id,
        title,
        description,
        sub_materials,
        sub_body_materials,
        learning_image_path,
      },
    }).code(200);
  } catch (err) {
    return h.response({
      error: true,
      message: `Failed to update learning material. ${err.message}`,
    }).code(500);
  }
};

// DELETE
const deleteLearningMaterial = async (req, h) => {
  const { id } = req.params;
  try {
    const query = isPostgres
      ? 'DELETE FROM learning_materials WHERE id = $1'
      : 'DELETE FROM learning_materials WHERE id = ?';

    const result = isPostgres
      ? (await pool.query(query, [id])).rowCount
      : (await pool.query(query, [id]))[0].affectedRows;

    if (result === 0) {
      return h.response({
        error: true,
        message: `No learning material found with ID: ${id}`,
      }).code(404);
    }

    return h.response({
      error: false,
      message: 'Learning material deleted successfully.',
    }).code(200);
  } catch (err) {
    return h.response({
      error: true,
      message: `Failed to delete learning material. ${err.message}`,
    }).code(500);
  }
};

module.exports = {
  getAllLearningMaterials,
  getLearningMaterialById,
  createLearningMaterial,
  updateLearningMaterial,
  deleteLearningMaterial,
};