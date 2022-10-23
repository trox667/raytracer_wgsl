import { encode } from 'https://deno.land/x/pngs/mod.ts'
import { Dimensions } from './types.ts'

export async function createPNG(data: Uint8Array, dimensions: Dimensions) {
  const { width, height } = dimensions
  const buffer = new Uint8Array(data.byteLength)

  // flip image horizontal
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width * 4; ++x) {
      const idx = y * width * 4 + x
      const idxNew = (height - 1 - y) * width * 4 + x
      buffer[idxNew] = data[idx]
    }
  }

  const png = encode(buffer, width, height)
  await Deno.writeFile('./output.png', png)
}
