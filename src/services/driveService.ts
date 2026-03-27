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

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

interface CacheEntry<T> { value: T; ts: number }
const childrenCache = new Map<string, CacheEntry<DriveFile[]>>();
const folderCache = new Map<string, CacheEntry<string>>();

const DRIVE_API = "https://www.googleapis.com/drive/v3/files";

export async function listSubfolders(parentId: string, token: string): Promise<DriveFile[]> {
  const hit = childrenCache.get(parentId);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.value;

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
  childrenCache.set(parentId, { value: files, ts: Date.now() });
  return files;
}

// Lists ALL items (files + subfolders) inside a folder — used by folder_view
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

// Uploads a file to a Drive folder using resumable upload (with progress)
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

export async function findFolder(
  parentId: string,
  name: string,
  token: string
): Promise<string | null> {
  const key = `${parentId}|${name.toLowerCase()}`;
  const hit = folderCache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.value;

  const children = await listSubfolders(parentId, token);
  const found = children.find((f) => f.name.toLowerCase() === name.toLowerCase());
  if (found) {
    folderCache.set(key, { value: found.id, ts: Date.now() });
    return found.id;
  }
  return null;
}

export async function resolvePath(
  parts: string[],
  token: string,
  rootId: string
): Promise<string | null> {
  let currentId = rootId;
  for (const part of parts) {
    const next = await findFolder(currentId, part, token);
    if (!next) return null;
    currentId = next;
  }
  return currentId;
}

export async function resolveAreaLinks(
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

export function driveUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

export function clearCache(): void {
  childrenCache.clear();
  folderCache.clear();
}
