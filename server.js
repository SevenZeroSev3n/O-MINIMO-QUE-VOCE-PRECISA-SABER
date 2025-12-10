import express from 'express';
import { config } from 'dotenv';
import Database from 'better-sqlite3';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import cookieParser from 'cookie-parser';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-mude-isso';

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Database setup
const db = new Database('dev.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    whatsapp TEXT NOT NULL,
    city TEXT,
    level TEXT,
    goal TEXT,
    schedule TEXT,
    message TEXT,
    source TEXT DEFAULT 'direct',
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    lessons INTEGER DEFAULT 108,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    module_order INTEGER NOT NULL,
    lessons INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );
`);

console.log('✅ Database tables created');

// Add tracking columns if they don't exist
try {
  db.prepare('ALTER TABLE leads ADD COLUMN source TEXT DEFAULT "direct"').run();
  console.log('✅ Column "source" added');
} catch (e) {
  // Column already exists
}

try {
  db.prepare('ALTER TABLE leads ADD COLUMN utm_source TEXT').run();
  console.log('✅ Column "utm_source" added');
} catch (e) {
  // Column already exists
}

try {
  db.prepare('ALTER TABLE leads ADD COLUMN utm_medium TEXT').run();
  console.log('✅ Column "utm_medium" added');
} catch (e) {
  // Column already exists
}

try {
  db.prepare('ALTER TABLE leads ADD COLUMN utm_campaign TEXT').run();
  console.log('✅ Column "utm_campaign" added');
} catch (e) {
  // Column already exists
}

// Create admin user if not exists
const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@example.com');
if (!adminExists) {
  const hashedPassword = bcryptjs.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Admin',
    'admin@example.com',
    hashedPassword,
    'admin'
  );
  console.log('✅ Admin user created: admin@example.com / admin123');
}

// Insert sample course data if empty
const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get();
if (courseCount.count === 0) {
  const insertCourse = db.prepare(`
    INSERT INTO courses (title, description, price, lessons)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = insertCourse.run(
    'O Mínimo que Você Precisa pra se Virar nos EUA',
    'Inglês prático para brasileiros que vivem ou querem viver nos Estados Unidos',
    297.00,
    108
  );
  
  const courseId = result.lastInsertRowid;
  
  const modules = [
    { title: 'MÓDULO 1 – SOBREVIVÊNCIA IMEDIATA', lessons: 10, order: 1 },
    { title: 'MÓDULO 2 – COMIDA E BEBIDA', lessons: 13, order: 2 },
    { title: 'MÓDULO 3 – TRABALHO', lessons: 10, order: 3 },
    { title: 'MÓDULO 4 – DINHEIRO E COMPRAS', lessons: 12, order: 4 },
    { title: 'MÓDULO 5 – MORADIA E DIA A DIA', lessons: 10, order: 5 },
    { title: 'MÓDULO 6 – TECNOLOGIA E COMUNICAÇÃO', lessons: 10, order: 6 },
    { title: 'MÓDULO 7 – TRANSPORTE', lessons: 13, order: 7 },
    { title: 'MÓDULO 8 – CONVERSAS', lessons: 13, order: 8 },
    { title: 'MÓDULO 9 – EMERGÊNCIAS', lessons: 10, order: 9 },
    { title: 'MÓDULO 10 – BUROCRACIA', lessons: 15, order: 10 }
  ];
  
  const insertModule = db.prepare(`
    INSERT INTO modules (course_id, title, module_order, lessons)
    VALUES (?, ?, ?, ?)
  `);
  
  for (const mod of modules) {
    insertModule.run(courseId, mod.title, mod.order, mod.lessons);
  }
  
  console.log('✅ Sample data inserted');
}

// ========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ========================================

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// ========================================
// ROTAS DE AUTENTICAÇÃO
// ========================================

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const passwordMatch = bcryptjs.compareSync(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logout realizado' });
});

// ========================================
// ROTAS PÚBLICAS
// ========================================

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'API is running! 🚀',
    database: 'SQLite (better-sqlite3)',
    webhook: process.env.WEBHOOK_URL ? 'Configured ✅' : 'Not configured ⚠️'
  });
});

// Get all courses
app.get('/api/courses', (req, res) => {
  try {
    const courses = db.prepare('SELECT * FROM courses WHERE active = 1').all();
    
    const getModules = db.prepare('SELECT * FROM modules WHERE course_id = ? ORDER BY module_order');
    
    const coursesWithModules = courses.map(course => ({
      ...course,
      modules: getModules.all(course.id)
    }));
    
    res.json(coursesWithModules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Create lead (public) - COM TRACKING
app.post('/api/leads', async (req, res) => {
  try {
    const { 
      name, email, whatsapp, city, level, goal, schedule, message,
      source, utm_source, utm_medium, utm_campaign
    } = req.body;
    
    console.log('📝 Novo lead recebido:', { 
      name, 
      whatsapp, 
      city, 
      source: source || 'direct',
      campaign: utm_campaign || 'none'
    });
    
    if (!name || !whatsapp) {
      return res.status(400).json({ error: 'Nome e WhatsApp são obrigatórios' });
    }
    
    const insert = db.prepare(`
      INSERT INTO leads (
        name, email, whatsapp, city, level, goal, schedule, message,
        source, utm_source, utm_medium, utm_campaign
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(
      name, 
      email, 
      whatsapp, 
      city, 
      level, 
      goal, 
      schedule, 
      message,
      source || 'direct',
      utm_source || 'direct',
      utm_medium || 'none',
      utm_campaign || 'none'
    );
    
    console.log('✅ Lead salvo no banco. ID:', result.lastInsertRowid, '| Source:', source || 'direct');
    
    // Webhook para Make.com
    if (process.env.WEBHOOK_URL) {
      try {
        const webhookData = {
          id: result.lastInsertRowid,
          name, whatsapp, city, level, goal, schedule, message, email,
          source: source || 'direct',
          utm_source: utm_source || 'direct',
          utm_medium: utm_medium || 'none',
          utm_campaign: utm_campaign || 'none',
          timestamp: new Date().toISOString()
        };

        const webhookResponse = await fetch(process.env.WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });

        if (webhookResponse.ok) {
          console.log('✅ Webhook enviado com sucesso!');
        }
      } catch (webhookError) {
        console.error('❌ Erro ao enviar webhook:', webhookError.message);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Inscrição recebida!',
      lead: { id: result.lastInsertRowid, name, whatsapp }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar inscrição' });
  }
});

// ========================================
// ROTAS ADMIN (PROTEGIDAS)
// ========================================

// Get all leads (admin only)
app.get('/api/admin/leads', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM leads';
    const params = [];
    const conditions = [];
    
    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (search) {
      conditions.push('(name LIKE ? OR whatsapp LIKE ? OR city LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const leads = db.prepare(query).all(...params);
    const totalQuery = 'SELECT COUNT(*) as total FROM leads' + 
      (conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '');
    const total = db.prepare(totalQuery).get(...params.slice(0, -2));
    
    res.json({
      leads,
      total: total.total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
});

// Get lead statistics
app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM leads').get();
    const newLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'new'").get();
    const contacted = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'contacted'").get();
    const converted = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'converted'").get();
    
    const today = new Date().toISOString().split('T')[0];
    const todayLeads = db.prepare('SELECT COUNT(*) as count FROM leads WHERE DATE(created_at) = ?').get(today);
    
    const last7Days = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM leads 
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all();
    
    res.json({
      total: total.count,
      byStatus: {
        new: newLeads.count,
        contacted: contacted.count,
        converted: converted.count
      },
      today: todayLeads.count,
      last7Days
    });
  } catch (error) {
    console.error('Erro na rota /api/admin/stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Get statistics by source (NOVO)
app.get('/api/admin/stats/sources', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const sources = db.prepare(`
      SELECT 
        source,
        utm_campaign,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new,
        COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted
      FROM leads
      WHERE source IS NOT NULL
      GROUP BY source, utm_campaign
      ORDER BY total DESC
    `).all();
    
    res.json(sources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar fontes' });
  }
});

// Update lead status
app.patch('/api/admin/leads/:id/status', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'contacted', 'converted'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const update = db.prepare('UPDATE leads SET status = ? WHERE id = ?');
    const result = update.run(status, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    res.json({ success: true, message: 'Status atualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Delete lead
app.delete('/api/admin/leads/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    res.json({ success: true, message: 'Lead deletado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar lead' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ Server running on http://localhost:' + PORT);
  console.log('📂 Database: dev.db (SQLite)');
  console.log('🔗 CORS enabled for: http://localhost:5173');
  console.log('🔐 Admin credentials: admin@example.com / admin123');
  console.log('📊 UTM Tracking: Enabled');
  
  if (process.env.WEBHOOK_URL) {
    console.log('📡 Webhook: Configured');
  }
  
  console.log('═══════════════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  console.log('\n👋 Database closed. Server stopped.');
  process.exit(0);
});