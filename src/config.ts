// ============================================================
// CONFIGURACION - Solo estos 2 valores deben editarse
// ============================================================

// 1. Client ID de Google Cloud Console
//    Ir a: console.cloud.google.com → APIs y servicios → Credenciales
export const GOOGLE_CLIENT_ID = "99437757855-jp46msh793i8jf96s9gm6f87fb2uue51.apps.googleusercontent.com";

// 2. ID de la carpeta raiz "SISTEMA" en Google Drive
//    Se obtiene de la URL: https://drive.google.com/drive/folders/ESTE_ID
export const SISTEMA_FOLDER_ID = "1IkKd6_bh0ybriKUfkyagnyjT9mBGexiR";

// ============================================================
// Dominio institucional (no modificar)
// ============================================================
export const INSTITUTO_DOMAIN = "institutoirina.com";

// ============================================================
// Categoría usada como referencia para listar alumnos en CET
// Todos los alumnos deben tener al menos esta carpeta en Drive
// ============================================================
export const CATEGORIA_REFERENCIA = "EVALUACION ACTUAL";

// ============================================================
// Lista fija de categorías (igual para todos los alumnos)
// ============================================================
export const CATEGORIAS = [
  "EVALUACION ACTUAL",
  "PROYECTOS DE SALAS",
  "INFORMES CUATRIMESTRALES",
  "INFORMES FINALES",
  "INFORMES MENSUALES",
  "PLAN DE TRATAMIENTO",
  "PLANIFICACIONES ANUALES",
  "PLANIFICACIONES TRIMESTRALES",
  "PROTOCOLOS DE RUTINAS Y CRISIS",
] as const;

export type Categoria = typeof CATEGORIAS[number];
