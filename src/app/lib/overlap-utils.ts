/**
 * Utilidades para calcular solapamientos de horarios entre participantes.
 * Todas las funciones son puras y no dependen de Supabase ni Next.js.
 */

/**
 * Representa un bloque de disponibilidad.
 */
export interface AvailabilityBlock {
  day: string; // Fecha en formato YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

/**
 * Representa una superposición entre dos bloques.
 */
export interface OverlapBlock {
  day: string;
  start: string;
  end: string;
}

/**
 * Calcula si dos bloques de tiempo se solapan en un mismo día.
 * Devuelve el bloque de superposición si hay solapamiento, o null si no lo hay.
 */
export function getOverlap(
  block1: AvailabilityBlock,
  block2: AvailabilityBlock
): OverlapBlock | null {
  // Si los días son diferentes, no hay solapamiento
  if (block1.day !== block2.day) {
    return null;
  }

  const start1 = block1.start_time;
  const end1 = block1.end_time;
  const start2 = block2.start_time;
  const end2 = block2.end_time;

  // Los bloques se solapan si el inicio de uno es antes del fin del otro
  // y el fin de uno es después del inicio del otro
  if (start1 < end2 && start2 < end1) {
    const start = start1 > start2 ? start1 : start2;
    const end = end1 < end2 ? end1 : end2;
    return {
      day: block1.day,
      start,
      end,
    };
  }

  return null;
}

/**
 * Calcula todas las superposiciones entre bloques de diferentes usuarios.
 * @param availabilities - Lista de todos los bloques de disponibilidad
 * @param userIdMap - Mapa de user_id a nombre de usuario (opcional, para depuración)
 * @returns Lista de bloques de superposición
 */
export function calculateOverlaps(
  availabilities: Array<AvailabilityBlock & { user_id: string }>
): OverlapBlock[] {
  const overlaps: OverlapBlock[] = [];

  // Agrupar bloques por día
  const byDay = new Map<string, Array<AvailabilityBlock & { user_id: string }>>();

  for (const a of availabilities) {
    if (!byDay.has(a.day)) {
      byDay.set(a.day, []);
    }
    byDay.get(a.day)!.push({
      day: a.day,
      user_id: a.user_id,
      start_time: a.start_time,
      end_time: a.end_time,
    });
  }

  // Para cada día, comparar cada par de bloques de usuarios diferentes
  for (const [day, blocks] of byDay.entries()) {
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        // Solo comparar bloques de usuarios diferentes
        if (blocks[i].user_id === blocks[j].user_id) {
          continue;
        }

        const overlap = getOverlap(
          {
            day: blocks[i].day,
            start_time: blocks[i].start_time,
            end_time: blocks[i].end_time,
          },
          {
            day: blocks[j].day,
            start_time: blocks[j].start_time,
            end_time: blocks[j].end_time,
          }
        );

        if (overlap) {
          overlaps.push({
            day,
            start: overlap.start,
            end: overlap.end,
          });
        }
      }
    }
  }

  return overlaps;
}

/**
 * Formatea una hora en formato HH:MM a una cadena legible.
 */
export function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

/**
 * Valida que una hora de fin sea posterior a la hora de inicio.
 */
export function isValidTimeRange(start: string, end: string): boolean {
  return start < end;
}
