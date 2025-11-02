# 🔐 Encriptación de Datos Sensibles en Empresas

## Descripción

Los datos fiscales y sensibles de la tabla `empresas` están protegidos mediante encriptación automática usando PostgreSQL pgcrypto.

### Campos Encriptados:
- **RFC** (registro federal de contribuyentes)
- **Razón Social** (nombre legal de la empresa)
- **Dirección Fiscal** (domicilio fiscal)

## Cómo Funciona

### Encriptación Automática
Cuando se inserta o actualiza un registro en la tabla `empresas`, un trigger automáticamente:
1. Toma los datos sensibles (RFC, razón social, dirección fiscal)
2. Los encripta usando `pgp_sym_encrypt` con una clave única
3. Almacena los datos encriptados en columnas `*_encrypted`
4. Reemplaza el valor original con `***ENCRYPTED***`

### Acceso Controlado
Solo pueden ver datos desencriptados:
- ✅ El usuario que creó la empresa
- ✅ Los administradores de la empresa (con rol `admin_empresa`)
- ✅ Los administradores de la plataforma (con rol `admin`)

## Cómo Acceder a Datos Desencriptados

### Desde el Frontend (React/TypeScript)

```typescript
import { supabase } from "@/integrations/supabase/client";

// Obtener datos desencriptados de una empresa
const fetchDecryptedCompanyData = async (empresaId: string) => {
  const { data, error } = await supabase
    .rpc('get_empresa_decrypted', { empresa_id: empresaId });

  if (error) {
    console.error('Error:', error.message);
    return null;
  }

  // data contiene:
  // - id
  // - nombre_empresa
  // - rfc_decrypted
  // - razon_social_decrypted
  // - direccion_fiscal_decrypted
  // - email_contacto
  // - telefono_contacto
  
  return data[0];
};
```

### Desde SQL

```sql
-- Obtener datos desencriptados
SELECT * FROM get_empresa_decrypted('uuid-de-la-empresa');
```

## Auditoría

Se registra un log de auditoría cada vez que se acceden a datos sensibles en la tabla `auditoria_acceso_empresas`:
- Usuario que accedió
- Empresa consultada
- Acción realizada
- Timestamp
- IP address (si está disponible)
- User agent (si está disponible)

### Ver Auditoría (Solo Admins de Plataforma)

```sql
SELECT * FROM auditoria_acceso_empresas
WHERE empresa_id = 'uuid-de-la-empresa'
ORDER BY timestamp DESC;
```

## Capas de Seguridad Implementadas

### 1. Encriptación en Reposo
- Datos sensibles encriptados usando pgcrypto
- Clave de encriptación única por instalación
- Algoritmo: PGP symmetric encryption

### 2. Control de Acceso por RLS
- Políticas estrictas en Row Level Security
- Solo usuarios verificados pueden crear empresas
- Solo admins de empresa pueden actualizar

### 3. Verificación de Email Obligatoria
- Solo usuarios con email confirmado pueden crear empresas
- Previene cuentas automatizadas maliciosas

### 4. Auditoría Completa
- Log de todos los accesos a datos sensibles
- Trazabilidad completa para compliance
- Solo visible para admins de plataforma

### 5. Función de Desencriptación Protegida
- `SECURITY DEFINER` function
- Verifica autorización antes de desencriptar
- Lanza excepción si el usuario no está autorizado

## Notas Importantes

⚠️ **IMPORTANTE**: Los campos `rfc`, `razon_social` y `direccion_fiscal` en la tabla siempre mostrarán `***ENCRYPTED***`. Usa la función `get_empresa_decrypted()` para obtener los valores reales.

⚠️ **SEGURIDAD**: Nunca exponer datos desencriptados en APIs públicas o logs del cliente. Siempre validar autorización antes de mostrar.

⚠️ **PERFORMANCE**: La desencriptación tiene un costo computacional. Cachea los resultados cuando sea posible.
