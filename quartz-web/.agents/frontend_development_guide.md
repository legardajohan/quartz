# Guía de Desarrollo del Frontend para Academic Quartz

## Rol: Sr. Software Engineer

Esta documentación técnica está dirigida a los nuevos desarrolladores que se incorporen al equipo de Academic Quartz. Su objetivo es explicar de forma concisa y clara el funcionamiento del sistema de autenticación y la gestión de la sesión en el frontend de la aplicación.

---

## Sistema de Autenticación y Gestión de Sesión

El manejo de la sesión es una pieza central de nuestra aplicación. Para mantenerlo robusto, predecible y fácil de usar, hemos centralizado la lógica en dos archivos clave.

### Componentes Principales

1.  **`features/auth/useAuthStore.ts` (Store Global de Zustand)**
    *   **Responsabilidad:** Es nuestra "única fuente de la verdad" para todo lo relacionado con el estado de la sesión del usuario.
    *   **Contenido:** Almacena el `token` de autenticación y la `sessionData` (que incluye datos del usuario, periodos académicos, materias asignadas, etc.).
    *   **Tecnología:** Utiliza **Zustand**, una librería de manejo de estado minimalista para React. Hemos configurado `zustand/persist` para guardar automáticamente el token y la sesión en el `localStorage` del navegador, permitiendo que la sesión del usuario persista entre recargas de la página.

2.  **`api/apiClient.ts` (Instancia Centralizada de Axios)**
    *   **Responsabilidad:** Es el corazón de la comunicación con nuestra API backend. **Toda** petición HTTP al servidor debe pasar por este cliente.
    *   **Tecnología:** Utiliza **Axios**, un cliente HTTP basado en promesas. Lo hemos configurado con interceptores para automatizar el manejo del token y los errores comunes.

---

### El Flujo de Autenticación (La Magia)

La verdadera fortaleza de este sistema es que es casi completamente automático para el desarrollador. Una vez que el usuario inicia sesión, no necesitas preocuparte por adjuntar el token en cada petición ni por manejar manualmente la expiración de la sesión.

#### 1. Envío de Petición (Interceptor de Peticiones)

Cuando realizas una llamada a la API (p. ej. `apiGet('/my-courses')`), ocurre lo siguiente de forma automática:

1.  El interceptor de peticiones de `apiClient.ts` se activa.
2.  Llama a `useAuthStore.getState().token` para obtener el token más reciente directamente desde el store de Zustand.
3.  Inyecta este token en la cabecera `Authorization` de la petición como un `Bearer Token`.
4.  La petición se envía al backend con la cabecera de autenticación ya incluida.

```typescript
// Dentro de apiClient.ts
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  // ...
);
```

#### 2. Manejo de Sesión Expirada (Interceptor de Respuestas)

Si el token ha expirado o es inválido, el backend devolverá un error `401 Unauthorized`. Nuestro interceptor de respuestas está preparado para ello:

1.  El interceptor de respuestas de `apiClient.ts` detecta una respuesta con código de estado `401`.
2.  Automáticamente, llama a la acción `useAuthStore.getState().logout()`.
3.  La acción `logout()` limpia el `token` y la `sessionData` del store de Zustand y del `localStorage`.
4.  El usuario es efectivamente deslogueado y, gracias a nuestros componentes de rutas protegidas, será redirigido a la página de login.

```typescript
// Dentro de apiClient.ts
apiClient.interceptors.response.use(
  // ...
  (error) => {
    if (error.response?.status === 401) {
      console.warn('🚫 Unauthorized (401) - Token inválido o expirado. Cerrando sesión...');
      useAuthStore.getState().logout(); // ¡Magia!
    }
    return Promise.reject(error);
  }
);
```

---

### Guía de Uso para Desarrolladores

Gracias a la automatización, interactuar con la API y el estado de la sesión es muy sencillo.

#### Realizar una Petición a un Endpoint Protegido

Simplemente importa una de las funciones `api*` desde `apiClient.ts` y úsala. No necesitas hacer nada más.

```tsx
import { apiGet } from '../../api/apiClient';
import { useEffect, useState } from 'react';

const CoursesComponent = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // El token se adjuntará automáticamente
        const data = await apiGet('/learning/my-courses');
        setCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);

  return (
    // ... renderiza los cursos
  );
};
```

#### Acceder a los Datos de la Sesión en un Componente

Usa el hook `useAuthStore` directamente en tus componentes de React para acceder al estado de la sesión o a las acciones del store.

```tsx
import { useAuthStore } from '../../features/auth/useAuthStore';

const ProfileHeader = () => {
  // Accede a los datos de la sesión directamente desde el store
  const sessionData = useAuthStore((state) => state.sessionData);
  const logout = useAuthStore((state) => state.logout);

  if (!sessionData) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <h1>Bienvenido, {sessionData.user.firstName}</h1>
      <p>Tu rol es: {sessionData.user.role}</p>
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  );
};
```
