import { getClient } from './config/database.js'

export async function runMigration(c) {
  const client = getClient(c.env)
  try {
    await client.connect()

    // 1. Drop existing tables in correct dependency order
    await client.query('DROP TABLE IF EXISTS assignments CASCADE')
    await client.query('DROP TABLE IF EXISTS class_members CASCADE')
    await client.query('DROP TABLE IF EXISTS classes CASCADE')
    await client.query('DROP TABLE IF EXISTS achievements CASCADE')
    await client.query('DROP TABLE IF EXISTS progress CASCADE')
    await client.query('DROP TABLE IF EXISTS users CASCADE')
    await client.query('DROP TABLE IF EXISTS lessons CASCADE')
    await client.query('DROP TABLE IF EXISTS learning_materials CASCADE')

    // 2. Create tables
    await client.query(`CREATE TABLE lessons (
      id BIGSERIAL PRIMARY KEY,
      slug TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'id',
      title TEXT NOT NULL,
      summary TEXT,
      blocks JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (slug, language)
    )`)

    await client.query('CREATE INDEX IF NOT EXISTS idx_lessons_slug ON lessons(slug)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_lessons_language ON lessons(language)')

    await client.query(`CREATE TABLE learning_materials (
      id BIGSERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL UNIQUE,
      description VARCHAR(255) NOT NULL,
      sub_materials JSONB DEFAULT NULL, 
      sub_body_materials JSONB DEFAULT NULL,
      learning_image_path VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`)

    await client.query(`CREATE TABLE users (
      id BIGSERIAL PRIMARY KEY,
      firebase_uid TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL DEFAULT '',
      email TEXT,
      role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`)

    await client.query(`CREATE TABLE progress (
      id BIGSERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      lesson_slug TEXT NOT NULL,
      score INT DEFAULT 0,
      completed_at TIMESTAMP,
      UNIQUE (user_id, lesson_slug)
    )`)

    await client.query(`CREATE TABLE achievements (
      id BIGSERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      badge_id TEXT NOT NULL,
      unlocked_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (user_id, badge_id)
    )`)

    await client.query(`CREATE TABLE classes (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      owner_teacher_id INT REFERENCES users(id),
      join_code TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`)

    await client.query(`CREATE TABLE class_members (
      class_id INT REFERENCES classes(id) ON DELETE CASCADE,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'assistant')),
      PRIMARY KEY (class_id, user_id)
    )`)

    await client.query(`CREATE TABLE assignments (
      id BIGSERIAL PRIMARY KEY,
      class_id INT REFERENCES classes(id) ON DELETE CASCADE,
      lesson_slug TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      due_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`)

    // 3. Seed bilingual lessons
    await client.query(`INSERT INTO lessons (slug, language, title, summary, blocks) VALUES
('what-is-ai', 'id', 'Apa itu AI?', 'Kenalan dengan kecerdasan buatan lewat contoh sehari-hari.',
  '[{"type":"text","markdown":"AI adalah komputer yang belajar dari contoh, bukan dihafalkan aturan. Kamu pasti sering lihat rekomendasi di YouTube atau TikTok — itu juga AI!"},{"type":"image","image_url":"https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600","caption":"Ilustrasi AI"},{"type":"quiz","question":"Bagaimana cara AI belajar?","choices":["Dengan diisi aturan satu per satu","Dengan melihat banyak contoh","Dengan sihir"],"answer_index":1,"hint":"Ingat analogi anak kecil belajar.","explanation":"AI belajar dari ribuan contoh, seperti anak kecil belajar mengenali kucing dari banyak gambar kucing."}]'::jsonb),
('what-is-ai', 'en', 'What is AI?', 'Meet artificial intelligence through everyday examples.',
  '[{"type":"text","markdown":"AI is a computer that learns from examples instead of being told every rule. You''ve seen YouTube or TikTok recommendations — that''s AI too!"},{"type":"image","image_url":"https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600","caption":"AI illustration"},{"type":"quiz","question":"How does AI learn?","choices":["By having rules programmed one by one","By looking at many examples","By magic"],"answer_index":1,"hint":"Think of the toddler analogy.","explanation":"AI learns from thousands of examples, just like a toddler learns to recognize cats from many cat pictures."}]'::jsonb);`)

    await client.query(`INSERT INTO lessons (slug, language, title, summary, blocks) VALUES
('how-ai-learns', 'id', 'Bagaimana AI Belajar?', 'AI belajar dari ribuan contoh yang disebut data latih.',
  '[{"type":"text","markdown":"AI belajar dari ribuan contoh yang disebut **data latih** (training data). Semakin banyak dan bervariasi contohnya, semakin pintar AI-nya!\\n\\nMisalnya, untuk mengenali kucing, AI perlu melihat ribuan gambar kucing — kucing orange, kucing hitam, kucing tidur, kucing lari."},{"type":"callout","style":"fun_fact","markdown":"Tahukah kamu? ChatGPT dilatih dengan miliaran kata dari buku, artikel, dan internet!"},{"type":"widget","widget_type":"train_your_own_ai","config":{}},{"type":"quiz","question":"Apa yang dibutuhkan AI untuk belajar?","choices":["Data latih","Cemilan","Listrik"],"answer_index":0,"hint":"Ingat bagian AI belajar dari contoh.","explanation":"AI butuh data latih — contoh-contoh yang bisa dipelajari untuk mengenali pola."}]'::jsonb),
('how-ai-learns', 'en', 'How AI Learns', 'AI learns from thousands of examples called training data.',
  '[{"type":"text","markdown":"AI learns from thousands of examples called **training data**. The more varied the examples, the smarter the AI gets!\\n\\nFor example, to recognize cats, AI needs to see thousands of cat pictures — orange cats, black cats, sleeping cats, running cats."},{"type":"callout","style":"fun_fact","markdown":"Did you know? ChatGPT was trained on billions of words from books, articles, and the internet!"},{"type":"widget","widget_type":"train_your_own_ai","config":{}},{"type":"quiz","question":"What does AI need to learn?","choices":["Training data","Snacks","Electricity"],"answer_index":0,"hint":"Think about how AI learns from examples.","explanation":"AI needs training data — examples it can study to recognize patterns."}]'::jsonb);`)

    await client.query(`INSERT INTO lessons (slug, language, title, summary, blocks) VALUES
('supervised-vs-unsupervised', 'id', 'Supervised vs Unsupervised', 'Dua cara AI belajar: dengan guru (supervised) atau sendiri (unsupervised).',
  '[{"type":"text","markdown":"**Supervised learning** seperti belajar dengan guru — kamu dikasih tahu jawabannya dulu, baru belajar polanya.\\n\\n**Unsupervised learning** seperti mencoba mengelompokkan mainan sendiri tanpa diberi tahu nama kelompoknya."},{"type":"image","image_url":"https://images.unsplash.com/photo-1509228627152-72e2aac4cb60?w=600","caption":"Supervised vs Unsupervised"},{"type":"widget","widget_type":"sorting_game","config":{"mode":"both"}},{"type":"quiz","question":"Supervised learning menggunakan...","choices":["Data berlabel","Data tanpa label","Data acak"],"answer_index":0,"hint":"Apa bedanya belajar dengan guru vs sendirian?","explanation":"Supervised learning menggunakan data yang sudah diberi label — seperti PR yang sudah dikoreksi guru."}]'::jsonb),
('supervised-vs-unsupervised', 'en', 'Supervised vs Unsupervised', 'Two ways AI learns: with a teacher (supervised) or by itself (unsupervised).',
  '[{"type":"text","markdown":"**Supervised learning** is like learning with a teacher — you''re shown the answers first, then learn the patterns.\\n\\n**Unsupervised learning** is like sorting toys into groups without being told what the groups are called."},{"type":"image","image_url":"https://images.unsplash.com/photo-1509228627152-72e2aac4cb60?w=600","caption":"Supervised vs Unsupervised"},{"type":"widget","widget_type":"sorting_game","config":{"mode":"both"}},{"type":"quiz","question":"Supervised learning uses...","choices":["Labeled data","Unlabeled data","Random data"],"answer_index":0,"hint":"What''s the difference between learning with a teacher vs alone?","explanation":"Supervised learning uses labeled data — like homework that''s already been graded by a teacher."}]'::jsonb);`)

    await client.query(`INSERT INTO lessons (slug, language, title, summary, blocks) VALUES
('image-classification', 'id', 'Klasifikasi Gambar', 'Cara AI mengenali apa yang ada di dalam foto.',
  '[{"type":"text","markdown":"**Klasifikasi gambar** adalah cara AI mengenali apa yang ada di dalam foto. AI melihat pola-pola seperti bentuk, warna, dan tekstur untuk menentukan nama benda tersebut."},{"type":"image","image_url":"https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600","caption":"AI melihat pola di gambar"},{"type":"widget","widget_type":"fruit_scanner","config":{}},{"type":"quiz","question":"Apa itu klasifikasi gambar?","choices":["AI memberi nama pada gambar","AI menggambar","AI merekam video"],"answer_index":0,"hint":"Apa yang terjadi saat kamu scan buah?","explanation":"Klasifikasi gambar adalah AI memberi label/nama pada gambar berdasarkan pola yang dikenali."}]'::jsonb),
('image-classification', 'en', 'Image Classification', 'How AI recognizes what''s in a photo.',
  '[{"type":"text","markdown":"**Image classification** is how AI recognizes what''s in a photo. AI looks for patterns like shapes, colors, and textures to identify objects."},{"type":"image","image_url":"https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600","caption":"AI looks for patterns in images"},{"type":"widget","widget_type":"fruit_scanner","config":{}},{"type":"quiz","question":"What is image classification?","choices":["AI names what''s in a picture","AI draws pictures","AI records video"],"answer_index":0,"hint":"What happens when you scan a fruit?","explanation":"Image classification is AI labeling what''s in an image based on patterns it recognizes."}]'::jsonb);`)

    await client.query(`INSERT INTO lessons (slug, language, title, summary, blocks) VALUES
('ai-can-be-wrong', 'id', 'AI Bisa Salah', 'AI tidak selalu benar — bahkan saat sangat yakin sekalipun.',
  '[{"type":"text","markdown":"AI tidak selalu benar! Kadang AI sangat yakin tapi tetap salah. Itulah kenapa kita harus selalu berpikir kritis saat menggunakan AI.\\n\\nMisalnya, AI mungkin mengira pizza sebagai koin karena sama-sama bulat dan kuning — dengan keyakinan 99%!"},{"type":"callout","style":"warning","markdown":"AI yang yakin 99% pun bisa salah. Contoh: AI bisa mengira pizza sebagai koin karena sama-sama bulat dan kuning!"},{"type":"widget","widget_type":"fruit_scanner","config":{"show_confidence":true}},{"type":"quiz","question":"Jika AI 95% yakin, artinya...","choices":["Mungkin masih salah 5%","Pasti benar","AI sedang bercanda"],"answer_index":0,"hint":"Apakah yakin berarti benar?","explanation":"Keyakinan tinggi bukan jaminan benar. AI bisa sangat yakin tapi tetap salah!"}]'::jsonb),
('ai-can-be-wrong', 'en', 'AI Can Be Wrong', 'AI isn''t always right — even when it''s very confident.',
  '[{"type":"text","markdown":"AI isn''t always right! Sometimes AI is very confident but still wrong. That''s why we should always think critically when using AI.\\n\\nFor example, AI might think a pizza is a coin because both are round and yellow — with 99% confidence!"},{"type":"callout","style":"warning","markdown":"AI that''s 99% confident can still be wrong. Example: AI might mistake a pizza for a coin because both are round and yellow!"},{"type":"widget","widget_type":"fruit_scanner","config":{"show_confidence":true}},{"type":"quiz","question":"If AI is 95% confident, it means...","choices":["Could still be wrong 5% of the time","Definitely correct","AI is joking"],"answer_index":0,"hint":"Does confident mean correct?","explanation":"High confidence is no guarantee of correctness. AI can be very confident and still wrong!"}]'::jsonb);`)

    await client.query(`INSERT INTO lessons (slug, language, title, summary, blocks) VALUES
('ai-around-us', 'id', 'AI di Sekitar Kita', 'AI ada di mana-mana dalam kehidupan sehari-hari.',
  '[{"type":"text","markdown":"AI ada di mana-mana! Dari rekomendasi YouTube, filter wajah di TikTok, Google Maps, sampai mobil pintar.\\n\\nSetiap kali kamu scroll TikTok dan lihat video yang cocok dengan minatmu — itu AI yang bekerja!"},{"type":"image","image_url":"https://images.unsplash.com/photo-1531746790095-e0eb5a766087?w=600","caption":"AI di kehidupan sehari-hari"},{"type":"quiz","question":"Mana yang menggunakan AI?","choices":["Rekomendasi YouTube","Sendok","Batu"],"answer_index":0,"hint":"Coba pikirkan teknologi di sekitarmu.","explanation":"Rekomendasi YouTube menggunakan AI untuk menebak video yang kamu suka berdasarkan tontonan sebelumnya."}]'::jsonb),
('ai-around-us', 'en', 'AI Around Us', 'AI is everywhere in our daily lives.',
  '[{"type":"text","markdown":"AI is everywhere! From YouTube recommendations, face filters on social media, Google Maps, to smart cars.\\n\\nEvery time you scroll TikTok and see videos you like — that''s AI at work!"},{"type":"image","image_url":"https://images.unsplash.com/photo-1531746790095-e0eb5a766087?w=600","caption":"AI in everyday life"},{"type":"quiz","question":"Which one uses AI?","choices":["YouTube recommendations","A spoon","A rock"],"answer_index":0,"hint":"Think about the technology around you.","explanation":"YouTube recommendations use AI to guess videos you''ll like based on what you''ve watched before."}]'::jsonb);`)

    // 4. Seed learning materials aligned with categories (AI, Coding, Data, CNN)
    await client.query(`INSERT INTO learning_materials (title, description, sub_materials, sub_body_materials, learning_image_path) VALUES
('Introduction to AI', 'Understand how machines think', '[["what-is-ai"], ["how-ai-learns"], ["supervised-vs-unsupervised"], ["image-classification"], ["ai-can-be-wrong"], ["ai-around-us"]]'::jsonb, '[["Apa itu AI?"], ["Bagaimana AI Belajar?"], ["Supervised vs Unsupervised"], ["Klasifikasi Gambar"], ["AI Bisa Salah"], ["AI di Sekitar Kita"]]'::jsonb, 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600'),
('Coding Basics', 'Learn programming concepts step-by-step.', '[["what-is-ai"]]'::jsonb, '[["Apa itu AI?"]]'::jsonb, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'),
('Data Science & ML', 'Explore how data powers modern AI.', '[["how-ai-learns"]]'::jsonb, '[["Bagaimana AI Belajar?"]]'::jsonb, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600'),
('Image Classification (CNN)', 'How machines see and recognize images.', '[["image-classification"]]'::jsonb, '[["Klasifikasi Gambar"]]'::jsonb, 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=600')`)

    return { ok: true, count: 12 }
  } catch (err) {
    return { ok: false, error: err.message }
  } finally {
    if (client) {
      await client.end()
    }
  }
}
