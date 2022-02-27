import { encode } from 'https://deno.land/x/pngs/mod.ts'
import { Dimensions } from './types.ts'

export async function createPNG(data: Uint8Array, dimensions: Dimensions) {
  const { width, height } = dimensions

  const png = encode(data, width, height)
  await Deno.writeFile('./output.png', png)
}
