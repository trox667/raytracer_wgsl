import { createPNG } from './png.ts'
import { Dimensions } from './types.ts'
import { createBufferInit, createOutputBuffer } from './BufferUtils.ts'

const adapter = await navigator.gpu.requestAdapter()
const device = await adapter?.requestDevice()

if (!device) {
  console.error('Unable to request device')
  Deno.exit(1)
}

const dimensions: Dimensions = {
  width: 256,
  height: 256,
}

const outputBuffer = createOutputBuffer(device, dimensions)
const inputBuffer = createBufferInit(device, {
  label: 'InputBuffer',
  usage:
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  contents: new Uint32Array([256, 256]).buffer,
})

const shaderModule = device.createShaderModule({
  code: Deno.readTextFileSync(new URL('./shader.wgsl', import.meta.url)),
})

const computePipeline = device.createComputePipeline({
  compute: {
    module: shaderModule,
    entryPoint: 'main',
  },
})

const bindGroupLayout = computePipeline.getBindGroupLayout(0)
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    {
      binding: 0,
      resource: { buffer: outputBuffer },
    },
    {
      binding: 1,
      resource: { buffer: inputBuffer },
    },
  ],
})

const encoder = device.createCommandEncoder()
const computePass = encoder.beginComputePass()
computePass.setPipeline(computePipeline)
computePass.setBindGroup(0, bindGroup)
computePass.dispatch(dimensions.width, dimensions.height)
computePass.endPass()

device.queue.submit([encoder.finish()])

await outputBuffer.mapAsync(GPUMapMode.READ)
const arrayBuffer = outputBuffer.getMappedRange()
await createPNG(new Uint8Array(arrayBuffer), dimensions)
outputBuffer.unmap()
