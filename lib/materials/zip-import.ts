import { batchLimits, safePath } from "./batch-contribution.ts";

export type ArchiveEntry = { path: string; bytes: Uint8Array };
function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
async function inflate(bytes: Uint8Array, expected: number) {
  let stream: DecompressionStream;
  try {
    stream = new DecompressionStream("deflate-raw");
  } catch {
    throw new Error(
      "This browser cannot unpack compressed ZIP files. Extract the archive and select the files instead.",
    );
  }
  const reader = new Blob([new Uint8Array(bytes)])
    .stream()
    .pipeThrough(stream)
    .getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.length;
      if (size > expected || size > batchLimits.fileBytes)
        throw new Error("ZIP output exceeds its declared size.");
      chunks.push(next.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }
  if (size !== expected)
    throw new Error("ZIP output does not match its declared size.");
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
/** Stored/deflated ZIP, in memory only. No filesystem extraction and no script execution. */
export async function unpackZip(bytes: Uint8Array): Promise<ArchiveEntry[]> {
  if (bytes.length < 22 || bytes.length > 64 * 1024 * 1024)
    throw new Error("Choose a ZIP archive no larger than 64 MiB.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const range = (start: number, length: number) => {
    if (start < 0 || length < 0 || start + length > bytes.length)
      throw new Error("Truncated ZIP archive.");
  };
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (
      view.getUint32(i, true) === 0x06054b50 &&
      i + 22 + view.getUint16(i + 20, true) === bytes.length
    ) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("ZIP directory not found.");
  const count = view.getUint16(end + 10, true),
    size = view.getUint32(end + 12, true),
    directory = view.getUint32(end + 16, true);
  if (
    view.getUint16(end + 4, true) ||
    view.getUint16(end + 6, true) ||
    view.getUint16(end + 8, true) !== count ||
    count === 0xffff ||
    size === 0xffffffff ||
    directory === 0xffffffff
  )
    throw new Error("Multipart and ZIP64 archives are not supported.");
  if (count > batchLimits.files + 100 || directory + size > end)
    throw new Error("ZIP directory exceeds the batch limits.");
  range(directory, size);
  const decodeName = (data: Uint8Array, flags: number) => {
    if (!(flags & 0x0800) && data.some((b) => b > 127))
      throw new Error(
        "Use UTF-8 filenames in the ZIP, or select the extracted files.",
      );
    return new TextDecoder("utf-8", { fatal: true }).decode(data);
  };
  const entries: ArchiveEntry[] = [],
    names = new Set<string>();
  let cursor = directory,
    total = 0;
  for (let i = 0; i < count; i++) {
    range(cursor, 46);
    if (view.getUint32(cursor, true) !== 0x02014b50)
      throw new Error("Invalid ZIP directory entry.");
    const flags = view.getUint16(cursor + 8, true),
      method = view.getUint16(cursor + 10, true),
      crc = view.getUint32(cursor + 16, true),
      compressed = view.getUint32(cursor + 20, true),
      uncompressed = view.getUint32(cursor + 24, true),
      nameSize = view.getUint16(cursor + 28, true),
      extraSize = view.getUint16(cursor + 30, true),
      commentSize = view.getUint16(cursor + 32, true),
      disk = view.getUint16(cursor + 34, true),
      external = view.getUint32(cursor + 38, true),
      local = view.getUint32(cursor + 42, true);
    range(cursor, 46 + nameSize + extraSize + commentSize);
    const name = decodeName(
      bytes.subarray(cursor + 46, cursor + 46 + nameSize),
      flags,
    );
    cursor += 46 + nameSize + extraSize + commentSize;
    if (
      cursor > directory + size ||
      compressed === 0xffffffff ||
      uncompressed === 0xffffffff ||
      local === 0xffffffff
    )
      throw new Error("Invalid or ZIP64 entry.");
    if (name.endsWith("/")) {
      safePath(name.slice(0, -1));
      continue;
    }
    const path = safePath(name);
    if (
      flags & 1 ||
      disk ||
      ![0, 8].includes(method) ||
      ((external >>> 16) & 0xf000) === 0xa000
    )
      throw new Error(
        "Encrypted, linked or unsupported ZIP entries cannot be imported.",
      );
    if (names.has(path)) throw new Error("Duplicate file path in ZIP: " + path);
    if (
      !uncompressed ||
      uncompressed > batchLimits.fileBytes ||
      total + uncompressed > batchLimits.totalBytes ||
      entries.length >= batchLimits.files
    )
      throw new Error(
        "ZIP contents exceed 100 files, 10 MiB per file or 50 MiB total.",
      );
    range(local, 30);
    if (
      view.getUint32(local, true) !== 0x04034b50 ||
      view.getUint16(local + 8, true) !== method ||
      view.getUint16(local + 6, true) !== flags
    )
      throw new Error("ZIP entry headers do not match.");
    const localNameSize = view.getUint16(local + 26, true),
      localExtraSize = view.getUint16(local + 28, true);
    range(local + 30, localNameSize + localExtraSize);
    if (
      decodeName(
        bytes.subarray(local + 30, local + 30 + localNameSize),
        flags,
      ) !== name
    )
      throw new Error("ZIP entry names do not match.");
    const start = local + 30 + localNameSize + localExtraSize;
    if (start + compressed > directory)
      throw new Error("ZIP data overlaps its directory.");
    range(start, compressed);
    const packed = bytes.slice(start, start + compressed);
    const content = method === 0 ? packed : await inflate(packed, uncompressed);
    if (content.length !== uncompressed || crc32(content) !== crc)
      throw new Error("ZIP checksum mismatch: " + path);
    entries.push({ path, bytes: content });
    names.add(path);
    total += content.length;
  }
  if (!entries.length || cursor !== directory + size)
    throw new Error("The ZIP is empty or has an invalid directory.");
  return entries;
}
