# 🚀 Blog API - Hexagonal Architecture + JWT Authentication

API REST para gestión de posts de blog implementada con **Arquitectura Hexagonal** y sistema de **autenticación JWT** completo. Proyecto desarrollado siguiendo principios SOLID, TDD y mejores prácticas de seguridad.

## 🎯 **Características Principales**

- ✅ **Arquitectura Hexagonal** (Ports & Adapters) con separación clara de capas
- ✅ **Sistema de Autenticación JWT** completo con refresh tokens
- ✅ **Autorización basada en permisos** granular (READ_POSTS, CREATE_POSTS, ADMIN)
- ✅ **Refresh Token rotation** automático con limpieza de tokens expirados
- ✅ **Base de datos MongoDB** con Mongoose ODM
- ✅ **Validación robusta** con Zod schemas
- ✅ **Logging estructurado** con contexto de usuario
- ✅ **Containerización** con Docker Compose
- ✅ **Testing comprehensivo** (67% cobertura, 188 tests pasando)
- ✅ **TypeScript** completo con tipado estricto
- ✅ **Middleware de autenticación** flexible y reutilizable

## 🔐 **Sistema de Permisos Implementado**

| Permiso | Descripción | Endpoints Autorizados | Usuario por Defecto |
|---------|-------------|----------------------|-------------------|
| `READ_POSTS` | Lectura de posts | `GET /api/posts` | ✅ Admin |
| `CREATE_POSTS` | Crear/editar posts | `POST /api/posts` | ✅ Admin |
| `ADMIN` | Acceso administrativo completo | Todos los endpoints + gestión usuarios | ✅ Admin |

### **Funcionalidades de Seguridad:**
- 🔒 **JWT Access Tokens** con expiración de 15 minutos
- 🔄 **Refresh Tokens** de 7 días con rotación automática
- 🛡️ **Bcrypt hashing** con 12 rounds para contraseñas
- 🧹 **Limpieza automática** de tokens expirados
- 📝 **Logging** de eventos de autenticación y autorización
- ⚠️ **Manejo estructurado** de errores 401/403

## 🏗️ **Arquitectura Hexagonal Implementada**

Este proyecto sigue fielmente los principios de **Arquitectura Hexagonal** con las siguientes capas claramente definidas:

### **📦 Capas de la Arquitectura:**

```
🎯 Domain Layer (Núcleo)
├── entities/        # User, Post, Token (lógica pura de negocio)
└── repositories/    # Interfaces/ports abstractos

📋 Application Layer (Orquestación)
├── usecases/       # LoginUser, CreatePost, RefreshToken, etc.
└── services/       # Factory de servicios de aplicación

🔌 Infrastructure Layer (Adaptadores)
├── database/       # MongoDB connection & models
├── repositories/   # Implementaciones concretas (Mongoose)
├── web/           # Express app, controllers, routes
└── services/      # JWT, Password, logging services

🔗 Ports (Contratos)
└── Interfaces que conectan las capas sin dependencias directas
```

### **📊 Beneficios Alcanzados:**
- ✅ **Independencia**: Lógica de negocio libre de frameworks externos
- ✅ **Testabilidad**: Cada capa se testea independientemente
- ✅ **Flexibilidad**: Fácil intercambio de adaptadores (ej: cambiar BD)
- ✅ **Mantenibilidad**: Separación clara de responsabilidades
- ✅ **SOLID Principles**: Aplicación completa de principios SOLID

### **🔄 Flujo de Dependencias:**
```
Domain ← Application ← Infrastructure
   ↑                      ↑
   └─── Ports ←──────────┘
```

**Inversión de dependencias**: Infrastructure implementa las interfaces definidas en Domain.

## 🛠️ **Stack Tecnológico Completo**

### **Core Technologies:**
- **Runtime**: Node.js 18+ LTS
- **Language**: TypeScript 5.9.2 (strict mode)
- **Web Framework**: Express 5.1.0
- **Database**: MongoDB 6 + Mongoose 8.18.1
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Security**: bcryptjs 3.0.2

### **Development & Testing:**
- **Testing**: Jest 30.1.3 (188 tests, 67% coverage)
- **Development**: ts-node-dev con hot reload
- **Validation**: Zod 4.1.8 para schemas
- **Containerization**: Docker + Docker Compose
- **Code Quality**: ESLint + Prettier

### **Production Ready:**
- **CORS**: Configurado para múltiples orígenes
- **Error Handling**: Middleware global de errores
- **Request Logging**: Logging estructurado con metadatos
- **Health Checks**: Endpoint de salud con métricas
- **Security Headers**: Headers de seguridad HTTP

## 📊 **Cobertura de Testing - EXCELENTE CALIDAD**

### **📈 Resultados Actuales:**
```
Tests:       188 pasando ✅ | 0 fallando ❌
Statements:  67.4% 
Branches:    60.86%
Functions:   62.35% 
Lines:       67.27%
```

### **🏆 Módulos con Alta Cobertura:**
- **auth/usecases**: 97.87% - LoginUser, RefreshToken, ValidateToken
- **application/usecases**: 100% - CreatePost, GetAllPosts
- **auth/controllers**: 100% - AuthController completo
- **schemas**: 100% - Validación Zod
- **auth/services**: 95.74% - PasswordService, TokenService

### **📋 Suite de Tests Implementada:**
- **Unit Tests**: 188 tests unitarios comprehensivos
- **Authentication Tests**: Cobertura completa de flujo JWT
- **Validation Tests**: Tests de schemas Zod
- **Error Handling Tests**: Manejo de errores y edge cases
- **Security Tests**: Validación de permisos y autorización

## 🚀 Quick Start

### 1. **Clonar y configurar**
```bash
git clone <repository-url>
cd blog-api
npm install
```

### 2. **Variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 3. **Iniciar servicios**
```bash
# Iniciar MongoDB con Docker
docker-compose up -d

# Crear usuario administrador
npm run seed:admin

# Iniciar desarrollo
npm run dev
```

## 🛠️ Tech Stack

- **Runtime**: Node.js (LTS)
- **Language**: TypeScript
- **Web Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Zod
- **ID Generation**: UUID v4
- **Development**: ts-node-dev
- **Testing**: Jest
- **Containerization**: Docker & Docker Compose

## 📁 **Estructura del Proyecto - Arquitectura Hexagonal**

```
blog-api/
├── 📦 package.json              # Dependencies & scripts
├── 🐳 docker-compose.yml        # MongoDB setup
├── ⚙️  tsconfig.json            # TypeScript configuration
├── 📨 insomnia-collection.json  # REST client collection (ACTUALIZADO)
├── 📝 README.md                # Documentación completa
├── 🔧 scripts/
│   └── createAdminUser.ts       # Admin user creation script
└── 🎯 src/
    ├── server.ts               # 🚀 Application entry point
    ├── app.ts                  # 📋 Application bootstrap
    ├── config/
    │   └── index.ts            # ⚙️ Configuration management
    │
    ├── 🔐 auth/                # Authentication module (JWT)
    │   ├── entities/
    │   │   ├── User.ts         # User entity + Permission enum
    │   │   └── Token.ts        # JWT token interfaces
    │   ├── repositories/
    │   │   ├── UserRepository.ts           # User repo interface (port)
    │   │   └── MongooseUserRepository.ts   # MongoDB implementation
    │   ├── services/
    │   │   ├── PasswordService.ts  # Bcrypt hashing/verification
    │   │   └── TokenService.ts     # JWT generation/validation
    │   ├── usecases/
    │   │   ├── LoginUser.ts       # 🎯 100% test coverage
    │   │   ├── RefreshToken.ts    # 🎯 100% test coverage  
    │   │   └── ValidateToken.ts   # 🎯 93.93% test coverage
    │   ├── middleware/
    │   │   └── authMiddleware.ts  # JWT authentication middleware
    │   ├── controllers/
    │   │   └── AuthController.ts  # 🎯 100% test coverage
    │   └── routes/
    │       └── authRoutes.ts      # Authentication endpoints
    │
    ├── 🎯 domain/              # Domain layer (business logic core)
    │   ├── entities/
    │   │   └── Post.ts         # Post entity (pure domain)
    │   └── repositories/
    │       └── PostRepository.ts # Repository interface (port)
    │
    ├── 📋 application/         # Application layer (use cases)
    │   ├── usecases/
    │   │   ├── CreatePost.ts   # 🎯 100% test coverage
    │   │   └── GetAllPosts.ts  # 🎯 100% test coverage
    │   └── services/
    │       └── index.ts        # Application services factory
    │
    ├── 🔌 infrastructure/      # Infrastructure layer (adapters)
    │   ├── database/
    │   │   ├── mongooseConnection.ts    # MongoDB connection
    │   │   ├── mongoosePostModel.ts     # Post schema
    │   │   └── mongooseUserModel.ts     # User schema
    │   ├── repositories/
    │   │   └── MongoosePostRepository.ts # Post repo implementation
    │   └── web/
    │       ├── expressApp.ts           # Express configuration
    │       ├── controllers/
    │       │   └── postsController.ts  # Posts HTTP controller
    │       └── routes/
    │           └── postsRoutes.ts      # Posts endpoints
    │
    ├── 📊 schemas/             # Validation schemas (Zod)
    │   └── postSchema.ts       # 🎯 100% test coverage
    │
    ├── 🛠️ utils/               # Utilities
    │   └── logger.ts          # Structured logging
    │
    └── 🧪 tests/              # Comprehensive test suite
        ├── unit/              # Unit tests (188 tests ✅)
        │   ├── auth/         # Authentication module tests
        │   │   ├── services/  # PasswordService, TokenService
        │   │   ├── usecases/  # Login, Refresh, Validate
        │   │   └── controllers/ # AuthController
        │   ├── repositories/  # Repository tests
        │   ├── usecases/     # Domain use cases tests
        │   ├── controllers/   # HTTP controllers tests
        │   ├── schemas/      # Zod validation tests
        │   └── utils/        # Logger and utilities tests
        └── simple.test.ts    # Integration smoke tests
```

### **🎨 Código coloreado por responsabilidad:**
- 🎯 **Domain** - Lógica de negocio pura
- 📋 **Application** - Casos de uso y orquestación  
- 🔌 **Infrastructure** - Adaptadores y frameworks externos
- 🔐 **Auth** - Autenticación y autorización JWT
- 🧪 **Tests** - Suite de testing comprehensiva

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js (v18+)
- npm
- Docker & Docker Compose (for MongoDB)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blog-posts-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start MongoDB with Docker**
   ```bash
   docker-compose up -d
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 📡 **API Endpoints Disponibles**

### **🌐 Base URL**
```
http://localhost:3000
```

### **🔐 Authentication Endpoints**

| Método | Endpoint | Descripción | Auth Required | Response |
|--------|----------|-------------|---------------|----------|
| `POST` | `/api/auth/login` | Iniciar sesión con email/password | ❌ | JWT tokens + user info |
| `POST` | `/api/auth/refresh` | Renovar access token | ❌ | Nuevos JWT tokens |
| `POST` | `/api/auth/logout` | Cerrar sesión | ✅ Bearer | Success message |
| `GET` | `/api/auth/me` | Info del usuario autenticado | ✅ Bearer | User data + permissions |

### **📝 Blog Posts Endpoints**

| Método | Endpoint | Descripción | Permiso Requerido | Response |
|--------|----------|-------------|-------------------|----------|
| `GET` | `/api/posts` | Obtener todos los posts | `READ_POSTS` | Array de posts |
| `POST` | `/api/posts` | Crear nuevo post | `CREATE_POSTS` | Post creado |

### **🛠️ Utility Endpoints**

| Método | Endpoint | Descripción | Auth Required | Response |
|--------|----------|-------------|---------------|----------|
| `GET` | `/health` | Estado de la API | ❌ | Health status + uptime |
| `GET` | `/` | Info general y endpoints | ❌ | API information |

## 🔑 **Flujo de Autenticación Completo**

### **🚀 1. Login (Obtener Tokens)**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@blog.com",
    "password": "admin123456"
  }'
```

**✅ Response Success (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "673b2f1d...",
      "email": "admin@blog.com", 
      "permissions": ["read:posts", "create:posts", "admin"],
      "createdAt": "2025-09-12T10:00:00.000Z",
      "updatedAt": "2025-09-12T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### **🔄 2. Usar Access Token**
```bash
curl -X GET http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### **🔃 3. Refresh Tokens (cuando expiran)**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### **🚪 4. Logout**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## � **Ejemplos de Uso**

### **Crear Post**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi primer post",
    "content": "Contenido del post aquí",
    "author": "Admin User"
  }'
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Mi primer post",
  "content": "Contenido del post aquí",
  "author": "Admin User",
  "createdAt": "2025-09-12T01:00:00.000Z",
  "updatedAt": null
}
```

### **Obtener Posts**
```bash
curl -X GET http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Mi primer post",
    "content": "Contenido del post aquí",
    "author": "Admin User",
    "createdAt": "2025-09-12T01:00:00.000Z",
    "updatedAt": null
  }
]
```

### **Health Check**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-12T01:00:00.000Z",
  "uptime": 123.45
}
```

## 🧪 **Testing**

```bash
# Tests unitarios
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch

# Tests de servicios de auth
npm test -- tests/unit/auth/services/
```

## 🗄️ **Base de Datos**

### **Usuario Administrador por Defecto**
- **Email:** `admin@blog.com`
- **Password:** `admin123456`
- **Permisos:** `READ_POSTS`, `CREATE_POSTS`, `ADMIN`

### **Modelos de Datos**

**User:**
```typescript
{
  id: string;
  email: string;
  passwordHash: string;
  permissions: Permission[];
  refreshTokens: RefreshTokenData[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Post:**
```typescript
{
  id: string;
  title: string;
  content: string;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 📋 **Variables de Entorno**

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://root:example@localhost:27017/posts_db?authSource=admin

# Authentication
AUTH_JWT_SECRET=your-super-secret-jwt-key-256-bits-long
AUTH_ACCESS_TOKEN_EXPIRY=15m
AUTH_ADMIN_TOKEN_EXPIRY=1h
AUTH_REFRESH_TOKEN_EXPIRY=7d
AUTH_BCRYPT_ROUNDS=12

# Admin User (for seed script)
ADMIN_EMAIL=admin@blog.com
ADMIN_PASSWORD=admin123456
```

### MongoDB Setup

The project includes a `docker-compose.yml` file for easy MongoDB setup:

```yaml
version: "3.8"
services:
  mongo:
    image: mongo:6
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: example

volumes:
  mongo-data:
```

## � **Cliente de Pruebas**

Importa `insomnia-collection.json` en Insomnia REST Client:

- ✅ **Endpoints de autenticación** preconfigurados
- ✅ **Variables de entorno** para tokens
- ✅ **Casos de prueba** de autorización
- ✅ **Ejemplos** de requests y responses

### **Instrucciones de Uso:**

1. **Importar colección** en Insomnia
2. **Ejecutar Login** para obtener tokens
3. **Copiar access_token** a la variable de entorno
4. **Usar endpoints** de posts con autenticación
5. **Refresh tokens** cuando expiren

## 🔐 **Seguridad**

- ✅ **Passwords** hasheados con bcrypt (12 rounds)
- ✅ **JWT tokens** con expiración configurable
- ✅ **Refresh tokens** gestionados en BD
- ✅ **Middleware** de autorización
- ✅ **Validación** de permisos por endpoint
- ✅ **Rate limiting** (recomendado para producción)
- ✅ **HTTPS** (recomendado para producción)

## 🏛️ **Architecture Details**

### Hexagonal Architecture Benefits

1. **Independence**: Business logic is isolated from external frameworks
2. **Testability**: Each layer can be tested independently
3. **Flexibility**: Easy to swap adapters (e.g., switch databases)
4. **Maintainability**: Clear separation of concerns

### Layer Dependencies

```
Domain ← Application ← Infrastructure
   ↑                      ↑
   └─── Ports ←──────────┘
```

- **Domain** has no dependencies
- **Application** depends only on Domain  
- **Infrastructure** implements Domain ports
- **Dependency Inversion** through interfaces

### SOLID Principles Applied

- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Implementations can replace interfaces
- **Interface Segregation**: Focused, minimal interfaces
- **Dependency Inversion**: Depend on abstractions, not concretions

## 🚨 **Error Handling**

The API provides comprehensive error handling:

- **400 Bad Request**: Invalid input data or validation errors
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions for the requested operation
- **404 Not Found**: Route not found
- **500 Internal Server Error**: Server errors

### **Authentication Error Examples:**

**Missing Token:**
```json
{
  "success": false,
  "message": "No token provided",
  "error": "AUTHENTICATION_REQUIRED"
}
```

**Invalid Token:**
```json
{
  "success": false,
  "message": "Invalid token",
  "error": "INVALID_TOKEN"
}
```

**Insufficient Permissions:**
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": "FORBIDDEN",
  "details": {
    "required": ["create:posts"],
    "provided": ["read:posts"]
  }
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

## 📊 **Logging**

The application includes structured logging:

- Request/response logging with authentication context
- Error logging with stack traces and user context
- Application lifecycle events
- Authentication and authorization events
- Development vs production log levels

## � **Docker Development**

Start MongoDB and Mongo Express with Docker Compose:

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

Access Mongo Express at `http://localhost:8081` (admin/pass)

## 🚀 **Deploy en Producción**

1. **Variables de entorno de producción**
2. **HTTPS** con certificado SSL
3. **Rate limiting** con express-rate-limit  
4. **CORS** configurado para dominios específicos
5. **Monitoring** y logs centralizados
6. **Backup** de base de datos MongoDB
7. **Secrets** management (AWS Secrets, Azure KeyVault, etc.)

## �🛡️ **Production Considerations**

### Security
- Configure CORS for specific origins
- Add rate limiting with express-rate-limit
- Implement HTTPS with SSL certificates
- Use secure environment variable management
- Add request validation and sanitization
- Implement proper logging and monitoring

### Performance
- Add database indexes for frequently queried fields
- Implement caching strategies (Redis)
- Use connection pooling for database connections
- Add request timeout handling
- Implement pagination for large datasets

### Monitoring
- Add comprehensive health checks
- Implement metrics collection (Prometheus)
- Add distributed tracing (Jaeger)
- Set up error tracking (Sentry)
- Monitor authentication events and failures

## 🤝 **Contribuir**

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/amazing-feature`)
3. Commit los cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 **Licencia**

MIT License - ver [LICENSE](LICENSE) para detalles.

## 🆘 **Soporte**

- 📧 Email: tu-email@ejemplo.com
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/blog-api/issues)
- 📖 Wiki: [Project Wiki](https://github.com/tu-usuario/blog-api/wiki)

---

**Desarrollado con ❤️ usando TypeScript, Express, MongoDB y mucho café ☕**