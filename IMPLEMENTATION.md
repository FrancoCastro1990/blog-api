# 🚀 Implementation Guide - Frontend Integration

Guía simplificada para integrar tu frontend con el **Blog API** basado en **Arquitectura Hexagonal** y **JWT Authentication**.

## 📋 Configuración Base

### **Base URL**
```
http://localhost:3000
```

### **Tokens y Almacenamiento**
- **Access Token**: Almacenar en `localStorage` como `access_token`
- **Refresh Token**: Almacenar en `localStorage` como `refresh_token`
- **User Data**: Almacenar en `localStorage` como `user_data`

### **Headers Requeridos**
```
Content-Type: application/json
Authorization: Bearer {access_token}
```

---

## 🔑 **Endpoints de Autenticación**

### **1. Login**
- **Endpoint**: `POST /api/auth/login`
- **Auth Required**: ❌

**Request:**
```json
{
  "email": "admin@blog.com",
  "password": "admin123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "673b2f1d...",
      "email": "admin@blog.com",
      "permissions": ["READ_POSTS", "CREATE_POSTS", "ADMIN"],
      "createdAt": "2025-09-12T10:00:00.000Z",
      "updatedAt": "2025-09-12T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": "AUTHENTICATION_FAILED"
}
```

### **2. Refresh Token**
- **Endpoint**: `POST /api/auth/refresh`
- **Auth Required**: ❌

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "message": "Invalid refresh token",
  "error": "INVALID_REFRESH_TOKEN"
}
```

### **3. Logout**
- **Endpoint**: `POST /api/auth/logout`
- **Auth Required**: ✅ Bearer Token

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### **4. Get Current User**
- **Endpoint**: `GET /api/auth/me`
- **Auth Required**: ✅ Bearer Token

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "673b2f1d...",
    "email": "admin@blog.com",
    "permissions": ["READ_POSTS", "CREATE_POSTS", "ADMIN"],
    "createdAt": "2025-09-12T10:00:00.000Z",
    "updatedAt": "2025-09-12T10:00:00.000Z"
  }
}
```

---

## 📝 **Endpoints de Posts**

### **1. Get All Posts**
- **Endpoint**: `GET /api/posts`
- **Auth Required**: ❌ Público

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

---

### **2. Create Post**
- **Endpoint**: `POST /api/posts`
- **Auth Required**: ✅ Bearer Token
- **Permission Required**: `CREATE_POSTS`

**Request:**
```json
{
  "title": "Mi nuevo post",
  "content": "Contenido del post aquí",
  "author": "Admin User"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Mi nuevo post",
  "content": "Contenido del post aquí",
  "author": "Admin User",
  "createdAt": "2025-09-12T01:00:00.000Z",
  "updatedAt": null
}
```

**Error (400 - Validation):**
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

---

### **3. Get Post by ID**
- **Endpoint**: `GET /api/posts/:id`
- **Auth Required**: ❌ Público

**Request URL:**
```
GET /api/posts/64f5a5b8c12f4a001f8b456a
```

**Response (200):**
```json
{
  "id": "64f5a5b8c12f4a001f8b456a",
  "title": "Mi primer post",
  "content": "Contenido del post aquí",
  "author": "Admin User",
  "createdAt": "2025-09-12T01:00:00.000Z",
  "updatedAt": null
}
```

**Error (404):**
```json
{
  "error": "Post not found"
}
```

**Error (400 - Invalid ID):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "id",
      "message": "Invalid MongoDB ObjectId format"
    }
  ]
}
```

---

### **4. Update Post**
- **Endpoint**: `PUT /api/posts/:id`
- **Auth Required**: ✅ Bearer Token
- **Permission Required**: `UPDATE_POSTS`

**Request:**
```json
{
  "title": "Título actualizado",
  "content": "Contenido actualizado del post",
  "author": "Autor actualizado"
}
```

**Nota**: Todos los campos son opcionales. Puedes enviar solo los campos que deseas actualizar.

**Response (200):**
```json
{
  "id": "64f5a5b8c12f4a001f8b456a",
  "title": "Título actualizado",
  "content": "Contenido actualizado del post",
  "author": "Autor actualizado",
  "createdAt": "2025-09-12T01:00:00.000Z",
  "updatedAt": "2025-09-12T01:30:00.000Z"
}
```

**Error (404):**
```json
{
  "error": "Post not found"
}
```

**Error (400 - No fields provided):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "root",
      "message": "At least one field must be provided for update"
    }
  ]
}
```

---

### **5. Delete Post**
- **Endpoint**: `DELETE /api/posts/:id`
- **Auth Required**: ✅ Bearer Token
- **Permission Required**: `DELETE_POSTS`

**Request URL:**
```
DELETE /api/posts/64f5a5b8c12f4a001f8b456a
```

**Response (204):**
```
No Content - Post eliminado exitosamente
```

**Error (404):**
```json
{
  "error": "Post not found"
}
```

**Error (403):**
```json
{
  "error": "Authentication failed",
  "message": "Invalid token"
}
```

---

## 🛠️ **Endpoints Utilitarios**

### **1. Health Check**
- **Endpoint**: `GET /health`
- **Auth Required**: ❌

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-12T01:00:00.000Z",
  "uptime": 123.45
}
```

### **2. API Info**
- **Endpoint**: `GET /`
- **Auth Required**: ❌

**Response (200):**
```json
{
  "name": "Blog API",
  "version": "1.0.0",
  "description": "Hexagonal Architecture Blog API with JWT Authentication",
  "endpoints": {
    "auth": "/api/auth/*",
    "posts": "/api/posts",
    "health": "/health"
  }
}
```

---

## 🔐 **Sistema de Permisos**

### **Permisos Disponibles**
- `READ_POSTS`: Leer posts
- `CREATE_POSTS`: Crear posts
- `UPDATE_POSTS`: Actualizar posts existentes
- `DELETE_POSTS`: Eliminar posts
- `ADMIN`: Acceso administrativo completo

### **Usuario Administrador por Defecto**
- **Email**: `admin@blog.com`
- **Password**: `admin123456`
- **Permisos**: `["READ_POSTS", "CREATE_POSTS", "UPDATE_POSTS", "DELETE_POSTS", "ADMIN"]`

---

## 🔄 **Flujo de Tokens**

### **Token Lifespans**
- **Access Token**: 15 minutos
- **Refresh Token**: 7 días

### **Flujo Automático de Refresh**
1. El frontend detecta un error 401
2. Intenta refresh con el refresh token almacenado
3. Si es exitoso, reintenta el request original
4. Si falla, redirige al login

### **Implementación Básica**
```javascript
// Interceptor para requests
request.interceptor = (config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Interceptor para responses
response.interceptor = async (error) => {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true;
    
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const response = await refreshTokens(refreshToken);
        localStorage.setItem('access_token', response.data.accessToken);
        localStorage.setItem('refresh_token', response.data.refreshToken);
        
        // Retry original request
        return httpClient(error.config);
      } catch (refreshError) {
        // Redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
    }
  }
  return Promise.reject(error);
};
```

---

## 🚨 **Códigos de Error**

### **Autenticación**
- `400` - Datos inválidos
- `401` - Token faltante o inválido
- `403` - Permisos insuficientes

### **Validación**
- `400` - Error de validación con detalles

### **General**
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

### **Estructura de Errores**
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": {} // Opcional
}
```

---

## 🎯 **Casos de Uso Típicos**

### **1. Login Completo**
```
POST /api/auth/login
→ Guardar tokens en localStorage
→ Redirigir a dashboard
→ GET /api/auth/me para cargar datos de usuario
```

### **2. Cargar Posts**
```
GET /api/posts (acceso público)
→ Mostrar lista de posts
→ Sin autenticación requerida
```

### **3. Crear Post**
```
POST /api/posts (con Bearer token)
→ Validar permisos CREATE_POSTS
→ Mostrar formulario solo si tiene permisos
→ Manejar errores de validación
```

### **4. Actualizar Post**
```
GET /api/posts/:id (cargar datos actuales)
→ PUT /api/posts/:id (con Bearer token)
→ Validar permisos UPDATE_POSTS
→ Actualizar solo campos modificados
→ Mostrar mensaje de éxito
```

### **5. Eliminar Post**
```
DELETE /api/posts/:id (con Bearer token)
→ Validar permisos DELETE_POSTS
→ Confirmar eliminación
→ Actualizar lista de posts
→ Manejar caso de post no encontrado
```

### **6. Ver Post Individual**
```
GET /api/posts/:id (acceso público)
→ Mostrar post completo
→ Manejar caso de post no encontrado
→ Sin autenticación requerida
```

### **4. Logout**
```
POST /api/auth/logout (con Bearer token y refresh token)
→ Limpiar localStorage
→ Redirigir a login
```

---

## ⚡ **Tips de Implementación**

### **Token Storage**
```javascript
// Guardar tokens después del login
localStorage.setItem('access_token', accessToken);
localStorage.setItem('refresh_token', refreshToken);
localStorage.setItem('user_data', JSON.stringify(user));

// Verificar autenticación
const isAuthenticated = () => {
  return !!(
    localStorage.getItem('access_token') && 
    localStorage.getItem('refresh_token')
  );
};

// Verificar permisos
const hasPermission = (permission) => {
  const userData = localStorage.getItem('user_data');
  if (!userData) return false;
  
  const user = JSON.parse(userData);
  return user.permissions.includes(permission);
};

// Funciones específicas para posts
const canCreatePosts = () => hasPermission('CREATE_POSTS');
const canUpdatePosts = () => hasPermission('UPDATE_POSTS');
const canDeletePosts = () => hasPermission('DELETE_POSTS');
const isAdmin = () => hasPermission('ADMIN');
```

### **CRUD Operations Helper**
```javascript
const PostAPI = {
  // Obtener todos los posts
  async getAll() {
    const response = await fetch('/api/posts');
    return response.json();
  },

  // Obtener un post específico
  async getById(id) {
    const response = await fetch(`/api/posts/${id}`);
    if (!response.ok) {
      throw new Error(response.status === 404 ? 'Post no encontrado' : 'Error al cargar post');
    }
    return response.json();
  },

  // Crear nuevo post
  async create(postData) {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(postData)
    });
    
    if (!response.ok) {
      throw new Error('Error al crear post');
    }
    return response.json();
  },

  // Actualizar post existente
  async update(id, postData) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(postData)
    });
    
    if (!response.ok) {
      throw new Error(response.status === 404 ? 'Post no encontrado' : 'Error al actualizar post');
    }
    return response.json();
  },

  // Eliminar post
  async delete(id) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(response.status === 404 ? 'Post no encontrado' : 'Error al eliminar post');
    }
    return true; // 204 No Content
  }
};
```

### **Error Handling**
```javascript
const handleApiError = (error) => {
  if (!error.response) {
    return 'Error de conexión';
  }
  
  const { status, data } = error.response;
  
  switch (status) {
    case 400:
      if (data.error === 'VALIDATION_ERROR') {
        return data.details.map(err => `${err.field}: ${err.message}`).join('\n');
      }
      return data.message || 'Datos inválidos';
    
    case 401:
      return 'Necesitas iniciar sesión';
    
    case 403:
      return 'No tienes permisos para esta acción';
    
    default:
      return data.message || 'Error inesperado';
  }
};
```

---

## ✅ **Checklist de Integración**

- [ ] Configurar base URL: `http://localhost:3000`
- [ ] Implementar interceptor de requests para agregar Bearer token
- [ ] Implementar interceptor de responses para refresh automático
- [ ] Manejar storage de tokens en localStorage
- [ ] Implementar verificación de permisos en UI
- [ ] Manejar errores de autenticación y validación
- [ ] Implementar logout completo (backend + localStorage)
- [ ] Proteger rutas según permisos requeridos
- [ ] Testear flujo completo: login → uso → refresh → logout

### **CRUD Posts Checklist**
- [ ] Implementar listado de posts (`GET /api/posts`)
- [ ] Implementar vista individual de post (`GET /api/posts/:id`)
- [ ] Implementar formulario de creación (`POST /api/posts`) con validación de permisos
- [ ] Implementar formulario de edición (`PUT /api/posts/:id`) con validación de permisos
- [ ] Implementar eliminación (`DELETE /api/posts/:id`) con confirmación y validación de permisos
- [ ] Manejar estados de carga, error y éxito para cada operación
- [ ] Validar campos requeridos en frontend antes de enviar
- [ ] Implementar navegación entre lista ↔ detalle ↔ edición
- [ ] Mostrar/ocultar botones de acciones según permisos del usuario
- [ ] Testear todos los flujos con diferentes niveles de permisos

**¡Listo para integrar CRUD completo! 🚀**