/**
 * ============================================================================
 * SERVER.JS - API Backend Principal
 * ============================================================================
 *
 * Servidor Express que fornece a API REST para o sistema de captura de leads
 * do curso "O Mínimo que Você Precisa pra se Virar nos EUA".
 *
 * ARQUITETURA:
 * - Framework: Express 5.x
 * - Database: SQLite (better-sqlite3) para persistência local
 * - Auth: JWT para autenticação stateless
 * - Validação: Zod para schema validation
 * - Logging: Winston para logs estruturados
 *
 * ENDPOINTS PÚBLICOS:
 * - GET  /                    - Health check
 * - GET  /api/courses         - Lista cursos ativos
 * - POST /api/leads           - Criação de leads (rate limited)
 * - GET  /api/csrf-token      - Obter token CSRF
 *
 * ENDPOINTS DE AUTH:
 * - POST /api/auth/login      - Login (rate limited)
 * - GET  /api/auth/me         - Dados do usuário atual
 * - POST /api/auth/logout     - Logout
 *
 * ENDPOINTS ADMIN (protegidos):
 * - GET    /api/admin/leads          - Listar leads
 * - GET    /api/admin/stats          - Estatísticas
 * - GET    /api/admin/stats/sources  - Stats por origem
 * - PATCH  /api/admin/leads/:id/status - Atualizar status
 * - DELETE /api/admin/leads/:id      - Deletar lead
 *
 * @author SevenZeroSev3n
 * @version 1.0.0
 *
 * TODO: [ARQUITETURA] Considerar migração para PostgreSQL em produção
 *       - SQLite é ótimo para desenvolvimento mas tem limitações de concorrência
 *       - Biblioteca recomendada: pg (node-postgres) ou Prisma ORM
 *       - Link: https://www.prisma.io/ ou https://node-postgres.com/
 *
 * TODO: [PERFORMANCE] Implementar caching com Redis para endpoints de leitura
 *       - Reduzir carga no banco de dados
 *       - Biblioteca: ioredis (https://github.com/redis/ioredis)
 *       - Cachear: /api/courses, /api/admin/stats
 *
 * TODO: [SEGURANÇA] Adicionar Helmet.js para headers de segurança HTTP
 *       - Já está no package.json, mas não está sendo usado
 *       - Adicionar: app.use(helmet())
 *       - Link: https://helmetjs.github.io/
 *
 * TODO: [MONITORAMENTO] Adicionar health checks mais robustos
 *       - Verificar conexão com banco de dados
 *       - Verificar espaço em disco para logs
 *       - Biblioteca: @godaddy/terminus (https://github.com/godaddy/terminus)
 *
 * TODO: [DOCUMENTAÇÃO] Adicionar Swagger/OpenAPI para documentação da API
 *       - Biblioteca: swagger-jsdoc + swagger-ui-express
 *       - Link: https://swagger.io/tools/swagger-ui/
 *
 * TODO: [TESTES] Aumentar cobertura de testes
 *       - Adicionar testes de integração para todos os endpoints
 *       - Usar supertest para testes de API
 *       - Meta: 80% de cobertura
 * ============================================================================
 */

import express from 'express';
import { config } from 'dotenv';
import Database from 'better-sqlite3';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import winston from 'winston';
import csrf from 'csurf';
import crypto from 'crypto';

/**
 * Carrega variáveis de ambiente do arquivo .env
 * Deve ser chamado antes de acessar process.env
 */
config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE CRÍTICAS
// ========================================

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('❌ ERRO CRÍTICO: JWT_SECRET deve ser definido no .env com pelo menos 32 caracteres');
  console.error('💡 Gere um secret seguro com: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ ERRO CRÍTICO: ADMIN_EMAIL e ADMIN_PASSWORD devem ser definidos no .env');
  process.exit(1);
}

// ========================================
// LOGGER COM WINSTON
// ========================================
/**
 * Configuração do sistema de logging com Winston
 * - Logs são salvos em arquivos separados por nível
 * - Em desenvolvimento, também exibe no console com cores
 *
 * TODO: [LOGGING] Implementar rotação de logs
 *       - Usar winston-daily-rotate-file para logs rotativos
 *       - Configurar retenção de logs (ex: 14 dias)
 *       - Link: https://github.com/winstonjs/winston-daily-rotate-file
 *
 * TODO: [OBSERVABILIDADE] Adicionar tracing distribuído
 *       - Integrar com OpenTelemetry para tracing
 *       - Correlacionar logs com traces
 *       - Link: https://opentelemetry.io/docs/js/
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Em desenvolvimento, também loga no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// ========================================
// MIDDLEWARE DE SEGURANÇA
// ========================================

// CORS com whitelist (#6 - já estava no relatório, incluindo aqui por completude)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin não permitida pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Limite de tamanho do body (#15)
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// CSRF Protection (#8)
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// ========================================
// RATE LIMITING
// ========================================
/**
 * Configuração de rate limiting para proteção contra abusos
 * - Login: Previne ataques de força bruta
 * - Leads: Previne spam no formulário de captura
 *
 * TODO: [RATE LIMITING] Implementar rate limiting distribuído com Redis
 *       - O rate limiting atual é in-memory e não funciona em cluster
 *       - Usar rate-limit-redis para ambientes com múltiplas instâncias
 *       - Link: https://github.com/express-rate-limit/rate-limit-redis
 *
 * TODO: [SEGURANÇA] Adicionar rate limiting global
 *       - Limitar requisições por IP para todos os endpoints
 *       - Sugestão: 100 req/min por IP
 *       - Ajuda a prevenir DDoS básico
 */

// Rate limiter para login (anti brute-force)
const loginLimiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_LOGIN_WINDOW_MINUTES || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_LOGIN_MAX || 5,
  message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit excedido - Login', { ip: req.ip, email: req.body?.email });
    res.status(429).json({ error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' });
  }
});

// Rate limiter para leads (anti-spam)
const leadsLimiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_LEADS_WINDOW_MINUTES || 60) * 60 * 1000,
  max: process.env.RATE_LIMIT_LEADS_MAX || 3,
  message: { error: 'Você já enviou muitos formulários. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit excedido - Leads', { ip: req.ip, name: req.body?.name });
    res.status(429).json({ error: 'Você já enviou muitos formulários. Tente novamente em 1 hora.' });
  }
});

// ========================================
// SCHEMAS DE VALIDAÇÃO COM ZOD
// ========================================
/**
 * Schemas de validação usando Zod para garantir integridade dos dados
 * - Validação de entrada em todos os endpoints que recebem dados
 * - Mensagens de erro em português para melhor UX
 *
 * TODO: [VALIDAÇÃO] Criar arquivo separado para schemas
 *       - Mover schemas para src/schemas/ ou src/validators/
 *       - Facilita reutilização e manutenção
 *       - Exportar tipos TypeScript dos schemas com z.infer<>
 *
 * TODO: [VALIDAÇÃO] Adicionar validação de WhatsApp mais robusta
 *       - Usar libphonenumber-js para validação internacional
 *       - Normalizar formato do número
 *       - Link: https://github.com/catamphetamine/libphonenumber-js
 */

/**
 * Schema de validação de senha forte
 * Requisitos: 12+ chars, maiúscula, minúscula, número, especial
 */
const passwordSchema = z.string()
  .min(12, 'Senha deve ter pelo menos 12 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial');

// Schema de login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

// Schema de lead
const leadSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  whatsapp: z.string()
    .min(10, 'WhatsApp inválido')
    .max(20, 'WhatsApp inválido')
    .regex(/^[\d\s\+\-\(\)]+$/, 'WhatsApp deve conter apenas números e símbolos válidos'),
  city: z.string().min(2).max(100).optional().or(z.literal('')),
  level: z.string().max(50).optional().or(z.literal('')),
  goal: z.string().max(500).optional().or(z.literal('')),
  schedule: z.string().max(200).optional().or(z.literal('')),
  message: z.string().max(1000).optional().or(z.literal('')),
  source: z.string().max(50).optional().or(z.literal('')),
  utm_source: z.string().max(100).optional().or(z.literal('')),
  utm_medium: z.string().max(100).optional().or(z.literal('')),
  utm_campaign: z.string().max(100).optional().or(z.literal(''))
});

// Schema de status de lead
const leadStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'converted'], {
    errorMap: () => ({ message: 'Status deve ser: new, contacted ou converted' })
  })
});

// ========================================
// DATABASE SETUP
// ========================================
/**
 * Configuração do banco de dados SQLite
 * - Usa better-sqlite3 para operações síncronas e performáticas
 * - Cria tabelas se não existirem
 * - Adiciona colunas de migração dinamicamente
 *
 * TODO: [DATABASE] Implementar sistema de migrations
 *       - Usar biblioteca como umzug ou knex para migrations
 *       - Versionamento do schema do banco
 *       - Link: https://github.com/sequelize/umzug
 *
 * TODO: [DATABASE] Adicionar índices para melhorar performance
 *       - CREATE INDEX idx_leads_status ON leads(status)
 *       - CREATE INDEX idx_leads_created_at ON leads(created_at)
 *       - CREATE INDEX idx_leads_source ON leads(source)
 *
 * TODO: [DATABASE] Implementar soft delete para leads
 *       - Adicionar coluna deleted_at
 *       - Manter histórico de leads deletados
 *       - Importante para auditoria e compliance
 *
 * TODO: [BACKUP] Implementar backup automático do banco
 *       - Usar node-schedule para agendamento
 *       - Backup diário para S3 ou similar
 *       - Link: https://github.com/node-schedule/node-schedule
 */

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

logger.info('✅ Database tables created');

// Add tracking columns if they don't exist
try {
  db.prepare('ALTER TABLE leads ADD COLUMN source TEXT DEFAULT "direct"').run();
  logger.info('✅ Column "source" added');
} catch (e) {
  // Column already exists
}

try {
  db.prepare('ALTER TABLE leads ADD COLUMN utm_source TEXT').run();
  logger.info('✅ Column "utm_source" added');
} catch (e) {
  // Column already exists
}

try {
  db.prepare('ALTER TABLE leads ADD COLUMN utm_medium TEXT').run();
  logger.info('✅ Column "utm_medium" added');
} catch (e) {
  // Column already exists
}

try {
  db.prepare('ALTER TABLE leads ADD COLUMN utm_campaign TEXT').run();
  logger.info('✅ Column "utm_campaign" added');
} catch (e) {
  // Column already exists
}

// Create admin user if not exists (com senha do .env) (#1)
const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get(ADMIN_EMAIL);
if (!adminExists) {
  try {
    // Valida senha do admin (#11)
    passwordSchema.parse(ADMIN_PASSWORD);
    
    const hashedPassword = bcryptjs.hashSync(ADMIN_PASSWORD, 12); // 12 rounds (#12)
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      'Admin',
      ADMIN_EMAIL,
      hashedPassword,
      'admin'
    );
    logger.info('✅ Admin user created with email from .env');
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ ERRO: Senha do admin não atende aos requisitos de segurança:');
      error.errors.forEach(err => console.error(`  - ${err.message}`));
      process.exit(1);
    }
    throw error;
  }
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
  
  logger.info('✅ Sample course data inserted');
}

// ========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ========================================
/**
 * Middlewares para controle de acesso às rotas protegidas
 * - authMiddleware: Verifica se o usuário está autenticado via JWT
 * - adminMiddleware: Verifica se o usuário tem role 'admin'
 *
 * TODO: [AUTH] Implementar refresh tokens
 *       - Tokens de acesso com expiração curta (15min)
 *       - Refresh tokens com expiração longa (7 dias)
 *       - Endpoint /api/auth/refresh para renovar tokens
 *       - Armazenar refresh tokens no banco com possibilidade de revogação
 *
 * TODO: [AUTH] Adicionar suporte a OAuth 2.0
 *       - Login com Google, Facebook, etc.
 *       - Usar passport.js para estratégias de auth
 *       - Link: https://www.passportjs.org/
 *
 * TODO: [AUTH] Implementar logout com blacklist de tokens
 *       - Manter lista de tokens revogados em Redis
 *       - Verificar blacklist no authMiddleware
 */

/**
 * Middleware de autenticação
 * Verifica token JWT no header Authorization ou cookie
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Próximo middleware
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    
    if (!token) {
      logger.warn('Tentativa de acesso sem token', { ip: req.ip, path: req.path });
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Token inválido', { ip: req.ip, error: error.message });
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    logger.warn('Tentativa de acesso admin sem permissão', { 
      ip: req.ip, 
      userId: req.user.id,
      role: req.user.role 
    });
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// ========================================
// ROTAS DE AUTENTICAÇÃO
// ========================================

// Endpoint para obter CSRF token (#8)
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Login com validação (#9) e rate limiting (#4)
app.post('/api/auth/login', loginLimiter, (req, res) => {
  try {
    // Validação de entrada (#9)
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) {
      logger.warn('Tentativa de login com email inexistente', { email, ip: req.ip });
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const passwordMatch = bcryptjs.compareSync(password, user.password);
    
    if (!passwordMatch) {
      logger.warn('Tentativa de login com senha incorreta', { email, ip: req.ip });
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    logger.info('Login bem-sucedido', { userId: user.id, email: user.email });
    
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
    if (error instanceof z.ZodError) {
      logger.warn('Validação de login falhou', { errors: error.errors, ip: req.ip });
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }
    
    logger.error('Erro no login', { error: error.message, stack: error.stack });
    
    const message = process.env.NODE_ENV === 'production' 
      ? 'Erro ao fazer login'
      : error.message;
      
    res.status(500).json({ error: message });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      logger.warn('Usuário não encontrado no /me', { userId: req.user.id });
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    logger.error('Erro ao buscar usuário', { 
      userId: req.user.id, 
      error: error.message 
    });
    
    const message = process.env.NODE_ENV === 'production' 
      ? 'Erro ao buscar usuário'
      : error.message;
      
    res.status(500).json({ error: message });
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
    security: {
      rateLimit: 'Enabled ✅',
      validation: 'Enabled ✅',
      csrf: 'Enabled ✅',
      logging: 'Enabled ✅'
    },
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
    logger.error('Erro ao buscar cursos', { error: error.message });
    
    const message = process.env.NODE_ENV === 'production' 
      ? 'Erro ao buscar cursos'
      : error.message;
      
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/leads - Criar novo lead (público)
 *
 * Endpoint principal de captura de leads da landing page.
 * - Validação de dados com Zod
 * - Rate limiting para prevenir spam
 * - Tracking de UTM para análise de campanhas
 * - Webhook opcional para integração com Make.com/Zapier
 *
 * TODO: [LEADS] Adicionar verificação de duplicatas
 *       - Verificar se já existe lead com mesmo WhatsApp
 *       - Opção de atualizar dados existentes ou rejeitar
 *
 * TODO: [LEADS] Implementar fila de processamento para webhooks
 *       - Usar Bull ou BullMQ para filas
 *       - Retry automático em caso de falha
 *       - Link: https://github.com/taskforcesh/bullmq
 *
 * TODO: [INTEGRAÇÃO] Adicionar integração direta com WhatsApp Business API
 *       - Enviar mensagem automática de boas-vindas
 *       - Link: https://developers.facebook.com/docs/whatsapp
 *
 * TODO: [ANALYTICS] Integrar com Google Analytics 4
 *       - Enviar evento de conversão via Measurement Protocol
 *       - Link: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */
app.post('/api/leads', leadsLimiter, async (req, res) => {
  try {
    // Validação com Zod (#9)
    const validatedData = leadSchema.parse(req.body);
    
    const { 
      name, email, whatsapp, city, level, goal, schedule, message,
      source, utm_source, utm_medium, utm_campaign
    } = validatedData;
    
    logger.info('📝 Novo lead recebido', { 
      name, 
      whatsapp, 
      city, 
      source: source || 'direct',
      campaign: utm_campaign || 'none',
      ip: req.ip
    });
    
    const insert = db.prepare(`
      INSERT INTO leads (
        name, email, whatsapp, city, level, goal, schedule, message,
        source, utm_source, utm_medium, utm_campaign
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(
      name, 
      email || null, 
      whatsapp, 
      city || null, 
      level || null, 
      goal || null, 
      schedule || null, 
      message || null,
      source || 'direct',
      utm_source || 'direct',
      utm_medium || 'none',
      utm_campaign || 'none'
    );
    
    logger.info('✅ Lead salvo no banco', { 
      leadId: result.lastInsertRowid, 
      source: source || 'direct' 
    });
    
    // Webhook para Make.com COM ASSINATURA (#13)
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

        // Assinatura HMAC do webhook (#13)
        let signature = null;
        const headers = { 'Content-Type': 'application/json' };
        
        if (process.env.WEBHOOK_SECRET) {
          signature = crypto
            .createHmac('sha256', process.env.WEBHOOK_SECRET)
            .update(JSON.stringify(webhookData))
            .digest('hex');
          
          headers['X-Webhook-Signature'] = signature;
          headers['X-Webhook-Timestamp'] = Date.now().toString();
        }

        const webhookResponse = await fetch(process.env.WEBHOOK_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(webhookData)
        });

        if (webhookResponse.ok) {
          logger.info('✅ Webhook enviado com sucesso', { 
            leadId: result.lastInsertRowid,
            signed: !!signature
          });
        } else {
          logger.warn('⚠️ Webhook retornou erro', { 
            status: webhookResponse.status,
            leadId: result.lastInsertRowid
          });
        }
      } catch (webhookError) {
        logger.error('❌ Erro ao enviar webhook', { 
          error: webhookError.message,
          leadId: result.lastInsertRowid
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Inscrição recebida!',
      lead: { id: result.lastInsertRowid, name, whatsapp }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validação de lead falhou', { 
        errors: error.errors,
        ip: req.ip,
        body: req.body
      });
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    
    logger.error('Erro ao processar lead', { 
      error: error.message,
      stack: error.stack
    });
    
    const message = process.env.NODE_ENV === 'production' 
      ? 'Erro ao processar inscrição'
      : error.message;
      
    res.status(500).json({ error: message });
  }
});

// ========================================
// ROTAS ADMIN (PROTEGIDAS)
// ========================================
/**
 * Rotas administrativas para gerenciamento de leads
 * - Requerem autenticação JWT
 * - Requerem role 'admin'
 * - Operações de escrita requerem token CSRF
 *
 * TODO: [ADMIN] Implementar exportação de leads
 *       - Exportar para CSV/Excel
 *       - Biblioteca: exceljs ou json2csv
 *       - Link: https://github.com/exceljs/exceljs
 *
 * TODO: [ADMIN] Adicionar filtros avançados de leads
 *       - Filtro por data (range)
 *       - Filtro por UTM source/campaign
 *       - Filtro por cidade
 *
 * TODO: [ADMIN] Implementar bulk actions
 *       - Atualizar status de múltiplos leads
 *       - Deletar múltiplos leads
 *       - Exportar selecionados
 *
 * TODO: [AUDITORIA] Adicionar log de ações administrativas
 *       - Registrar quem fez o quê e quando
 *       - Tabela audit_logs no banco
 *       - Campos: user_id, action, entity, entity_id, old_value, new_value, timestamp
 */

/**
 * GET /api/admin/leads - Listar todos os leads
 * Query params: status, search, limit, offset
 */
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
    logger.error('Erro ao buscar leads', { 
      error: error.message,
      userId: req.user.id
    });
    
    const message = process.env.NODE_ENV === 'production' 
      ? 'Erro ao buscar leads'
      : error.message;
      
    res.status(500).json({ error: message });
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
    logger.error('Erro ao buscar estatísticas', { 
      error: error.message,
      userId: req.user.id
    });
    
    const message = process.env.NODE_ENV === 'production' 
      ? 'Erro ao buscar estatísticas'
      : error.message;
      
    res.status(500).json({ error: message });
  }
});

// Get statistics by source
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
    logger.error('Erro ao buscar fontes', { 
      error: error.message,
      userId: req.user.id
    });
    
    const message = process.env.NODE_ENV === 'production' 
      ? 'Erro ao buscar fontes'
      : error.message;
      
    res.status(500).json({ error: message });
  }
});

// Update lead status - COM CSRF (#8) e VALIDAÇÃO (#9)
app.patch('/api/admin/leads/:id/status', csrfProtection, authMiddleware, adminMiddleware, (req, res) => {
  try {
    // Validação com Zod (#9)
    const validatedData = leadStatusSchema.parse(req.body);
    const { status } = validatedData;
    
    const update = db.prepare('UPDATE leads SET status = ? WHERE id = ?');
    const result = update.run(status, req.params.id);
    
    if (result.changes === 0) {
      logger.warn('Tentativa de atualizar lead inexistente', { 
        leadId: req.params.id,
        userId: req.user.id
      });
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    logger.info('Status de lead atualizado', { 
      leadId: req.params.id,
      newStatus: status,
      userId: req.user.id
    });
    
    res.json({ success: true, message: 'Status atualizado' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Status inválido', 
        details: error.errors 
      });
    }
    
    logger.error('Erro ao atualizar status', { 
      error: error.message,
      leadId: req.params.id,
      userId: req.user.id
    });
    
    const message = process.env.NODE_ENV === 'production' 
      ? 'Erro ao atualizar status'
      : error.message;
      
    res.status(500).json({ error: message });
  }
});

// Delete lead - COM CSRF (#8)
app.delete('/api/admin/leads/:id', csrfProtection, authMiddleware, adminMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      logger.warn('Tentativa de deletar lead inexistente', { 
        leadId: req.params.id,
        userId: req.user.id
      });
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    logger.info('Lead deletado', { 
      leadId: req.params.id,
      userId: req.user.id
    });
    
    res.json({ success: true, message: 'Lead deletado' });
  } catch (error) {
    logger.error('Erro ao deletar lead', { 
      error: error.message,
      leadId: req.params.id,
      userId: req.user.id
    });
    
    const message = process.env.NODE_ENV === 'production' 
      ? 'Erro ao deletar lead'
      : error.message;
      
    res.status(500).json({ error: message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ Server running on http://localhost:' + PORT);
  console.log('📂 Database: dev.db (SQLite)');
  console.log('🔗 CORS enabled for:', allowedOrigins.join(', '));
  console.log('🔐 Admin credentials: Configured via .env');
  console.log('📊 UTM Tracking: Enabled');
  console.log('🛡️  Security Features:');
  console.log('   - Rate Limiting: ✅');
  console.log('   - Input Validation: ✅');
  console.log('   - CSRF Protection: ✅');
  console.log('   - Logging (Winston): ✅');
  console.log('   - Body Size Limit: ✅ (10kb)');
  
  if (process.env.WEBHOOK_URL) {
    console.log('📡 Webhook: Configured' + (process.env.WEBHOOK_SECRET ? ' (Signed ✅)' : ' (Unsigned ⚠️)'));
  }
  
  console.log('═══════════════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  logger.info('👋 Database closed. Server stopped.');
  console.log('\n👋 Database closed. Server stopped.');
  process.exit(0);
});

// Export for testing
export { app, db };
