# O Mínimo que Você Precisa pra se Virar nos EUA

 

> Sistema de captura de leads e landing page para curso de inglês prático para brasileiros nos Estados Unidos.

 

<p align="center">

  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />

  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />

  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />

  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" />

</p>

 

---

 

## O que o Sistema Faz

 

| Funcionalidade | Descrição |

|----------------|-----------|

| Landing Page | Página de vendas com formulário de captura |

| Gestão de Leads | Painel admin para gerenciar interessados |

| UTM Tracking | Rastreia origem dos leads (campanhas, ads) |

| Webhooks | Integração automática com Make.com/Zapier |

 

---

 

## Stack

 

### Backend

```

Express 5 • SQLite • JWT • Zod • Winston • Rate Limiting

```

 

### Frontend

```

React 19 • Vite 7 • React Router 7 • CSS Modules

```

 

---

 

## Segurança

 

| Feature | Status |

|---------|--------|

| Autenticação JWT | Tokens com expiração de 7 dias |

| Rate Limiting | 5 tentativas login / 3 leads por hora |

| Validação Zod | Schemas em todos os inputs |

| CSRF Protection | Tokens por sessão |

| Senhas Fortes | Min. 12 chars + maiúscula + número + especial |

| Logging | Winston com arquivos estruturados |

| Webhooks HMAC | Assinatura SHA-256 |

 

---

 

## Início Rápido

 

### 1. Configure o ambiente

 

```bash

cp .env.example .env

```

 

```env

JWT_SECRET=seu_secret_com_pelo_menos_32_caracteres

ADMIN_EMAIL=seu@email.com

ADMIN_PASSWORD=SuaSenhaForte123!

```

 

### 2. Instale e execute

 

```bash

# Backend

npm install && npm run dev

 

# Frontend (em outro terminal)

cd english-page && npm install && npm run dev

```

 

### 3. Acesse

 

| Serviço | URL |

|---------|-----|

| API | http://localhost:3000 |

| Frontend | http://localhost:5173 |

| Admin | http://localhost:5173/admin |

 

---

 

## API Endpoints

 

### Públicos

```http

GET  /                    # Health check

GET  /api/courses         # Lista cursos

POST /api/leads           # Cria lead

```

 

### Autenticação

```http

POST /api/auth/login      # Login

GET  /api/auth/me         # Usuário atual

```

 

### Admin

```http

GET    /api/admin/leads           # Lista leads

GET    /api/admin/stats           # Estatísticas

GET    /api/admin/stats/sources   # Stats por fonte

PATCH  /api/admin/leads/:id/status

DELETE /api/admin/leads/:id

```

 

---

 

## Estrutura

 

```

├── server.js                 # API Express

├── english-page/

│   └── src/

│       ├── components/

│       │   ├── pages/

│       │   │   ├── HomePageContent.jsx   # Landing

│       │   │   └── admin/                # Dashboard

│       │   └── admin/                    # Componentes admin

│       └── services/

│           ├── api.js                    # Fetch autenticado

│           └── auth.js                   # Login/logout

```

 

---

 

## Fluxo

 

```

Visitante ──▶ Landing Page ──▶ Formulário ──▶ API

                                              │

              Admin ◀── Dashboard ◀── SQLite ◀┘

                                              │

                          Webhook ──▶ Make.com ◀┘

```

 

---

 

## Licença

 

ISC

 