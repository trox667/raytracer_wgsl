export interface Dimensions {
  width: number
  height: number
}

export interface Padding {
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

export function copyToBuffer(
  encoder: GPUCommandEncoder,
  texture: GPUTexture,
  outputBuffer: GPUBuffer,
  dimensions: Dimensions
): void {
  const { padded } = getRowPadding(dimensions.width)
  encoder.copyTextureToBuffer(
    {
      texture,
    },
    { buffer: outputBuffer, bytesPerRow: padded, rowsPerImage: 0 },
    dimensions
  )
}
