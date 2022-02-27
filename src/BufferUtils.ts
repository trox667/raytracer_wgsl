import { Dimensions } from './types.ts'

interface BufferInit {
  label?: string
  usage: number
  contents: ArrayBuffer
}

interface Padding {
  unpadded: number
  padded: number
}

export function getRowPadding(width: number): Padding {
  const bytesPerPixel = 4
  const unpaddedBytesPerRow = width * bytesPerPixel
  const align = 256
  const paddedBytesPerRowPadding =
    (align - (unpaddedBytesPerRow % align)) % align
  const paddedBytesPerRow = unpaddedBytesPerRow + paddedBytesPerRowPadding

  return {
    unpadded: unpaddedBytesPerRow,
    padded: paddedBytesPerRow,
  }
}

export function createOutputBuffer(
  device: GPUDevice,
  dimensions: Dimensions
): GPUBuffer {
  // const { padded } = getRowPadding(dimensions.width)
  return device.createBuffer({
    label: 'OutputBuffer',
    size: dimensions.width * dimensions.height * 4,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.MAP_READ |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC,
  })
}

export function createBufferInit(
  device: GPUDevice,
  descriptor: BufferInit
): GPUBuffer {
  const contents = new Uint8Array(descriptor.contents)
  const unpaddedSize = contents.byteLength
  const padding = 4 - (unpaddedSize % 4)
  const paddedSize = padding + unpaddedSize

  const buffer = device.createBuffer({
    label: descriptor.label,
    usage: descriptor.usage,
    mappedAtCreation: true,
    size: paddedSize,
  })
  const data = new Uint8Array(buffer.getMappedRange())
  data.set(contents)
  buffer.unmap()
  return buffer
}
