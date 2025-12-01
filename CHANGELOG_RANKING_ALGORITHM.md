# Cambio de Algoritmo de Ranking - Índice de Productividad

## Resumen del Cambio

Hemos actualizado el algoritmo de ranking de reclutadores de un sistema basado en resta a un **Índice de Productividad** basado en división.

## Algoritmos

### Anterior (Obsoleto)
```
Score = (Vacantes Cerradas × 100) - (Promedio de Días × 0.5)
```

**Problemas:**
- Priorizaba excesivamente el volumen sobre la velocidad
- Los números mágicos (100 y 0.5) no tenían justificación clara
- No reflejaba verdadera productividad (vacantes por tiempo)

### Nuevo (Actual)
```
Índice = (Vacantes Cerradas / Promedio de Días) × 100
```

**Ventajas:**
- Mide productividad real: vacantes cerradas por unidad de tiempo
- Más vacantes en menos tiempo = mejor índice
- Fácil de entender: "cerré X vacantes en Y días promedio"
- Escalado ×100 para legibilidad

## Casos Especiales

| Situación | Vacantes | Días Prom | Índice | Lógica |
|-----------|----------|-----------|--------|---------|
| Sin actividad | 0 | cualquier | 0 | Sin vacantes = sin score |
| Cierre teórico instantáneo | >0 | 0 o NULL | vacantes × 10000 | Evita división por 0 |
| Normal | 3 | 12 | 25.00 | (3/12) × 100 |
| Alto volumen rápido | 15 | 10 | 150.00 | Mejor productividad |
| Bajo volumen lento | 2 | 30 | 6.67 | Menor productividad |

## Archivos Modificados

### Frontend
- ✅ `src/components/dashboard/GlobalLeaderboardModal.tsx`
  - Actualizada descripción del diálogo
  - Cambiado header de "Score" a "Índice"
  - Actualizado footer con nueva fórmula
  - Agregado tooltip explicativo

### Backend
- ⏳ `MIGRATION_RANKING_ALGORITHM.sql` (REQUIERE EJECUCIÓN MANUAL)
  - Función `get_reclutador_ranking()` actualizada
  - Nuevo algoritmo con documentación inline
  - Manejo de casos edge documentado

## Publicación de Resultados

Los rankings se calculan y publican **mensualmente** con los datos del mes anterior:
- **Noviembre 2024**: Muestra datos de Octubre 2024
- **Diciembre 2024**: Muestra datos de Noviembre 2024
- Y así sucesivamente...

## Ejemplos Comparativos

### Reclutador A: Alto Volumen, Velocidad Media
- Vacantes cerradas: 20
- Promedio de días: 25
- **Algoritmo anterior**: (20 × 100) - (25 × 0.5) = 1987.5
- **Nuevo algoritmo**: (20 / 25) × 100 = **80.00**

### Reclutador B: Bajo Volumen, Alta Velocidad
- Vacantes cerradas: 5
- Promedio de días: 8
- **Algoritmo anterior**: (5 × 100) - (8 × 0.5) = 496
- **Nuevo algoritmo**: (5 / 8) × 100 = **62.50**

### Reclutador C: Alto Volumen, Baja Velocidad
- Vacantes cerradas: 30
- Promedio de días: 45
- **Algoritmo anterior**: (30 × 100) - (45 × 0.5) = 2977.5
- **Nuevo algoritmo**: (30 / 45) × 100 = **66.67**

## Impacto en el Ranking

Con el nuevo algoritmo:
- Reclutadores eficientes (menos días) suben posiciones
- Reclutadores lentos (más días) bajan posiciones, incluso con alto volumen
- El balance volumen/velocidad es más equitativo

## Escalabilidad Futura

El código está diseñado para permitir:

1. **Agregar metas**:
```sql
-- Futuro: comparar contra meta
CASE WHEN vacantes_cerradas >= meta_vacantes 
     THEN bonus_por_cumplir_meta
     ELSE score_normal
END
```

2. **Ponderación configurable**:
```sql
-- Futuro: ajustar peso de volumen vs velocidad
(vacantes_cerradas * peso_volumen) / 
(promedio_dias * peso_velocidad) * 100
```

3. **Filtros temporales**:
```sql
-- Futuro: ranking por periodo
WHERE fecha_cierre BETWEEN periodo_inicio AND periodo_fin
```

## Testing

### Casos de Prueba Sugeridos

1. **Sin vacantes**: 0 vacantes → Score debe ser 0
2. **División por cero**: >0 vacantes con 0 días → Score alto sin error
3. **Valores normales**: 10 vacantes / 20 días → Score ≈ 50
4. **Muchas vacantes lentas**: 100 vacantes / 60 días → Score ≈ 166.67
5. **Pocas vacantes rápidas**: 3 vacantes / 5 días → Score = 60

## Instrucciones de Deployment

1. **Frontend**: ✅ Ya actualizado (deployment automático)
2. **Backend**: ⏳ Requiere ejecución manual
   - Abrir Lovable Cloud → Settings → Cloud → Database
   - Ejecutar el SQL de `MIGRATION_RANKING_ALGORITHM.sql`
   - Verificar con: `SELECT * FROM get_reclutador_ranking() LIMIT 10;`

## Comunicación a Usuarios

**Mensaje sugerido para anuncio:**

> 📊 **Nuevo Índice de Productividad**
> 
> Hemos actualizado el sistema de ranking para reflejar mejor tu desempeño. 
> El nuevo Índice de Productividad mide:
> 
> **Índice = (Vacantes Cerradas / Promedio de Días) × 100**
> 
> - Más vacantes cerradas = Mejor índice
> - Menos días promedio = Mejor índice
> 
> Los rankings se publican mensualmente con datos del mes anterior.
> 
> ¡Sigue cerrando vacantes rápido para mejorar tu posición! 🚀

## Contacto

Para preguntas sobre este cambio, contactar al equipo de desarrollo.

---
**Fecha de cambio**: Diciembre 1, 2024  
**Versión**: 2.0.0  
**Autor**: Sistema VVGI
