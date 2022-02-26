import { encode } from 'https://deno.land/x/pngs@0.1.1/mod.ts'
import { Dimensions, getRowPadding } from './webgpu.ts'

export async function createPNG(
  buffer: GPUBuffer,
  dimensions: Dimensions
): Promise<void> {
  await buffer.mapAsync(GPUMapMode.READ)
  const inputBuffer = new Uint8Array(buffer.getMappedRange())
  const { padded, unpadded } = getRowPadding(dimensions.width)
  const outputBuffer = new Uint8Array(unpadded * dimensions.height)
  for (let i = 0; i < dimensions.height; ++i) {
    const slice = inputBuffer
      .slice(i * padded, (i + 1) * padded)
      .slice(0, unpadded)
    outputBuffer.set(slice, i * unpadded)
  }

  const image = encode(outputBuffer, dimensions.width, dimensions.height, {
    stripAlpha: true,
    color: 2,
  })
  Deno.writeFileSync('./output.png', image)
  buffer.unmap()
}
