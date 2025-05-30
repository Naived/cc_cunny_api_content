// learningMaterialsController.js
const pool = require('../config/database'); // Database connection
const isPostgres = process.env.DB_TYPE === 'postgres'; // Check if using PostgreSQL

// Get All Learning Materials
const getAllLearningMaterials = async (req, h) => {
  try {
    const query = 'SELECT * FROM learning_materials';
    const rows = isPostgres
      ? (await pool.query(query)).rows // PostgreSQL
      : (await pool.query(query))[0]; // MySQL

    if (rows.length === 0) {
      return h.response({
        error: false,
        message: 'No learning materials found.',
      }).code(404);
    }

    const parsedRows = isPostgres
    ? rows // PostgreSQL doesn't need JSON parsing
    : rows.map((row) => ({
      ...row,
      sub_materials: typeof row.sub_materials === 'string' ? JSON.parse(row.sub_materials) : row.sub_materials,
      sub_body_materials: typeof row.sub_body_materials === 'string' ? JSON.parse(row.sub_body_materials) : row.sub_body_materials,
    }));


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

// Get Learning Material by ID
const getLearningMaterialById = async (req, h) => {
  const { id } = req.params;
  try {
    const query = isPostgres
      ? 'SELECT * FROM learning_materials WHERE id = $1' // PostgreSQL
      : 'SELECT * FROM learning_materials WHERE id = ?'; // MySQL

    const rows = isPostgres
      ? (await pool.query(query, [id])).rows // PostgreSQL
      : (await pool.query(query, [id]))[0]; // MySQL

    if (rows.length === 0) {
      return h.response({
        error: true,
        message: `Learning material not found. No material found with ID: ${id}`,
      }).code(404);
    }

    const material = isPostgres
    ? rows[0] // PostgreSQL doesn't need JSON parsing
    : {
        ...rows[0],
        sub_materials: typeof rows[0].sub_materials === 'string' ? JSON.parse(rows[0].sub_materials) : rows[0].sub_materials,
        sub_body_materials: typeof rows[0].sub_body_materials === 'string' ? JSON.parse(rows[0].sub_body_materials) : rows[0].sub_body_materials,
      };
  

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

// Create Learning Material
const createLearningMaterial = async (req, h) => {
  const { title, description, learning_image_path, sub_body_materials, sub_materials } = req.payload;
  try {
    const query = isPostgres
      ? `INSERT INTO learning_materials (title, description, sub_materials, sub_body_materials, learning_image_path, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id` // PostgreSQL
      : `INSERT INTO learning_materials (title, description, sub_materials, sub_body_materials, learning_image_path, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`; // MySQL

    const params = [
      title,
      description,
      JSON.stringify(sub_materials),
      JSON.stringify(sub_body_materials),
      learning_image_path,
    ];

    const result = isPostgres
      ? (await pool.query(query, params)).rows[0] // PostgreSQL
      : (await pool.query(query, params))[0]; // MySQL

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

// Update Learning Material
const updateLearningMaterial = async (req, h) => {
  const { id } = req.params;
  const { title, description, learning_image_path, sub_body_materials, sub_materials } = req.payload;
  try {
    const query = isPostgres
      ? `UPDATE learning_materials SET title = $1, description = $2, learning_image_path = $3, sub_body_materials = $4, sub_materials = $5, updated_at = NOW()
         WHERE id = $6` // PostgreSQL
      : `UPDATE learning_materials SET title = ?, description = ?, learning_image_path = ?, sub_body_materials = ?, sub_materials = ?, updated_at = NOW()
         WHERE id = ?`; // MySQL

    const params = [
      title,
      description,
      learning_image_path,
      JSON.stringify(sub_materials),
      JSON.stringify(sub_body_materials),
      id,
    ];

    const result = isPostgres
      ? (await pool.query(query, params)).rowCount // PostgreSQL
      : (await pool.query(query, params))[0].affectedRows; // MySQL

    if (result === 0) {
      return h.response({
        error: true,
        message: `Learning material not found. No material found with ID: ${id}`,
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

// Delete Learning Material
const deleteLearningMaterial = async (req, h) => {
  const { id } = req.params;
  try {
    const query = isPostgres
      ? 'DELETE FROM learning_materials WHERE id = $1' // PostgreSQL
      : 'DELETE FROM learning_materials WHERE id = ?'; // MySQL

    const result = isPostgres
      ? (await pool.query(query, [id])).rowCount // PostgreSQL
      : (await pool.query(query, [id]))[0].affectedRows; // MySQL

    if (result === 0) {
      return h.response({
        error: true,
        message: `Learning material not found. No material found with ID: ${id}`,
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
