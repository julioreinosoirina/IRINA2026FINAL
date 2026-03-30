export interface DriveFile {
  id: string;
  name: string;
}

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
}

export interface AreaLink {
  name: string;
  id: string;
}

export const FOLDER_MIME = "application/vnd.google-apps.folder";

const DRIVE_API = "https://www.googleapis.com/drive/v3/files";

// ── Caché por sesión de carga ─────────────────────────────────────────────
// Se crea uno nuevo por cada llamado a createSession() — vive solo durante
// la resolución de una pantalla. Al navegar se descarta: siempre datos frescos.
export function createSession() {
  const sessionCache = new Map<string, DriveFile[]>();

  async function listSubfolders(parentId: string, token: string): Promise<DriveFile[]> {
    if (sessionCache.has(parentId)) return sessionCache.get(parentId)!;

    const q = encodeURIComponent(
      `'${parentId}' in parents and mimeType='${FOLDER_MIME}' and trashed=false`
    );
    const res = await fetch(
      `${DRIVE_API}?q=${q}&fields=files(id,name)&orderBy=name&pageSize=200` +
      `&includeItemsFromAllDrives=true&supportsAllDrives=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.status === 401) throw new Error("TOKEN_EXPIRED");
    if (!res.ok) throw new Error(`Drive API error: ${res.status}`);

    const data = await res.json();
    const files: DriveFile[] = data.files ?? [];
    sessionCache.set(parentId, files);
    return files;
  }

  async function findFolder(parentId: string, name: string, token: string): Promise<string | null> {
    const children = await listSubfolders(parentId, token);
    const found = children.find((f) => f.name.toLowerCase() === name.toLowerCase());
    return found ? found.id : null;
  }

  async function resolvePath(parts: string[], token: string, rootId: string): Promise<string | null> {
    let currentId = rootId;
    for (const part of parts) {
      const next = await findFolder(currentId, part, token);
      if (!next) return null;
      currentId = next;
    }
    return currentId;
  }

  async function resolveAreaLinks(
    categoriaPath: string[],
    alumno: string,
    token: string,
    rootId: string
  ): Promise<AreaLink[]> {
    const directId = await resolvePath([...categoriaPath, alumno], token, rootId);
    if (directId) {
      return [{ name: "Abrir carpeta", id: directId }];
    }

    const categoriaId = await resolvePath(categoriaPath, token, rootId);
    if (!categoriaId) return [];

    const areas = await listSubfolders(categoriaId, token);
    const results: AreaLink[] = [];

    await Promise.all(
      areas.map(async (area) => {
        const alumnoId = await findFolder(area.id, alumno, token);
        if (alumnoId) {
          results.push({ name: area.name, id: alumnoId });
        }
      })
    );

    results.sort((a, b) => a.name.localeCompare(b.name, "es"));
    return results;
  }

  return { listSubfolders, findFolder, resolvePath, resolveAreaLinks };
}

// ── Funciones sin caché — para listados de archivos (siempre frescos) ─────
export async function listFolderContents(folderId: string, token: string): Promise<DriveItem[]> {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const res = await fetch(
    `${DRIVE_API}?q=${q}&fields=files(id,name,mimeType,size,modifiedTime)` +
    `&orderBy=folder,name&pageSize=200` +
    `&includeItemsFromAllDrives=true&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (res.status === 401) throw new Error("TOKEN_EXPIRED");
  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);

  const data = await res.json();
  return data.files ?? [];
}

// ── Upload con progreso ───────────────────────────────────────────────────
export async function uploadFile(
  folderId: string,
  file: File,
  token: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  const metadata = { name: file.name, parents: [folderId] };

  const initRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": file.type || "application/octet-stream",
        "X-Upload-Content-Length": String(file.size),
      },
      body: JSON.stringify(metadata),
    }
  );

  if (initRes.status === 401) throw new Error("TOKEN_EXPIRED");
  if (!initRes.ok) throw new Error(`No se pudo iniciar la carga: ${initRes.status}`);

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) throw new Error("No se obtuvo URL de carga del servidor");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Error al subir el archivo: ${xhr.status}`));
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Error de red al subir el archivo"))
    );

    xhr.send(file);
  });
}

export function driveUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

export async function deleteFile(fileId: string, token: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (res.status === 401) throw new Error("TOKEN_EXPIRED");
  if (!res.ok && res.status !== 204) throw new Error(`Error al eliminar: ${res.status}`);
}

export async function renameFile(fileId: string, newName: string, token: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newName }),
    }
  );
  if (res.status === 401) throw new Error("TOKEN_EXPIRED");
  if (!res.ok) throw new Error(`Error al renombrar: ${res.status}`);
}

// clearCache se mantiene como no-op por compatibilidad con el logout
export function clearCache(): void {}
