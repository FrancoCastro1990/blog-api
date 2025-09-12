# Blog Posts API

A REST API for personal blog posts built with Node.js, TypeScript, Express, and MongoDB using **Hexagonal Architecture** (Ports & Adapters pattern). This project follows **SOLID**, **DRY**, and **KISS** principles to ensure clean, maintainable, and scalable code.

## 🏗️ Architecture

This project implements Hexagonal Architecture with the following layers:

- **Domain Layer**: Core business logic and entities (framework-agnostic)
- **Application Layer**: Use cases that orchestrate domain logic
- **Infrastructure Layer**: External adapters (database, web framework, etc.)
- **Ports**: Abstract contracts/interfaces between layers

## 🚀 Features

- ✅ Create blog posts with title, content, and optional author
- ✅ Retrieve all blog posts sorted by creation date
- ✅ Input validation with Zod schemas
- ✅ MongoDB persistence with Mongoose
- ✅ UUID-based post identification
- ✅ Comprehensive error handling
- ✅ Request logging
- ✅ Health check endpoint
- ✅ CORS support
- ✅ Graceful shutdown

## 🛠️ Tech Stack

- **Runtime**: Node.js (LTS)
- **Language**: TypeScript
- **Web Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Validation**: Zod
- **ID Generation**: UUID v4
- **Development**: ts-node-dev
- **Containerization**: Docker & Docker Compose

## 📁 Project Structure

```
/
├── package.json              # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── docker-compose.yml       # MongoDB setup
├── .env.example            # Environment variables template
├── src/
│   ├── server.ts           # Application entry point
│   ├── app.ts              # Application bootstrap
│   ├── config/
│   │   └── index.ts        # Configuration management
│   ├── domain/             # Domain layer (business logic)
│   │   ├── entities/
│   │   │   └── Post.ts     # Post entity
│   │   └── repositories/
│   │       └── PostRepository.ts # Repository interface
│   ├── application/        # Application layer (use cases)
│   │   ├── usecases/
│   │   │   ├── CreatePost.ts
│   │   │   └── GetAllPosts.ts
│   │   └── services/
│   │       └── index.ts    # Application services factory
│   ├── infrastructure/     # Infrastructure layer (adapters)
│   │   ├── database/
│   │   │   ├── mongooseConnection.ts
│   │   │   └── mongoosePostModel.ts
│   │   ├── repositories/
│   │   │   └── MongoosePostRepository.ts
│   │   └── web/
│   │       ├── expressApp.ts
│   │       ├── controllers/
│   │       │   └── postsController.ts
│   │       └── routes/
│   │           └── postsRoutes.ts
│   ├── schemas/            # Validation schemas
│   │   └── postSchema.ts
│   └── utils/              # Utilities
│       └── logger.ts
└── README.md
```

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

## 📡 API Endpoints

### Base URL
```
http://localhost:3000
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-12T01:00:00.000Z",
  "uptime": 123.45
}
```

### Create Post
```http
POST /api/posts
Content-Type: application/json

{
  "title": "My first post",
  "content": "Learning Hexagonal Architecture with TypeScript",
  "author": "Franco"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My first post",
  "content": "Learning Hexagonal Architecture with TypeScript",
  "author": "Franco",
  "createdAt": "2025-09-12T01:00:00.000Z",
  "updatedAt": null
}
```

### Get All Posts
```http
GET /api/posts
```

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "My first post",
    "content": "Learning Hexagonal Architecture with TypeScript",
    "author": "Franco",
    "createdAt": "2025-09-12T01:00:00.000Z",
    "updatedAt": null
  }
]
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3000
MONGO_URI=mongodb://root:example@localhost:27017/posts_db?authSource=admin
NODE_ENV=development
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

## 🧪 Testing the API

### Using curl

**Create a post:**
```bash
curl -X POST http://localhost:3000/api/posts \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Test Post",
    "content": "This is a test post content",
    "author": "Test Author"
  }'
```

**Get all posts:**
```bash
curl http://localhost:3000/api/posts
```

### Using a REST Client

You can also use tools like Postman, Insomnia, or the REST Client extension in VS Code.

## 🔍 Validation Rules

### Create Post Validation

- `title`: Required, string, 1-200 characters
- `content`: Required, string, minimum 1 character
- `author`: Optional, string, maximum 100 characters

## 🐳 Docker Support

### MongoDB Only (Recommended)
```bash
docker-compose up -d
```

This starts only MongoDB, allowing you to run the Node.js app locally for development.

## 📝 Content Format Support

The API supports any text content format in the `content` field, including:

- **Plain text**
- **Markdown** - Store markdown content and render it on the frontend
- **HTML** - If needed for rich formatting

The `content` field is stored as a string, making it flexible for different content types.

## 🏛️ Architecture Details

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

## 🚨 Error Handling

The API provides comprehensive error handling:

- **400 Bad Request**: Invalid input data
- **404 Not Found**: Route not found
- **500 Internal Server Error**: Server errors

Example error response:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

## 📊 Logging

The application includes structured logging:

- Request/response logging
- Error logging with stack traces
- Application lifecycle events
- Development vs production log levels

## 🛡️ Production Considerations

### Security
- Configure CORS for specific origins
- Add rate limiting
- Implement authentication/authorization
- Use HTTPS
- Validate environment variables

### Performance
- Add database indexes
- Implement caching
- Use connection pooling
- Add request timeout handling

### Monitoring
- Add health checks
- Implement metrics collection
- Add distributed tracing
- Set up error tracking

## 🤝 Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Follow commit message conventions

## 📄 License

MIT License - see LICENSE file for details.