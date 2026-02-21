export interface DriveFile {
  id: string;
  name: string;
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
    `${DRIVE_API}?q=${q}&fields=files(id,name)&orderBy=name&pageSize=200&includeItemsFromAllDrives=true&supportsAllDrives=true`,
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

export async function resolvePath(
  parts: string[],
  token: string,
  rootId: string
): Promise<string | null> {
  let currentId = rootId;
  for (const part of parts) {
    const next = await findFolder(currentId, part, token);
    if (!next) {
      const available = await listSubfolders(currentId, token);
      const names = available.map((f) => f.name).join(", ") || "(vacío)";
      throw new Error(`FOLDER_NOT_FOUND: No se encontró "${part}". Carpetas disponibles: ${names}`);
    }
    currentId = next;
  }
  return currentId;
}

export function driveUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

export function clearCache(): void {
  childrenCache.clear();
  folderCache.clear();
}
