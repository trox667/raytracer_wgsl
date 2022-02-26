import { Dimensions, getRowPadding } from './webgpu.ts'

export interface CreateCapture {
  texture: GPUTexture
  outputBuffer: GPUBuffer
}

export function createCapture(
  device: GPUDevice,
  dimensions: Dimensions
): CreateCapture {
  const { padded } = getRowPadding(dimensions.width)
  const outputBuffer = device.createBuffer({
    label: 'CaptureBuffer',
    size: padded * dimensions.height,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  })
  const texture = device.createTexture({
    label: 'CaptureTexture',
    size: dimensions,
    format: 'rgba8unorm-srgb',
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
  })
  return {
    outputBuffer,
    texture,
  }
}
