# 🔒 Guia de Segurança

Este documento descreve as melhorias de segurança implementadas no backend e como configurá-las corretamente.

## 📋 Índice

1. [Melhorias Implementadas](#melhorias-implementadas)
2. [Configuração Inicial](#configuração-inicial)
3. [Autenticação](#autenticação)
4. [Endpoints Protegidos](#endpoints-protegidos)
5. [Rate Limiting](#rate-limiting)
6. [Validação de Entrada](#validação-de-entrada)
7. [Melhores Práticas](#melhores-práticas)

---

## ✅ Melhorias Implementadas

### 1. **Helmet.js - Headers de Segurança HTTP**
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- Proteção contra ataques XSS

### 2. **Autenticação JWT**
- Endpoints sensíveis protegidos com JSON Web Tokens
- Tokens expiram em 24 horas
- Senha com hash bcrypt (10 rounds)

### 3. **Rate Limiting**
- **Geral**: 100 requisições por 15 minutos
- **Endpoints Admin**: 5 requisições por hora
- **Submissão de Leads**: 3 formulários por hora por IP

### 4. **Validação de Entrada**
- Validação robusta com express-validator
- Sanitização de dados
- Proteção contra SQL Injection (queries parametrizadas)
- Limites de tamanho de campos

### 5. **CORS Configurável**
- Origens permitidas via variável de ambiente
- Proteção contra requisições não autorizadas

### 6. **Limite de Tamanho de Requisições**
- Máximo de 10KB por requisição
- Proteção contra ataques de negação de serviço

---

## 🚀 Configuração Inicial

### 1. Copiar Arquivo de Ambiente

```bash
cp .env.example .env
```

### 2. Gerar Secrets Seguros

Execute os comandos abaixo para gerar secrets fortes:

```bash
# Gerar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Gerar ADMIN_REGISTRATION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `.env`:

```env
PORT=3000
JWT_SECRET=<cole-o-jwt-secret-gerado-aqui>
ADMIN_REGISTRATION_SECRET=<cole-o-admin-secret-gerado-aqui>
ALLOWED_ORIGINS=http://localhost:5173
DATABASE_URL=file:./dev.db
```

### 4. Instalar Dependências

```bash
npm install
```

### 5. Iniciar Servidor

```bash
npm run dev
```

---

## 🔐 Autenticação

### Registrar Primeiro Admin

**⚠️ IMPORTANTE**: Este endpoint só funciona se `ADMIN_REGISTRATION_SECRET` estiver configurado no `.env`

```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "password": "SenhaForte123!",
  "adminSecret": "<seu-ADMIN_REGISTRATION_SECRET>"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Admin registrado com sucesso",
  "admin": {
    "id": 1,
    "username": "admin"
  }
}
```

**🔒 Após criar o primeiro admin, remova `ADMIN_REGISTRATION_SECRET` do `.env` para desabilitar novos registros.**

### Fazer Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "SenhaForte123!"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

### Usar Token em Requisições

Inclua o token no header `Authorization`:

```bash
GET /api/leads
Authorization: Bearer <seu-token-jwt>
```

---

## 🛡️ Endpoints Protegidos

### Endpoints Públicos (Sem Autenticação)

| Método | Endpoint | Descrição | Rate Limit |
|--------|----------|-----------|------------|
| GET | `/` | Health check | 100/15min |
| GET | `/api/courses` | Listar cursos | 100/15min |
| GET | `/api/courses/:id` | Detalhes do curso | 100/15min |
| POST | `/api/leads` | Criar lead | **3/hora** |

### Endpoints Protegidos (Requerem JWT)

| Método | Endpoint | Descrição | Rate Limit |
|--------|----------|-----------|------------|
| GET | `/api/leads` | Listar todos os leads | 5/hora |
| GET | `/api/leads/:id` | Detalhes de um lead | 5/hora |
| PATCH | `/api/leads/:id/status` | Atualizar status do lead | 5/hora |

### Endpoints de Autenticação

| Método | Endpoint | Descrição | Rate Limit |
|--------|----------|-----------|------------|
| POST | `/api/auth/login` | Login admin | 5/hora |
| POST | `/api/auth/register` | Registrar admin | 5/hora |

---

## ⏱️ Rate Limiting

### Limites Configurados

1. **Geral (generalLimiter)**
   - 100 requisições por IP a cada 15 minutos
   - Aplica-se a todos os endpoints por padrão

2. **Estrito (strictLimiter)**
   - 5 requisições por IP a cada 1 hora
   - Aplica-se a endpoints administrativos e de autenticação

3. **Submissão de Leads (leadSubmissionLimiter)**
   - 3 submissões por IP a cada 1 hora
   - Aplica-se apenas ao POST `/api/leads`

### Mensagens de Erro

Quando exceder o limite:
```json
{
  "message": "Muitas requisições deste IP, tente novamente em 15 minutos"
}
```

---

## ✅ Validação de Entrada

### POST /api/leads

| Campo | Validação |
|-------|-----------|
| `name` | Obrigatório, 2-100 caracteres, apenas letras |
| `email` | Opcional, formato de email válido |
| `whatsapp` | Obrigatório, 10-20 caracteres, apenas números e símbolos |
| `city` | Opcional, máx 100 caracteres |
| `level` | Opcional, valores: 'Começando do zero', 'Sei algumas frases', 'Já sei me comunicar', 'Avançado' |
| `goal` | Opcional, máx 500 caracteres |
| `schedule` | Opcional, máx 200 caracteres |
| `message` | Opcional, máx 1000 caracteres |

### Exemplo de Erro de Validação

```json
{
  "error": "Dados inválidos",
  "details": [
    {
      "msg": "Nome deve ter entre 2 e 100 caracteres",
      "param": "name",
      "location": "body"
    }
  ]
}
```

---

## 🎯 Melhores Práticas

### Desenvolvimento

1. ✅ Use `.env` para configurações sensíveis
2. ✅ Nunca comite `.env` no git
3. ✅ Teste os endpoints com ferramentas como Postman ou cURL
4. ✅ Monitore os logs para identificar tentativas de ataque

### Produção

1. ✅ **Use HTTPS** - Configure SSL/TLS no seu servidor
2. ✅ **Secrets Fortes** - Use secrets criptograficamente seguros
3. ✅ **Desabilite Registro de Admin** - Remova `ADMIN_REGISTRATION_SECRET` após setup
4. ✅ **Configure CORS** - Adicione apenas domínios confiáveis em `ALLOWED_ORIGINS`
5. ✅ **Backup do Banco** - Configure backups automáticos do SQLite
6. ✅ **Monitore Logs** - Use ferramentas como Winston, Sentry ou Datadog
7. ✅ **Atualize Dependências** - Rode `npm audit` regularmente
8. ✅ **Firewall** - Configure firewall no servidor (apenas portas necessárias)
9. ✅ **Limite de Conexões** - Configure proxy reverso (Nginx) com rate limiting adicional
10. ✅ **Variáveis de Ambiente Seguras** - Use AWS Secrets Manager, HashiCorp Vault, etc.

### Checklist de Segurança para Deploy

- [ ] `.env` configurado com valores de produção
- [ ] `JWT_SECRET` é um valor forte e único
- [ ] `ADMIN_REGISTRATION_SECRET` está vazio ou removido
- [ ] `ALLOWED_ORIGINS` contém apenas domínios de produção
- [ ] HTTPS está configurado
- [ ] Banco de dados tem backup automático
- [ ] Logs estão sendo monitorados
- [ ] Firewall configurado
- [ ] `npm audit` executado sem vulnerabilidades
- [ ] Senha do admin foi alterada para uma senha forte

---

## 🔧 Exemplo de Uso com cURL

### Criar Lead (Público)

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "whatsapp": "11999999999",
    "city": "São Paulo",
    "level": "Começando do zero",
    "goal": "Morar nos EUA",
    "schedule": "Noites",
    "message": "Quero aprender inglês rápido"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SenhaForte123!"
  }'
```

### Listar Leads (Protegido)

```bash
curl -X GET http://localhost:3000/api/leads \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Atualizar Status de Lead (Protegido)

```bash
curl -X PATCH http://localhost:3000/api/leads/1/status \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "contacted"
  }'
```

---

## 📊 Monitoramento

### Logs Importantes

O servidor registra:
- ✅ Erros de autenticação
- ✅ Tentativas de acesso não autorizadas
- ✅ Violações de rate limit
- ✅ Erros de validação
- ✅ Erros internos do servidor

### Alertas Recomendados

1. **Múltiplas falhas de login** - Possível ataque de força bruta
2. **Rate limit excedido frequentemente** - Possível DDoS
3. **Erros de validação em massa** - Possível tentativa de exploração
4. **Erros 500 frequentes** - Problema no código

---

## 🆘 Suporte

Para reportar vulnerabilidades de segurança, entre em contato pelo GitHub Issues ou email do projeto.

**⚠️ NÃO divulgue vulnerabilidades publicamente sem antes notificar os mantenedores.**

---

## 📝 Changelog de Segurança

### v2.0.0 (Melhorias de Segurança)

- ✅ Adicionado Helmet.js para headers HTTP
- ✅ Implementado autenticação JWT
- ✅ Adicionado rate limiting em 3 níveis
- ✅ Validação robusta de entrada
- ✅ CORS configurável via ambiente
- ✅ Limite de tamanho de requisições
- ✅ Proteção de endpoints sensíveis
- ✅ Hash de senhas com bcrypt
- ✅ Documentação de segurança

---

**🔒 Mantenha este projeto seguro seguindo as práticas recomendadas!**
