export interface DriveFile {
  id: string;
  name: string;
}

export interface AreaLink {
  name: string;
  id: string;
}

const childrenCache = new Map<string, DriveFile[]>();
const folderCache = new Map<string, string>();

const DRIVE_API = "https://www.googleapis.com/drive/v3/files";

export async function listSubfolders(parentId: string, token: string): Promise<DriveFile[]> {
  if (childrenCache.has(parentId)) return childrenCache.get(parentId)!;

  const q = encodeURIComponent(
    `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
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
  childrenCache.set(parentId, files);
  return files;
}

export async function findFolder(
  parentId: string,
  name: string,
  token: string
): Promise<string | null> {
  const key = `${parentId}|${name.toLowerCase()}`;
  if (folderCache.has(key)) return folderCache.get(key)!;

  const children = await listSubfolders(parentId, token);
  const found = children.find((f) => f.name.toLowerCase() === name.toLowerCase());
  if (found) {
    folderCache.set(key, found.id);
    return found.id;
  }
  return null;
}

// Resolves a path step by step. Returns null if any segment is not found.
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

// Smart resolver for CET: alumno can be directly inside categoria OR inside an area subfolder.
// Returns list of AreaLink items:
//   - If alumno found directly → single item with the alumno folder id
//   - If not → lists area subfolders that contain the alumno, resolved to alumno folder ids
export async function resolveAreaLinks(
  categoriaPath: string[],
  alumno: string,
  token: string,
  rootId: string
): Promise<AreaLink[]> {
  // Try direct path: categoria/alumno
  const directId = await resolvePath([...categoriaPath, alumno], token, rootId);
  if (directId) {
    return [{ name: "Abrir carpeta", id: directId }];
  }

  // Try via areas: get subfolders of categoria, then find alumno in each
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
