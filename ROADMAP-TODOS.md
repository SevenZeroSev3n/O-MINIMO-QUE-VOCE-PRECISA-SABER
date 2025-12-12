# 🗺️ ROADMAP DE MELHORIAS - O Mínimo que Você Precisa pra se Virar nos EUA

Este documento contém a lista priorizada de melhorias a serem implementadas no projeto.
A ordem foi definida considerando: **impacto**, **dependências** e **complexidade**.

---

## 📋 ÍNDICE

1. [Fase 1: Correções Críticas](#fase-1-correções-críticas)
2. [Fase 2: Fundamentos](#fase-2-fundamentos)
3. [Fase 3: Segurança](#fase-3-segurança)
4. [Fase 4: UX & Frontend](#fase-4-ux--frontend)
5. [Fase 5: Performance](#fase-5-performance)
6. [Fase 6: Integrações](#fase-6-integrações)
7. [Fase 7: Monitoramento](#fase-7-monitoramento)
8. [Fase 8: Escala](#fase-8-escala)

---

## 🚨 FASE 1: CORREÇÕES CRÍTICAS
> **Prioridade:** URGENTE | **Esforço:** Baixo | **Impacto:** Alto
>
> Bugs e problemas que precisam ser corrigidos ANTES de qualquer outra coisa.

### 1.1 Corrigir URLs hardcoded no LeadsPage.jsx
- **Arquivo:** `english-page/src/components/pages/admin/LeadsPage.jsx`
- **Problema:** Linhas 96 e 119 usam `localhost:3000` hardcoded
- **Solução:** Substituir por `${API_URL}`
- **Esforço:** 5 minutos

### 1.2 Remover funções duplicadas no LeadsPage.jsx
- **Arquivo:** `english-page/src/components/pages/admin/LeadsPage.jsx`
- **Problema:** `updateLeadStatus`/`handleStatusChange` e `deleteLead`/`handleDelete` são duplicados
- **Solução:** Manter apenas uma implementação de cada
- **Esforço:** 15 minutos

### 1.3 Adicionar Helmet.js (já instalado mas não usado)
- **Arquivo:** `server.js`
- **Problema:** Helmet está no package.json mas não está sendo usado
- **Solução:** Adicionar `app.use(helmet())` após os imports
- **Esforço:** 5 minutos

---

## 🏗️ FASE 2: FUNDAMENTOS
> **Prioridade:** Alta | **Esforço:** Médio | **Impacto:** Alto
>
> Estrutura base necessária para as próximas fases.

### 2.1 Criar AuthContext para estado de autenticação
- **Arquivos:** Criar `english-page/src/context/AuthContext.jsx`
- **Por quê:** Evita chamadas repetidas a `getCurrentUser()` e prop drilling
- **Dependentes:** Sidebar, ProtectedRoute, Dashboard
- **Esforço:** 2-3 horas
- **Como fazer:**
  ```jsx
  // Criar Provider com estado de user, loading, funções de login/logout
  // Envolver App com AuthProvider
  // Criar hook useAuth()
  ```

### 2.2 Extrair constantes compartilhadas
- **Criar:** `english-page/src/constants/leads.js`
- **Mover:** `getSourceIcon`, `getSourceLabel`, `getStatusBadge`
- **Arquivos afetados:** LeadsTable.jsx, SourceStats.jsx
- **Esforço:** 1 hora

### 2.3 Extrair componente LeadForm do HomePageContent
- **Criar:** `english-page/src/components/forms/LeadForm.jsx`
- **Por quê:** HomePageContent tem 550+ linhas, difícil manter
- **Esforço:** 2 horas

### 2.4 Unificar api.js e auth.js
- **Problema:** Código duplicado entre os dois arquivos
- **Solução:** Manter apenas `auth.js` e remover `api.js`
- **Esforço:** 30 minutos

---

## 🔒 FASE 3: SEGURANÇA
> **Prioridade:** Alta | **Esforço:** Médio-Alto | **Impacto:** Crítico
>
> Melhorias de segurança que devem ser feitas antes do deploy em produção.

### 3.1 Migrar token JWT para httpOnly cookie
- **Arquivos:** `server.js`, `auth.js`
- **Por quê:** localStorage é vulnerável a XSS
- **Esforço:** 4-6 horas
- **Como fazer:**
  1. Backend: Enviar token como cookie httpOnly no login
  2. Backend: Ler token do cookie em vez do header
  3. Frontend: Remover localStorage, usar credentials: 'include'
- **Link:** https://owasp.org/www-community/HttpOnly

### 3.2 Implementar Refresh Tokens
- **Arquivos:** `server.js`, `auth.js`
- **Por quê:** Access tokens curtos são mais seguros
- **Dependência:** 3.1 (httpOnly cookies)
- **Esforço:** 6-8 horas
- **Como fazer:**
  1. Access token: 15 minutos
  2. Refresh token: 7 dias (armazenado no banco)
  3. Endpoint POST /api/auth/refresh
  4. Rotação de refresh token a cada uso

### 3.3 Implementar blacklist de tokens no logout
- **Dependência:** 3.2 (Refresh tokens) ou Redis
- **Por quê:** Permite invalidar tokens antes da expiração
- **Esforço:** 2-3 horas

### 3.4 Rate limiting distribuído com Redis
- **Dependência:** Redis configurado
- **Por quê:** Rate limiting atual não funciona em cluster
- **Biblioteca:** `rate-limit-redis`
- **Esforço:** 2 horas

### 3.5 Validação de expiração do token no frontend
- **Arquivo:** `auth.js`
- **Biblioteca:** `jwt-decode`
- **Esforço:** 1 hora
- **Como fazer:**
  ```javascript
  import jwtDecode from 'jwt-decode';
  const isTokenExpired = (token) => {
    const { exp } = jwtDecode(token);
    return Date.now() >= exp * 1000;
  };
  ```

---

## 🎨 FASE 4: UX & FRONTEND
> **Prioridade:** Média | **Esforço:** Variável | **Impacto:** Médio-Alto
>
> Melhorias na experiência do usuário.

### 4.1 Validação em tempo real no formulário
- **Arquivo:** `HomePageContent.jsx` (ou novo `LeadForm.jsx`)
- **Biblioteca:** `react-hook-form` + `zod`
- **Esforço:** 3-4 horas
- **Link:** https://react-hook-form.com/

### 4.2 Máscara de input para WhatsApp
- **Biblioteca:** `react-input-mask`
- **Esforço:** 1 hora
- **Link:** https://github.com/sanniassin/react-input-mask

### 4.3 Menu hamburguer para mobile no Header
- **Arquivo:** `Header.jsx`, `Header.module.css`
- **Esforço:** 2-3 horas

### 4.4 Paginação de leads (server-side)
- **Arquivos:** `server.js`, `LeadsPage.jsx`, `LeadsTable.jsx`
- **Por quê:** Performance com muitos leads
- **Esforço:** 3-4 horas

### 4.5 Debounce na busca de leads
- **Arquivo:** `LeadsPage.jsx`
- **Biblioteca:** `lodash.debounce` ou hook customizado
- **Esforço:** 30 minutos

### 4.6 Ordenação nas colunas da tabela
- **Arquivo:** `LeadsTable.jsx`
- **Esforço:** 2-3 horas

### 4.7 Modal de detalhes do lead
- **Criar:** `LeadDetailModal.jsx`
- **Esforço:** 3-4 horas

### 4.8 Seleção múltipla e bulk actions
- **Arquivos:** `LeadsPage.jsx`, `LeadsTable.jsx`
- **Esforço:** 4-6 horas

### 4.9 Melhorar loading states (Skeleton)
- **Arquivos:** Dashboard, LeadsPage, ProtectedRoute
- **Esforço:** 2-3 horas

### 4.10 Dropdown para mudança de status
- **Arquivo:** `LeadsTable.jsx`
- **Por quê:** Ciclo de status não é intuitivo
- **Esforço:** 1-2 horas

---

## ⚡ FASE 5: PERFORMANCE
> **Prioridade:** Média | **Esforço:** Médio | **Impacto:** Médio
>
> Otimizações para melhor velocidade.

### 5.1 Configurar aliases de path no Vite
- **Arquivo:** `vite.config.js`
- **Esforço:** 30 minutos
- **Como fazer:**
  ```javascript
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components'
    }
  }
  ```

### 5.2 Lazy loading de rotas
- **Arquivo:** `App.jsx`
- **Esforço:** 1 hora
- **Como fazer:**
  ```javascript
  const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
  // Envolver com Suspense
  ```

### 5.3 Code splitting para vendor
- **Arquivo:** `vite.config.js`
- **Esforço:** 1 hora

### 5.4 Cache com Redis no backend
- **Dependência:** Redis configurado
- **Endpoints:** `/api/courses`, `/api/admin/stats`
- **Biblioteca:** `ioredis`
- **Esforço:** 3-4 horas

### 5.5 React Query/SWR para cache no frontend
- **Biblioteca:** `@tanstack/react-query`
- **Esforço:** 4-6 horas
- **Link:** https://tanstack.com/query

---

## 🔌 FASE 6: INTEGRAÇÕES
> **Prioridade:** Baixa-Média | **Esforço:** Alto | **Impacto:** Alto
>
> Integrações com serviços externos.

### 6.1 Eventos de conversão (Google Analytics 4)
- **Arquivos:** `HomePageContent.jsx`, `main.jsx`
- **Eventos:** form_start, form_submit, form_success
- **Esforço:** 2-3 horas
- **Link:** https://developers.google.com/analytics/devguides/collection/ga4

### 6.2 Facebook Pixel
- **Evento:** Lead
- **Esforço:** 1-2 horas

### 6.3 Fila de processamento para webhooks
- **Biblioteca:** `bullmq`
- **Dependência:** Redis
- **Por quê:** Retry automático, não bloqueia resposta
- **Esforço:** 4-6 horas
- **Link:** https://github.com/taskforcesh/bullmq

### 6.4 Exportar leads para CSV/Excel
- **Biblioteca:** `sheetjs` (xlsx)
- **Esforço:** 2-3 horas
- **Link:** https://github.com/SheetJS/sheetjs

### 6.5 Email de recuperação de senha
- **Biblioteca:** `nodemailer` ou SendGrid
- **Esforço:** 4-6 horas
- **Link:** https://sendgrid.com/

### 6.6 WhatsApp Business API
- **Por quê:** Mensagem automática de boas-vindas
- **Esforço:** 8-12 horas
- **Link:** https://developers.facebook.com/docs/whatsapp

---

## 📊 FASE 7: MONITORAMENTO
> **Prioridade:** Baixa (pré-produção) | **Esforço:** Médio | **Impacto:** Alto
>
> Observabilidade e monitoramento.

### 7.1 Rotação de logs
- **Biblioteca:** `winston-daily-rotate-file`
- **Esforço:** 1 hora
- **Link:** https://github.com/winstonjs/winston-daily-rotate-file

### 7.2 Health checks robustos
- **Biblioteca:** `@godaddy/terminus`
- **Verificar:** DB, disco, memória
- **Esforço:** 2-3 horas
- **Link:** https://github.com/godaddy/terminus

### 7.3 Error tracking com Sentry
- **Biblioteca:** `@sentry/node`, `@sentry/react`
- **Esforço:** 2-3 horas
- **Link:** https://sentry.io/

### 7.4 Web Vitals tracking
- **Biblioteca:** `web-vitals`
- **Esforço:** 1 hora
- **Link:** https://github.com/GoogleChrome/web-vitals

### 7.5 Documentação da API com Swagger
- **Biblioteca:** `swagger-jsdoc`, `swagger-ui-express`
- **Esforço:** 4-6 horas
- **Link:** https://swagger.io/tools/swagger-ui/

### 7.6 Gráficos mais robustos no Dashboard
- **Biblioteca:** `recharts`
- **Esforço:** 4-6 horas
- **Link:** https://recharts.org/

---

## 🚀 FASE 8: ESCALA
> **Prioridade:** Baixa (quando necessário) | **Esforço:** Alto | **Impacto:** Crítico
>
> Preparação para escala e produção.

### 8.1 Migrar para PostgreSQL
- **Biblioteca:** `prisma` ou `pg`
- **Por quê:** SQLite não suporta concorrência alta
- **Esforço:** 8-16 horas
- **Links:**
  - https://www.prisma.io/
  - https://node-postgres.com/

### 8.2 Sistema de migrations
- **Biblioteca:** `prisma migrate` ou `umzug`
- **Dependência:** 8.1
- **Esforço:** 2-4 horas
- **Link:** https://github.com/sequelize/umzug

### 8.3 Adicionar índices no banco
- **Dependência:** 8.1
- **Índices:**
  - `idx_leads_status` ON leads(status)
  - `idx_leads_created_at` ON leads(created_at)
  - `idx_leads_source` ON leads(source)
- **Esforço:** 1 hora

### 8.4 Soft delete para leads
- **Adicionar:** Coluna `deleted_at`
- **Por quê:** Auditoria e compliance
- **Esforço:** 2-3 horas

### 8.5 Backup automático
- **Biblioteca:** `node-schedule`
- **Destino:** S3 ou similar
- **Esforço:** 3-4 horas
- **Link:** https://github.com/node-schedule/node-schedule

### 8.6 2FA (Two-Factor Authentication)
- **Biblioteca:** `speakeasy`
- **Esforço:** 6-8 horas
- **Link:** https://github.com/speakeasyjs/speakeasy

### 8.7 PWA (Progressive Web App)
- **Biblioteca:** `vite-plugin-pwa`
- **Esforço:** 4-6 horas
- **Link:** https://vite-pwa-org.netlify.app/

---

## 📈 RESUMO POR ESFORÇO

### Quick Wins (< 1 hora)
- [ ] 1.1 Corrigir URLs hardcoded
- [ ] 1.2 Remover funções duplicadas
- [ ] 1.3 Adicionar Helmet.js
- [ ] 4.5 Debounce na busca
- [ ] 5.1 Aliases de path

### Médio (1-4 horas)
- [ ] 2.2 Extrair constantes
- [ ] 2.3 Extrair LeadForm
- [ ] 2.4 Unificar api.js e auth.js
- [ ] 3.5 Validação de expiração do token
- [ ] 4.2 Máscara de WhatsApp
- [ ] 4.4 Paginação
- [ ] 5.2 Lazy loading
- [ ] 7.1 Rotação de logs

### Alto (4-8 horas)
- [ ] 2.1 AuthContext
- [ ] 3.1 httpOnly cookies
- [ ] 3.2 Refresh tokens
- [ ] 4.1 Validação em tempo real
- [ ] 5.5 React Query
- [ ] 6.3 Fila de webhooks

### Muito Alto (> 8 horas)
- [ ] 6.6 WhatsApp Business API
- [ ] 8.1 Migrar para PostgreSQL
- [ ] 8.6 2FA

---

## ✅ CHECKLIST DE DEPLOY

Antes de ir para produção, garanta que:

- [ ] Fase 1 completa (correções críticas)
- [ ] Fase 2 completa (fundamentos)
- [ ] 3.1 httpOnly cookies implementado
- [ ] 3.4 Rate limiting distribuído (se usar múltiplas instâncias)
- [ ] 7.1 Rotação de logs configurada
- [ ] 7.2 Health checks implementados
- [ ] 7.3 Error tracking configurado
- [ ] Variáveis de ambiente de produção configuradas
- [ ] CORS configurado para domínio de produção
- [ ] SSL/HTTPS configurado
- [ ] Backup configurado

---

## 🔗 RECURSOS ÚTEIS

| Categoria | Recurso | Link |
|-----------|---------|------|
| Forms | React Hook Form | https://react-hook-form.com/ |
| Data Fetching | TanStack Query | https://tanstack.com/query |
| Gráficos | Recharts | https://recharts.org/ |
| ORM | Prisma | https://www.prisma.io/ |
| Filas | BullMQ | https://github.com/taskforcesh/bullmq |
| Error Tracking | Sentry | https://sentry.io/ |
| Analytics | GA4 | https://analytics.google.com/ |
| Email | SendGrid | https://sendgrid.com/ |
| PWA | Vite PWA | https://vite-pwa-org.netlify.app/ |
| Segurança | OWASP | https://owasp.org/ |

---

*Documento gerado em: Dezembro 2024*
*Última atualização: Dezembro 2024*
