// Minimal ZIP writer (stored, no compression), so exporting needs no library.
const TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (b: Uint8Array) => {
  let c = 0xffffffff
  for (const x of b) c = TABLE[(c ^ x) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

export type ZipFile = { path: string; data: Uint8Array | string }

export function zip(files: ZipFile[]): Blob {
  const enc = new TextEncoder()
  const d = new Date()
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  const parts: BlobPart[] = []
  const central: BlobPart[] = []
  let offset = 0

  for (const file of files) {
    const f = { path: file.path, data: typeof file.data === 'string' ? enc.encode(file.data) : file.data }
    const name = enc.encode(f.path)
    const crc = crc32(f.data)
    const local = new DataView(new ArrayBuffer(30))
    ;[[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, time, 2], [12, date, 2], [14, crc, 4], [18, f.data.length, 4], [22, f.data.length, 4], [26, name.length, 2], [28, 0, 2]].forEach(([o, v, n]) =>
      n === 4 ? local.setUint32(o, v, true) : local.setUint16(o, v, true))
    parts.push(local.buffer as ArrayBuffer, name as BlobPart, f.data as BlobPart)

    const c = new DataView(new ArrayBuffer(46))
    ;[[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, time, 2], [14, date, 2], [16, crc, 4], [20, f.data.length, 4], [24, f.data.length, 4], [28, name.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, offset, 4]].forEach(([o, v, n]) =>
      n === 4 ? c.setUint32(o, v, true) : c.setUint16(o, v, true))
    central.push(c.buffer as ArrayBuffer, name as BlobPart)
    offset += 30 + name.length + f.data.length
  }

  const size = central.reduce((n, p) => n + (p as ArrayBuffer | Uint8Array).byteLength, 0)
  const end = new DataView(new ArrayBuffer(22))
  ;[[0, 0x06054b50, 4], [4, 0, 2], [6, 0, 2], [8, files.length, 2], [10, files.length, 2], [12, size, 4], [16, offset, 4], [20, 0, 2]].forEach(([o, v, n]) =>
    n === 4 ? end.setUint32(o, v, true) : end.setUint16(o, v, true))
  return new Blob([...parts, ...central, end.buffer as ArrayBuffer], { type: 'application/zip' })
}
