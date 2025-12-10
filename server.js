import express from 'express';
import { config } from 'dotenv';
import Database from 'better-sqlite3';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, param, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Helmet for HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Security: CORS configuration with environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Security: Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per IP
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 requests per hour for sensitive endpoints
  message: 'Muitas tentativas, tente novamente em 1 hora',
  standardHeaders: true,
  legacyHeaders: false,
});

const leadSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 lead submissions per hour per IP
  message: 'Você já enviou muitos formulários. Aguarde 1 hora para enviar novamente.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// Security: Body parser with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Database setup
const db = new Database('dev.db');

// Security: Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-mude-isso';

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};

// Helper: Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array()
    });
  }
  next();
};

// Create tables
db.exec(`
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

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('✅ Database tables created');

// Insert sample data if empty
const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get();
if (courseCount.count === 0) {
  // Insert course
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
  
  // Insert modules
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
// ROUTES
// ========================================

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'API is running! 🚀',
    database: 'SQLite (better-sqlite3)'
  });
});

// Get all courses
app.get('/api/courses', (req, res) => {
  try {
    const courses = db.prepare(`
      SELECT * FROM courses WHERE active = 1
    `).all();
    
    // Get modules for each course
    const getModules = db.prepare(`
      SELECT * FROM modules WHERE course_id = ? ORDER BY module_order
    `);
    
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

// Get course by ID
app.get('/api/courses/:id', (req, res) => {
  try {
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const modules = db.prepare(`
      SELECT * FROM modules WHERE course_id = ? ORDER BY module_order
    `).all(course.id);
    
    res.json({ ...course, modules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create lead (form submission) - WITH VALIDATION AND RATE LIMITING
app.post('/api/leads',
  leadSubmissionLimiter,
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Nome é obrigatório')
      .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
      .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Nome contém caracteres inválidos'),

    body('email')
      .optional({ checkFalsy: true })
      .trim()
      .isEmail().withMessage('Email inválido')
      .normalizeEmail()
      .isLength({ max: 255 }).withMessage('Email muito longo'),

    body('whatsapp')
      .trim()
      .notEmpty().withMessage('WhatsApp é obrigatório')
      .matches(/^[\d\s\-\+\(\)]+$/).withMessage('WhatsApp contém caracteres inválidos')
      .isLength({ min: 10, max: 20 }).withMessage('WhatsApp deve ter entre 10 e 20 caracteres'),

    body('city')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 }).withMessage('Cidade muito longa'),

    body('level')
      .optional({ checkFalsy: true })
      .trim()
      .isIn(['Começando do zero', 'Sei algumas frases', 'Já sei me comunicar', 'Avançado'])
      .withMessage('Nível inválido'),

    body('goal')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Objetivo muito longo'),

    body('schedule')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 }).withMessage('Horário muito longo'),

    body('message')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 1000 }).withMessage('Mensagem muito longa')
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const { name, email, whatsapp, city, level, goal, schedule, message } = req.body;

      const insert = db.prepare(`
        INSERT INTO leads (name, email, whatsapp, city, level, goal, schedule, message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insert.run(
        name,
        email || null,
        whatsapp,
        city || null,
        level || null,
        goal || null,
        schedule || null,
        message || null
      );

      res.status(201).json({
        success: true,
        message: 'Inscrição recebida! Você receberá uma mensagem no WhatsApp em breve.',
        lead: {
          id: result.lastInsertRowid,
          name,
          whatsapp
        }
      });
    } catch (error) {
      console.error('Error creating lead:', error.message);
      res.status(500).json({ error: 'Erro ao processar inscrição. Tente novamente mais tarde.' });
    }
  }
);

// Get all leads (PROTECTED - Admin only)
app.get('/api/leads',
  authenticateToken,
  strictLimiter,
  (req, res) => {
    try {
      const leads = db.prepare(`
        SELECT * FROM leads ORDER BY created_at DESC
      `).all();

      res.json({
        success: true,
        count: leads.length,
        leads
      });
    } catch (error) {
      console.error('Error fetching leads:', error.message);
      res.status(500).json({ error: 'Erro ao buscar leads. Tente novamente mais tarde.' });
    }
  }
);

// Get lead by ID (PROTECTED - Admin only)
app.get('/api/leads/:id',
  authenticateToken,
  strictLimiter,
  [
    param('id').isInt({ min: 1 }).withMessage('ID inválido')
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);

      if (!lead) {
        return res.status(404).json({ error: 'Lead não encontrado' });
      }

      res.json({
        success: true,
        lead
      });
    } catch (error) {
      console.error('Error fetching lead:', error.message);
      res.status(500).json({ error: 'Erro ao buscar lead. Tente novamente mais tarde.' });
    }
  }
);

// Update lead status (PROTECTED - Admin only)
app.patch('/api/leads/:id/status',
  authenticateToken,
  strictLimiter,
  [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
    body('status')
      .trim()
      .notEmpty().withMessage('Status é obrigatório')
      .isIn(['new', 'contacted', 'converted']).withMessage('Status deve ser: new, contacted ou converted')
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const { status } = req.body;

      // Check if lead exists first
      const leadExists = db.prepare('SELECT id FROM leads WHERE id = ?').get(req.params.id);
      if (!leadExists) {
        return res.status(404).json({ error: 'Lead não encontrado' });
      }

      const update = db.prepare('UPDATE leads SET status = ? WHERE id = ?');
      const result = update.run(status, req.params.id);

      res.json({
        success: true,
        message: 'Status atualizado com sucesso',
        updated: result.changes
      });
    } catch (error) {
      console.error('Error updating lead:', error.message);
      res.status(500).json({ error: 'Erro ao atualizar lead. Tente novamente mais tarde.' });
    }
  }
);

// ========================================
// AUTHENTICATION ROUTES
// ========================================

// Admin login - Generate JWT token
app.post('/api/auth/login',
  strictLimiter,
  [
    body('username')
      .trim()
      .notEmpty().withMessage('Usuário é obrigatório')
      .isLength({ min: 3, max: 50 }).withMessage('Usuário deve ter entre 3 e 50 caracteres'),
    body('password')
      .notEmpty().withMessage('Senha é obrigatória')
      .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, password } = req.body;

      // Get admin from database
      const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

      if (!admin) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, admin.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Generate JWT token
      const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-mude-isso';
      const token = jwt.sign(
        {
          id: admin.id,
          username: admin.username
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        token,
        expiresIn: '24h'
      });
    } catch (error) {
      console.error('Error during login:', error.message);
      res.status(500).json({ error: 'Erro ao realizar login. Tente novamente mais tarde.' });
    }
  }
);

// Admin registration - For initial setup (should be disabled in production)
app.post('/api/auth/register',
  strictLimiter,
  [
    body('username')
      .trim()
      .notEmpty().withMessage('Usuário é obrigatório')
      .isLength({ min: 3, max: 50 }).withMessage('Usuário deve ter entre 3 e 50 caracteres')
      .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Usuário deve conter apenas letras, números, _ ou -'),
    body('password')
      .notEmpty().withMessage('Senha é obrigatória')
      .isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Senha deve conter letras maiúsculas, minúsculas e números'),
    body('adminSecret')
      .notEmpty().withMessage('Chave admin é obrigatória')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // Check if registration is enabled
      const ADMIN_REGISTRATION_SECRET = process.env.ADMIN_REGISTRATION_SECRET;

      if (!ADMIN_REGISTRATION_SECRET) {
        return res.status(403).json({ error: 'Registro de admin desabilitado. Configure ADMIN_REGISTRATION_SECRET no .env' });
      }

      if (req.body.adminSecret !== ADMIN_REGISTRATION_SECRET) {
        return res.status(403).json({ error: 'Chave admin inválida' });
      }

      const { username, password } = req.body;

      // Check if username already exists
      const existingAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
      if (existingAdmin) {
        return res.status(409).json({ error: 'Usuário já existe' });
      }

      // Hash password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Insert admin
      const insert = db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)');
      const result = insert.run(username, password_hash);

      res.status(201).json({
        success: true,
        message: 'Admin registrado com sucesso',
        admin: {
          id: result.lastInsertRowid,
          username
        }
      });
    } catch (error) {
      console.error('Error during registration:', error.message);
      res.status(500).json({ error: 'Erro ao registrar admin. Tente novamente mais tarde.' });
    }
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📂 Database: dev.db (SQLite)`);
  console.log(`🎯 Ready to receive leads!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  console.log('\n👋 Database closed. Server stopped.');
  process.exit(0);
});