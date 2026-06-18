import { getClient } from '../config/database.js';

const VALID_BLOCK_TYPES = ['text', 'image', 'video', 'callout', 'widget', 'quiz'];

function validateBlocks(blocks) {
  const errors = [];
  if (!Array.isArray(blocks)) {
    return ['blocks must be an array'];
  }
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block.type || !VALID_BLOCK_TYPES.includes(block.type)) {
      errors.push(`block[${i}]: invalid or missing type. Valid types: ${VALID_BLOCK_TYPES.join(', ')}`);
      continue;
    }
    switch (block.type) {
      case 'text':
        if (!block.markdown || typeof block.markdown !== 'string') {
          errors.push(`block[${i}] (text): markdown is required and must be a string`);
        }
        break;
      case 'image':
        if (!block.image_url || typeof block.image_url !== 'string') {
          errors.push(`block[${i}] (image): image_url is required and must be a string`);
        }
        break;
      case 'video':
        if (!block.video_url || typeof block.video_url !== 'string') {
          errors.push(`block[${i}] (video): video_url is required and must be a string`);
        }
        break;
      case 'callout':
        if (!block.style || !['info', 'warning', 'fun_fact'].includes(block.style)) {
          errors.push(`block[${i}] (callout): style must be one of: info, warning, fun_fact`);
        }
        if (!block.markdown || typeof block.markdown !== 'string') {
          errors.push(`block[${i}] (callout): markdown is required and must be a string`);
        }
        break;
      case 'widget':
        if (!block.widget_type || typeof block.widget_type !== 'string') {
          errors.push(`block[${i}] (widget): widget_type is required and must be a string`);
        }
        break;
      case 'quiz':
        if (!block.question || typeof block.question !== 'string') {
          errors.push(`block[${i}] (quiz): question is required and must be a string`);
        }
        if (!Array.isArray(block.choices) || block.choices.length < 2) {
          errors.push(`block[${i}] (quiz): choices must be an array with at least 2 items`);
        }
        if (typeof block.answer_index !== 'number' || !Number.isInteger(block.answer_index)) {
          errors.push(`block[${i}] (quiz): answer_index must be an integer`);
        }
        break;
    }
  }
  return errors;
}

// GET /lessons?language=id
export const getAllLessons = async (c) => {
  let client;
  try {
    const language = c.req.query('language') || 'id';
    client = getClient(c.env);
    await client.connect();

    const result = await client.query(
      'SELECT id, slug, language, title, summary, created_at, updated_at FROM lessons WHERE language = $1 ORDER BY id ASC',
      [language]
    );
    const rows = result.rows || [];

    if (rows.length === 0) {
      return c.json({
        error: false,
        message: 'No lessons found.',
        lessons: [],
      }, 200);
    }

    return c.json({
      error: false,
      message: 'Lessons retrieved successfully.',
      lessons: rows,
    }, 200);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to retrieve lessons. ${err.message}`,
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};

// GET /lessons/:slug?language=id
export const getLessonBySlug = async (c) => {
  const slug = c.req.param('slug');
  const language = c.req.query('language') || 'id';
  let client;
  try {
    client = getClient(c.env);
    await client.connect();

    const result = await client.query(
      'SELECT * FROM lessons WHERE slug = $1 AND language = $2',
      [slug, language]
    );
    const rows = result.rows || [];

    if (rows.length === 0) {
      return c.json({
        error: true,
        message: `No lesson found with slug: ${slug} and language: ${language}`,
      }, 404);
    }

    return c.json({
      error: false,
      message: 'Lesson retrieved successfully.',
      lesson: rows[0],
    }, 200);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to retrieve lesson. ${err.message}`,
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};

// POST /lessons
export const createLesson = async (c) => {
  let client;
  try {
    const body = await c.req.json();
    const { slug, language, title, summary, blocks } = body;

    if (!slug || !title) {
      return c.json({
        error: true,
        message: 'slug and title are required',
      }, 400);
    }

    const blockErrors = validateBlocks(blocks);
    if (blockErrors.length > 0) {
      return c.json({
        error: true,
        message: blockErrors.join('; '),
      }, 400);
    }

    client = getClient(c.env);
    await client.connect();

    const result = await client.query(
      `INSERT INTO lessons (slug, language, title, summary, blocks, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [slug, language || 'id', title, summary || null, JSON.stringify(blocks || [])]
    );

    return c.json({
      error: false,
      message: 'Lesson created successfully.',
      lesson: result.rows[0],
    }, 201);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to create lesson. ${err.message}`,
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};

// PUT /lessons/:slug
export const updateLesson = async (c) => {
  const slug = c.req.param('slug');
  let client;
  try {
    client = getClient(c.env);
    await client.connect();
    const body = await c.req.json();

    if (body.blocks) {
      const blockErrors = validateBlocks(body.blocks);
      if (blockErrors.length > 0) {
        return c.json({
          error: true,
          message: blockErrors.join('; '),
        }, 400);
      }
    }

    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    if (body.slug !== undefined) {
      setClauses.push(`slug = $${paramIndex++}`);
      params.push(body.slug);
    }
    if (body.language !== undefined) {
      setClauses.push(`language = $${paramIndex++}`);
      params.push(body.language);
    }
    if (body.title !== undefined) {
      setClauses.push(`title = $${paramIndex++}`);
      params.push(body.title);
    }
    if (body.summary !== undefined) {
      setClauses.push(`summary = $${paramIndex++}`);
      params.push(body.summary);
    }
    if (body.blocks !== undefined) {
      setClauses.push(`blocks = $${paramIndex++}`);
      params.push(JSON.stringify(body.blocks));
    }

    if (setClauses.length === 0) {
      return c.json({
        error: true,
        message: 'No fields provided to update.',
      }, 400);
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(slug);

    const query = `UPDATE lessons SET ${setClauses.join(', ')} WHERE slug = $${paramIndex} RETURNING *`;
    const result = await client.query(query, params);

    if (result.rowCount === 0) {
      return c.json({
        error: true,
        message: `No lesson found with slug: ${slug}`,
      }, 404);
    }

    return c.json({
      error: false,
      message: 'Lesson updated successfully.',
      lesson: result.rows[0],
    }, 200);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to update lesson. ${err.message}`,
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};

// DELETE /lessons/:slug
export const deleteLesson = async (c) => {
  const slug = c.req.param('slug');
  let client;
  try {
    client = getClient(c.env);
    await client.connect();

    const result = await client.query('DELETE FROM lessons WHERE slug = $1', [slug]);

    if (result.rowCount === 0) {
      return c.json({
        error: true,
        message: `No lesson found with slug: ${slug}`,
      }, 404);
    }

    return c.json({
      error: false,
      message: 'Lesson deleted successfully.',
    }, 200);
  } catch (err) {
    return c.json({
      error: true,
      message: `Failed to delete lesson. ${err.message}`,
    }, 500);
  } finally {
    if (client) c.executionCtx.waitUntil(client.end());
  }
};
