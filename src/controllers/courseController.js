import { getClient } from '../config/database.js';

// GET /categories?language=id
export const getCategories = async (c) => {
  let client;
  try {
    const language = c.req.query('language') || 'id';
    client = getClient(c.env);
    await client.connect();

    const result = await client.query('SELECT * FROM categories ORDER BY id ASC');
    const rows = result.rows || [];

    const categories = rows.map(row => ({
      id: parseInt(row.id, 10),
      slug: row.slug,
      name: language === 'en' ? row.name_en : row.name_id
    }));

    return c.json({
      error: false,
      message: 'Categories retrieved successfully.',
      categories
    }, 200);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to retrieve categories. ${err.message}`
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};

// GET /courses?category=ai&language=id
export const getCourses = async (c) => {
  let client;
  try {
    const category = c.req.query('category');
    const language = c.req.query('language') || 'id';
    client = getClient(c.env);
    await client.connect();

    let query = 'SELECT * FROM courses';
    const params = [];
    if (category) {
      query += ' WHERE category_slug = $1';
      params.push(category);
    }
    query += ' ORDER BY id ASC';

    const result = await client.query(query, params);
    const rows = result.rows || [];

    const courses = rows.map(row => ({
      id: parseInt(row.id, 10),
      slug: row.slug,
      category_slug: row.category_slug,
      title: language === 'en' ? row.title_en : row.title_id,
      description: language === 'en' ? row.description_en : row.description_id,
      image_url: row.image_url
    }));

    return c.json({
      error: false,
      message: 'Courses retrieved successfully.',
      courses
    }, 200);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to retrieve courses. ${err.message}`
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};

// GET /courses/:slug/lessons?language=id
export const getCourseLessons = async (c) => {
  const slug = c.req.param('slug');
  let client;
  try {
    const language = c.req.query('language') || 'id';
    client = getClient(c.env);
    await client.connect();

    // Verify course exists
    const courseResult = await client.query('SELECT * FROM courses WHERE slug = $1', [slug]);
    if (courseResult.rows.length === 0) {
      return c.json({
        error: true,
        message: `No course found with slug: ${slug}`
      }, 404);
    }

    const lessonsResult = await client.query(
      'SELECT id, slug, title, summary, language FROM lessons WHERE course_slug = $1 AND language = $2 ORDER BY id ASC',
      [slug, language]
    );
    const lessons = lessonsResult.rows || [];

    return c.json({
      error: false,
      message: 'Lessons retrieved successfully.',
      lessons
    }, 200);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to retrieve lessons. ${err.message}`
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};
