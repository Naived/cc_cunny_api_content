// learningMaterialsController.js
import { getClient } from '../config/database.js';

// Normalize sub-materials & body format
function normalizeMaterialFormat(material) {
  return {
    ...material,
    sub_materials: Array.isArray(material.sub_materials)
      ? material.sub_materials.map(item =>
          Array.isArray(item) ? item : [item]
        )
      : [],
    sub_body_materials: Array.isArray(material.sub_body_materials)
      ? material.sub_body_materials.map(item =>
          Array.isArray(item) ? item : [item]
        )
      : [],
  };
}

// Parse material record
function parseMaterial(row) {
  // We assume PostgreSQL behavior with Neon/Hyperdrive
  const parsed = row; 
  return normalizeMaterialFormat(parsed);
}

// GET All
export const getAllLearningMaterials = async (c) => {
  let client;
  try {
    client = getClient(c.env);
    await client.connect();
    
    const query = 'SELECT * FROM learning_materials';
    const result = await client.query(query);
    const rows = result.rows || [];

    if (!rows || rows.length === 0) {
      return c.json({
        error: false,
        message: 'No learning materials found.',
        learningMaterials: [],
      }, 200);
    }

    const parsedRows = rows.map(parseMaterial);

    return c.json({
      error: false,
      message: 'Learning materials retrieved successfully.',
      learningMaterials: parsedRows,
    }, 200);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to retrieve learning materials. ${err.message}`,
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};

// GET by ID
export const getLearningMaterialById = async (c) => {
  const id = c.req.param('id');
  let client;
  try {
    client = getClient(c.env);
    await client.connect();

    const query = 'SELECT * FROM learning_materials WHERE id = $1';
    const result = await client.query(query, [id]);
    const rows = result.rows || [];

    if (!rows || rows.length === 0) {
      return c.json({
        error: true,
        message: `No learning material found with ID: ${id}`,
      }, 404);
    }

    const material = parseMaterial(rows[0]);

    return c.json({
      error: false,
      message: 'Learning material retrieved successfully.',
      learningMaterial: material,
    }, 200);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to retrieve learning material. ${err.message}`,
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};

// CREATE
export const createLearningMaterial = async (c) => {
  let client;
  try {
    const { title, description, learning_image_path, sub_body_materials, sub_materials } = await c.req.json();
    
    client = getClient(c.env);
    await client.connect();

    const query = `INSERT INTO learning_materials (title, description, sub_materials, sub_body_materials, learning_image_path, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`;
    
    const params = [
      title,
      description,
      JSON.stringify(sub_materials),
      JSON.stringify(sub_body_materials),
      learning_image_path,
    ];

    const result = await client.query(query, params);
    const newId = result.rows[0].id;

    return c.json({
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
    }, 201);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to create learning material. ${err.message}`,
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};

// UPDATE
export const updateLearningMaterial = async (c) => {
  const id = c.req.param('id');
  let client;
  try {
    const { title, description, learning_image_path, sub_body_materials, sub_materials } = await c.req.json();
    
    client = getClient(c.env);
    await client.connect();

    const query = `UPDATE learning_materials SET title = $1, description = $2, learning_image_path = $3, sub_materials = $4, sub_body_materials = $5, updated_at = NOW()
                   WHERE id = $6`;

    const params = [
      title,
      description,
      learning_image_path,
      JSON.stringify(sub_materials),
      JSON.stringify(sub_body_materials),
      id,
    ];

    const result = await client.query(query, params);

    if (result.rowCount === 0) {
      return c.json({
        error: true,
        message: `No learning material found with ID: ${id}`,
      }, 404);
    }

    return c.json({
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
    }, 200);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to update learning material. ${err.message}`,
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};

// DELETE
export const deleteLearningMaterial = async (c) => {
  const id = c.req.param('id');
  let client;
  try {
    client = getClient(c.env);
    await client.connect();

    const query = 'DELETE FROM learning_materials WHERE id = $1';
    const result = await client.query(query, [id]);

    if (result.rowCount === 0) {
      return c.json({
        error: true,
        message: `No learning material found with ID: ${id}`,
      }, 404);
    }

    return c.json({
      error: false,
      message: 'Learning material deleted successfully.',
    }, 200);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to delete learning material. ${err.message}`,
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};