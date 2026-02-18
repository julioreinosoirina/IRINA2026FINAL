// ============================================================
// CONFIGURACION CENTRAL - Editar IDs de carpetas de Google Drive
// Reemplazar "FOLDER_ID_AQUI" por el ID real de cada carpeta
// El ID se encuentra en la URL de Google Drive:
// https://drive.google.com/drive/folders/ESTE_ES_EL_ID
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

// Estructura: driveLinks[seccion][alumno][categoria] = URL de Drive
// Para CET: driveLinks["CET/TURNO MAÑANA/SECTOR NIÑOS"]["alumno1"]["EVALUACION ACTUAL"] = "https://..."
// Para INCLUSION: driveLinks["INCLUSION"]["alumno1"]["EVALUACION ACTUAL"] = "https://..."

export type DriveLinks = {
  [path: string]: {
    [alumno: string]: {
      [categoria in Categoria]?: string;
    };
  };
};

function driveUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

// ============================================================
// ALUMNOS POR SECCIÓN
// ============================================================
export const ALUMNOS: Record<string, string[]> = {
  "CET/TURNO MAÑANA/SECTOR NIÑOS":   ["alumno1", "alumno2", "alumno3"],
  "CET/TURNO MAÑANA/SECTOR JOVENES": ["alumno1", "alumno2", "alumno3"],
  "CET/TURNO TARDE/SECTOR NIÑOS":    ["alumno1", "alumno2", "alumno3"],
  "CET/TURNO TARDE/SECTOR JOVENES":  ["alumno1", "alumno2", "alumno3"],
  "INCLUSION":                        ["alumno1", "alumno2", "alumno3"],
};

// ============================================================
// LINKS DE DRIVE
// Formato para CET:
//   La carpeta en Drive es: SISTEMA/CET/[TURNO]/[SECTOR]/[CATEGORIA]/[ALUMNO]
// Formato para INCLUSION:
//   La carpeta en Drive es: SISTEMA/INCLUSION/[ALUMNO]/[CATEGORIA]
// ============================================================
export const DRIVE_LINKS: DriveLinks = {
  "CET/TURNO MAÑANA/SECTOR NIÑOS": {
    "alumno1": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
    "alumno2": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
    "alumno3": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
  },
  "CET/TURNO MAÑANA/SECTOR JOVENES": {
    "alumno1": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
    "alumno2": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
    "alumno3": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
  },
  "CET/TURNO TARDE/SECTOR NIÑOS": {
    "alumno1": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
    "alumno2": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
    "alumno3": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
  },
  "CET/TURNO TARDE/SECTOR JOVENES": {
    "alumno1": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
    "alumno2": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
    "alumno3": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
  },
  "INCLUSION": {
    "alumno1": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
    "alumno2": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
    "alumno3": {
      "EVALUACION ACTUAL":             driveUrl("FOLDER_ID_AQUI"),
      "PROYECTOS DE SALAS":            driveUrl("FOLDER_ID_AQUI"),
      "INFORMES CUATRIMESTRALES":      driveUrl("FOLDER_ID_AQUI"),
      "INFORMES FINALES":              driveUrl("FOLDER_ID_AQUI"),
      "INFORMES MENSUALES":            driveUrl("FOLDER_ID_AQUI"),
      "PLAN DE TRATAMIENTO":           driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES ANUALES":       driveUrl("FOLDER_ID_AQUI"),
      "PLANIFICACIONES TRIMESTRALES":  driveUrl("FOLDER_ID_AQUI"),
      "PROTOCOLOS DE RUTINAS Y CRISIS":driveUrl("FOLDER_ID_AQUI"),
    },
  },
};
