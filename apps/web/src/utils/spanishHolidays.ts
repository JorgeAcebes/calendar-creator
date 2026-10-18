// =============================================================================
// spanishHolidays.ts — Official Spanish national & provincial public holidays
// =============================================================================

export interface SpanishProvince {
  id: string;
  name: string;
  community: string;
}

export interface CalculatedHoliday {
  month: number; // 1-12
  day: number;   // 1-31
  name: string;
  type: 'national' | 'provincial';
}

/**
 * Calculates Easter Sunday for any Gregorian year using the Meeus/Jones/Butcher algorithm.
 */
function getEasterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/**
 * Returns a date shifted by `days` from Easter Sunday of the given year.
 */
function getEasterShifted(year: number, offsetDays: number): { month: number; day: number } {
  const easter = getEasterSunday(year);
  const d = new Date(year, easter.month - 1, easter.day);
  d.setDate(d.getDate() + offsetDays);
  return {
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

/**
 * List of all 50 Spanish provinces and 2 autonomous cities, in alphabetical order.
 */
export const SPANISH_PROVINCES: SpanishProvince[] = [
  { id: 'alava', name: 'Álava (Araba)', community: 'País Vasco' },
  { id: 'albacete', name: 'Albacete', community: 'Castilla-La Mancha' },
  { id: 'alicante', name: 'Alicante / Alacant', community: 'Comunitat Valenciana' },
  { id: 'almeria', name: 'Almería', community: 'Andalucía' },
  { id: 'asturias', name: 'Asturias (Principado de)', community: 'Asturias' },
  { id: 'avila', name: 'Ávila', community: 'Castilla y León' },
  { id: 'badajoz', name: 'Badajoz', community: 'Extremadura' },
  { id: 'barcelona', name: 'Barcelona', community: 'Cataluña' },
  { id: 'burgos', name: 'Burgos', community: 'Castilla y León' },
  { id: 'caceres', name: 'Cáceres', community: 'Extremadura' },
  { id: 'cadiz', name: 'Cádiz', community: 'Andalucía' },
  { id: 'cantabria', name: 'Cantabria', community: 'Cantabria' },
  { id: 'castellon', name: 'Castellón / Castelló', community: 'Comunitat Valenciana' },
  { id: 'ceuta', name: 'Ceuta (Ciudad Autónoma)', community: 'Ceuta' },
  { id: 'ciudad_real', name: 'Ciudad Real', community: 'Castilla-La Mancha' },
  { id: 'cordoba', name: 'Córdoba', community: 'Andalucía' },
  { id: 'cuenca', name: 'Cuenca', community: 'Castilla-La Mancha' },
  { id: 'girona', name: 'Girona', community: 'Cataluña' },
  { id: 'granada', name: 'Granada', community: 'Andalucía' },
  { id: 'guadalajara', name: 'Guadalajara', community: 'Castilla-La Mancha' },
  { id: 'guipuzcoa', name: 'Guipúzcoa (Gipuzkoa)', community: 'País Vasco' },
  { id: 'huelva', name: 'Huelva', community: 'Andalucía' },
  { id: 'huesca', name: 'Huesca', community: 'Aragón' },
  { id: 'illes_balears', name: 'Illes Balears', community: 'Illes Balears' },
  { id: 'jaen', name: 'Jaén', community: 'Andalucía' },
  { id: 'la_coruna', name: 'A Coruña', community: 'Galicia' },
  { id: 'la_rioja', name: 'La Rioja', community: 'La Rioja' },
  { id: 'las_palmas', name: 'Las Palmas', community: 'Canarias' },
  { id: 'leon', name: 'León', community: 'Castilla y León' },
  { id: 'lleida', name: 'Lleida', community: 'Cataluña' },
  { id: 'lugo', name: 'Lugo', community: 'Galicia' },
  { id: 'madrid', name: 'Madrid (Comunidad de)', community: 'Comunidad de Madrid' },
  { id: 'malaga', name: 'Málaga', community: 'Andalucía' },
  { id: 'melilla', name: 'Melilla (Ciudad Autónoma)', community: 'Melilla' },
  { id: 'murcia', name: 'Murcia (Región de)', community: 'Región de Murcia' },
  { id: 'navarra', name: 'Navarra (C. Foral de)', community: 'Comunidad Foral de Navarra' },
  { id: 'ourense', name: 'Ourense', community: 'Galicia' },
  { id: 'palencia', name: 'Palencia', community: 'Castilla y León' },
  { id: 'pontevedra', name: 'Pontevedra', community: 'Galicia' },
  { id: 'salamanca', name: 'Salamanca', community: 'Castilla y León' },
  { id: 'santa_cruz_tenerife', name: 'Santa Cruz de Tenerife', community: 'Canarias' },
  { id: 'segovia', name: 'Segovia', community: 'Castilla y León' },
  { id: 'sevilla', name: 'Sevilla', community: 'Andalucía' },
  { id: 'soria', name: 'Soria', community: 'Castilla y León' },
  { id: 'tarragona', name: 'Tarragona', community: 'Cataluña' },
  { id: 'teruel', name: 'Teruel', community: 'Aragón' },
  { id: 'toledo', name: 'Toledo', community: 'Castilla-La Mancha' },
  { id: 'valencia', name: 'Valencia / València', community: 'Comunitat Valenciana' },
  { id: 'valladolid', name: 'Valladolid', community: 'Castilla y León' },
  { id: 'vizcaya', name: 'Vizcaya (Bizkaia)', community: 'País Vasco' },
  { id: 'zamora', name: 'Zamora', community: 'Castilla y León' },
  { id: 'zaragoza', name: 'Zaragoza', community: 'Aragón' },
];

/**
 * Returns the fixed and Easter-variable national holidays for Spain.
 */
export function getNationalHolidays(year: number): CalculatedHoliday[] {
  const vierneSanto = getEasterShifted(year, -2);
  
  return [
    { month: 1, day: 1, name: 'Año Nuevo', type: 'national' },
    { month: 1, day: 6, name: 'Epifanía del Señor (Reyes)', type: 'national' },
    { month: vierneSanto.month, day: vierneSanto.day, name: 'Viernes Santo', type: 'national' },
    { month: 5, day: 1, name: 'Fiesta del Trabajo', type: 'national' },
    { month: 8, day: 15, name: 'Asunción de la Virgen', type: 'national' },
    { month: 10, day: 12, name: 'Fiesta Nacional de España', type: 'national' },
    { month: 11, day: 1, name: 'Todos los Santos', type: 'national' },
    { month: 12, day: 6, name: 'Día de la Constitución Española', type: 'national' },
    { month: 12, day: 8, name: 'Inmaculada Concepción', type: 'national' },
    { month: 12, day: 25, name: 'Navidad', type: 'national' },
  ];
}

/**
 * Returns regional and provincial holidays for a selected Spanish province.
 */
export function getProvincialHolidays(provinceId: string, year: number): CalculatedHoliday[] {
  const juevesSanto = getEasterShifted(year, -3);
  const lunesPascua = getEasterShifted(year, 1);
  const corpusChristi = getEasterShifted(year, 60);

  const holidays: CalculatedHoliday[] = [];

  const add = (month: number, day: number, name: string) => {
    holidays.push({ month, day, name, type: 'provincial' });
  };

  switch (provinceId) {
    // Andalucía (Almería, Cádiz, Córdoba, Granada, Huelva, Jaén, Málaga, Sevilla)
    case 'almeria':
    case 'cadiz':
    case 'cordoba':
    case 'huelva':
    case 'jaen':
    case 'malaga':
      add(2, 28, 'Día de Andalucía');
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      break;
    case 'granada':
      add(1, 2, 'Día de la Toma');
      add(2, 28, 'Día de Andalucía');
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      break;
    case 'sevilla':
      add(2, 28, 'Día de Andalucía');
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(5, 30, 'San Fernando');
      add(corpusChristi.month, corpusChristi.day, 'Corpus Christi');
      break;

    // Aragón (Huesca, Teruel, Zaragoza)
    case 'huesca':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(4, 23, 'San Jorge / Día de Aragón');
      add(8, 10, 'San Lorenzo');
      break;
    case 'teruel':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(4, 23, 'San Jorge / Día de Aragón');
      add(7, 10, 'Fiestas del Ángel');
      break;
    case 'zaragoza':
      add(1, 29, 'San Valero');
      add(3, 5, 'Cincomarzada');
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(4, 23, 'San Jorge / Día de Aragón');
      break;

    // Asturias
    case 'asturias':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(9, 8, 'Día de Asturias');
      break;

    // Illes Balears
    case 'illes_balears':
      add(3, 1, 'Día de les Illes Balears');
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(lunesPascua.month, lunesPascua.day, 'Lunes de Pascua');
      add(12, 26, 'Sant Esteve');
      break;

    // Canarias (Las Palmas, Santa Cruz de Tenerife)
    case 'las_palmas':
    case 'santa_cruz_tenerife':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(5, 30, 'Día de Canarias');
      break;

    // Cantabria
    case 'cantabria':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(7, 28, 'Día de las Instituciones');
      add(9, 15, 'La Bien Aparecida');
      break;

    // Castilla-La Mancha (Albacete, Ciudad Real, Cuenca, Guadalajara, Toledo)
    case 'albacete':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(5, 31, 'Día de Castilla-La Mancha');
      add(corpusChristi.month, corpusChristi.day, 'Corpus Christi');
      add(9, 8, 'Virgen de los Llanos');
      break;
    case 'ciudad_real':
    case 'guadalajara':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(5, 31, 'Día de Castilla-La Mancha');
      add(corpusChristi.month, corpusChristi.day, 'Corpus Christi');
      break;
    case 'cuenca':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(5, 31, 'Día de Castilla-La Mancha');
      add(corpusChristi.month, corpusChristi.day, 'Corpus Christi');
      add(9, 21, 'San Mateo');
      break;
    case 'toledo':
      add(1, 23, 'San Ildefonso');
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(5, 31, 'Día de Castilla-La Mancha');
      add(corpusChristi.month, corpusChristi.day, 'Corpus Christi');
      break;

    // Castilla y León (Ávila, Burgos, León, Palencia, Salamanca, Segovia, Soria, Valladolid, Zamora)
    case 'avila':
    case 'burgos':
    case 'leon':
    case 'palencia':
    case 'salamanca':
    case 'segovia':
    case 'soria':
    case 'zamora':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(4, 23, 'Día de Castilla y León');
      break;
    case 'valladolid':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(4, 23, 'Día de Castilla y León');
      add(5, 13, 'San Pedro Regalado');
      add(9, 8, 'Virgen de San Lorenzo');
      break;

    // Cataluña (Barcelona, Girona, Lleida, Tarragona)
    case 'barcelona':
      add(lunesPascua.month, lunesPascua.day, 'Lunes de Pascua');
      add(6, 24, 'Sant Joan');
      add(9, 11, 'Diada Nacional de Catalunya');
      add(9, 24, 'La Mercè');
      add(12, 26, 'Sant Esteve');
      break;
    case 'girona':
    case 'lleida':
    case 'tarragona':
      add(lunesPascua.month, lunesPascua.day, 'Lunes de Pascua');
      add(6, 24, 'Sant Joan');
      add(9, 11, 'Diada Nacional de Catalunya');
      add(12, 26, 'Sant Esteve');
      break;

    // Comunitat Valenciana (Alicante, Castellón, Valencia)
    case 'alicante':
    case 'castellon':
      add(3, 19, 'San José');
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(lunesPascua.month, lunesPascua.day, 'Lunes de Pascua');
      add(6, 24, 'San Juan');
      add(10, 9, 'Día de la Comunitat Valenciana');
      break;
    case 'valencia':
      add(1, 22, 'San Vicente Mártir');
      add(3, 19, 'San José');
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(lunesPascua.month, lunesPascua.day, 'Lunes de Pascua');
      add(6, 24, 'San Juan');
      add(10, 9, 'Día de la Comunitat Valenciana');
      break;

    // Extremadura (Badajoz, Cáceres)
    case 'badajoz':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(9, 8, 'Día de Extremadura');
      break;
    case 'caceres':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(4, 23, 'San Jorge');
      add(9, 8, 'Día de Extremadura');
      break;

    // Galicia (A Coruña, Lugo, Ourense, Pontevedra)
    case 'la_coruna':
    case 'lugo':
    case 'ourense':
    case 'pontevedra':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(5, 17, 'Día das Letras Galegas');
      add(7, 25, 'Día Nacional de Galicia / Santiago Apóstol');
      break;

    // Comunidad de Madrid
    case 'madrid':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(5, 2, 'Fiesta de la Comunidad de Madrid');
      add(5, 15, 'San Isidro Labrador');
      add(7, 25, 'Santiago Apóstol');
      add(11, 9, 'Nuestra Señora de la Almudena');
      break;

    // Región de Murcia
    case 'murcia':
      add(3, 19, 'San José');
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(6, 9, 'Día de la Región de Murcia');
      break;

    // Comunidad Foral de Navarra
    case 'navarra':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(lunesPascua.month, lunesPascua.day, 'Lunes de Pascua');
      add(7, 7, 'San Fermín');
      add(12, 3, 'San Francisco Javier / Día de Navarra');
      break;

    // País Vasco (Álava, Guipúzcoa, Vizcaya)
    case 'alava':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(lunesPascua.month, lunesPascua.day, 'Lunes de Pascua');
      add(4, 28, 'San Prudencio');
      add(7, 25, 'Santiago Apóstol');
      break;
    case 'guipuzcoa':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(lunesPascua.month, lunesPascua.day, 'Lunes de Pascua');
      add(7, 25, 'Santiago Apóstol');
      add(7, 31, 'San Ignacio de Loyola');
      break;
    case 'vizcaya':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(lunesPascua.month, lunesPascua.day, 'Lunes de Pascua');
      add(7, 25, 'Santiago Apóstol');
      add(7, 31, 'San Ignacio de Loyola');
      break;

    // La Rioja
    case 'la_rioja':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(lunesPascua.month, lunesPascua.day, 'Lunes de Pascua');
      add(6, 9, 'Día de La Rioja');
      break;

    // Ceuta y Melilla
    case 'ceuta':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(9, 2, 'Día de Ceuta');
      add(10, 10, 'San Daniel');
      break;
    case 'melilla':
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      add(9, 17, 'Día de Melilla');
      break;

    default:
      // Si no hay provincia específica, añadir Jueves Santo como festivo estándar habitual
      add(juevesSanto.month, juevesSanto.day, 'Jueves Santo');
      break;
  }

  return holidays;
}

/**
 * Calculates all official holidays for a specific year, combining national and provincial.
 * Merges duplicates if any date coincides.
 */
export function getAllHolidaysForYear(
  year: number,
  includeNational: boolean = true,
  provinceId?: string
): CalculatedHoliday[] {
  const result: CalculatedHoliday[] = [];
  const seenDates = new Set<string>();

  if (includeNational) {
    for (const h of getNationalHolidays(year)) {
      const key = `${h.month}-${h.day}`;
      if (!seenDates.has(key)) {
        seenDates.add(key);
        result.push(h);
      }
    }
  }

  if (provinceId) {
    for (const h of getProvincialHolidays(provinceId, year)) {
      const key = `${h.month}-${h.day}`;
      if (!seenDates.has(key)) {
        seenDates.add(key);
        result.push(h);
      } else {
        // If national holiday already there, append regional name if different
        const existing = result.find((item) => item.month === h.month && item.day === h.day);
        if (existing && !existing.name.includes(h.name)) {
          existing.name += ` / ${h.name}`;
        }
      }
    }
  }

  return result.sort((a, b) => (a.month !== b.month ? a.month - b.month : a.day - b.day));
}
