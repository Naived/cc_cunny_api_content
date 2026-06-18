import { getClient } from '../config/database.js';

// GET All
export const getAllLearningMaterials = async (c) => {
  let client;
  try {
    const language = c.req.query('language') || 'id';
    client = getClient(c.env);
    await client.connect();
    
    // Query all courses
    const coursesResult = await client.query('SELECT * FROM courses ORDER BY id ASC');
    const courses = coursesResult.rows || [];
    
    const parsedRows = [];
    for (const course of courses) {
      const lessonsResult = await client.query(
        'SELECT slug, title FROM lessons WHERE course_slug = $1 AND language = $2 ORDER BY id ASC',
        [course.slug, language]
      );
      const lessons = lessonsResult.rows || [];
      
      const subMaterials = lessons.map(lesson => [lesson.slug]);
      const subBodyMaterials = lessons.map(lesson => [lesson.title]);
      
      parsedRows.push({
        id: parseInt(course.id, 10),
        title: language === 'en' ? course.title_en : course.title_id,
        description: language === 'en' ? course.description_en : course.description_id,
        sub_materials: subMaterials,
        sub_body_materials: subBodyMaterials,
        learning_image_path: course.image_url
      });
    }

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
    const language = c.req.query('language') || 'id';
    client = getClient(c.env);
    await client.connect();

    const courseResult = await client.query('SELECT * FROM courses WHERE id = $1', [id]);
    const courseRows = courseResult.rows || [];

    if (courseRows.length === 0) {
      return c.json({
        error: true,
        message: `No learning material found with ID: ${id}`,
      }, 404);
    }

    const course = courseRows[0];
    const lessonsResult = await client.query(
      'SELECT slug, title FROM lessons WHERE course_slug = $1 AND language = $2 ORDER BY id ASC',
      [course.slug, language]
    );
    const lessons = lessonsResult.rows || [];

    const subMaterials = lessons.map(lesson => [lesson.slug]);
    const subBodyMaterials = lessons.map(lesson => [lesson.title]);

    const material = {
      id: parseInt(course.id, 10),
      title: language === 'en' ? course.title_en : course.title_id,
      description: language === 'en' ? course.description_en : course.description_id,
      sub_materials: subMaterials,
      sub_body_materials: subBodyMaterials,
      learning_image_path: course.image_url
    };

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
  return c.json({ error: true, message: 'Creating legacy learning materials directly is deprecated. Use course endpoints.' }, 405);
};

// UPDATE
export const updateLearningMaterial = async (c) => {
  return c.json({ error: true, message: 'Updating legacy learning materials directly is deprecated. Use course endpoints.' }, 405);
};

// DELETE
export const deleteLearningMaterial = async (c) => {
  return c.json({ error: true, message: 'Deleting legacy learning materials directly is deprecated. Use course endpoints.' }, 405);
};