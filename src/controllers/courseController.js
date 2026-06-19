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
      name: language === 'en' ? row.name_en : row.name_id,
      description: language === 'en' ? row.description_en : row.description_id
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
    query += ' ORDER BY sorting_order ASC, id ASC';

    const result = await client.query(query, params);
    const rows = result.rows || [];

    const courses = rows.map(row => ({
      id: parseInt(row.id, 10),
      slug: row.slug,
      category_slug: row.category_slug,
      title: language === 'en' ? row.title_en : row.title_id,
      description: language === 'en' ? row.description_en : row.description_id,
      image_url: row.image_url,
      sorting_order: row.sorting_order,
      icon_url: row.icon_url
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

// GET /categories/:slug/courses?language=id
export const getCategoryCourses = async (c) => {
  const slug = c.req.param('slug');
  let client;
  try {
    const language = c.req.query('language') || 'id';
    client = getClient(c.env);
    await client.connect();

    // Fetch the category details
    const categoryResult = await client.query('SELECT * FROM categories WHERE slug = $1', [slug]);
    if (categoryResult.rows.length === 0) {
      return c.json({
        error: true,
        message: `No category found with slug: ${slug}`
      }, 404);
    }
    const categoryRow = categoryResult.rows[0];

    // Fetch courses in this category, ordered by sorting_order
    const coursesResult = await client.query(
      'SELECT * FROM courses WHERE category_slug = $1 ORDER BY sorting_order ASC, id ASC',
      [slug]
    );
    const courseRows = coursesResult.rows || [];

    const courses = courseRows.map(row => ({
      id: parseInt(row.id, 10),
      slug: row.slug,
      category_slug: row.category_slug,
      title: language === 'en' ? row.title_en : row.title_id,
      description: language === 'en' ? row.description_en : row.description_id,
      image_url: row.image_url,
      sorting_order: row.sorting_order,
      order: row.sorting_order, // Map sorting_order to order as per PRD
      icon_url: row.icon_url
    }));

    return c.json({
      error: false,
      message: 'Category courses retrieved successfully.',
      category: language === 'en' ? categoryRow.name_en : categoryRow.name_id,
      description: language === 'en' ? categoryRow.description_en : categoryRow.description_id,
      courses
    }, 200);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to retrieve category courses. ${err.message}`
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};

// GET /courses/:slug/journey?language=id
export const getCourseJourney = async (c) => {
  const slug = c.req.param('slug');
  const firebaseUid = c.get('firebaseUid'); // populated by optionalAuth middleware
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
    const courseRow = courseResult.rows[0];

    // Fetch user progress if authenticated
    const completedLessons = new Set();
    if (firebaseUid) {
      const userResult = await client.query('SELECT id FROM users WHERE firebase_uid = $1', [firebaseUid]);
      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        const progressResult = await client.query('SELECT lesson_slug FROM progress WHERE user_id = $1', [userId]);
        if (progressResult.rows) {
          progressResult.rows.forEach(p => completedLessons.add(p.lesson_slug));
        }
      }
    }

    // Fetch chapters for this course, ordered by level
    const chaptersResult = await client.query(
      'SELECT * FROM chapters WHERE course_slug = $1 ORDER BY level ASC',
      [slug]
    );
    const chapterRows = chaptersResult.rows || [];

    // Fetch lessons for this course and language, ordered by lesson_order
    const lessonsResult = await client.query(
      'SELECT slug, title, summary, chapter_slug, lesson_order FROM lessons WHERE course_slug = $1 AND language = $2 ORDER BY lesson_order ASC, id ASC',
      [slug, language]
    );
    const lessonRows = lessonsResult.rows || [];

    // Group lessons by chapter_slug
    const lessonsByChapter = {};
    for (const lesson of lessonRows) {
      const chSlug = lesson.chapter_slug || 'unassigned';
      if (!lessonsByChapter[chSlug]) {
        lessonsByChapter[chSlug] = [];
      }
      lessonsByChapter[chSlug].push({
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        lesson_order: lesson.lesson_order,
        done: completedLessons.has(lesson.slug)
      });
    }

    // Map chapters to the expected format
    const chapters = chapterRows.map(ch => ({
      id: parseInt(ch.id, 10),
      slug: ch.slug,
      level: ch.level,
      title: language === 'en' ? ch.title_en : ch.title_id,
      lessons: lessonsByChapter[ch.slug] || []
    }));

    return c.json({
      error: false,
      message: 'Course journey retrieved successfully.',
      course_slug: slug,
      course_title: language === 'en' ? courseRow.title_en : courseRow.title_id,
      chapters
    }, 200);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to retrieve course journey. ${err.message}`
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};

// GET /courses/:slug/lessons?language=id (kept for backwards compatibility)
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
      'SELECT id, slug, title, summary, language FROM lessons WHERE course_slug = $1 AND language = $2 ORDER BY lesson_order ASC, id ASC',
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
