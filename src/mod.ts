import { copyToBuffer, Dimensions } from './webgpu.ts'
import { createCapture } from './capture.ts'
import { createPNG } from './png.ts'

const dimensions: Dimensions = {
  width: 200,
  height: 200,
}

const adapter = await navigator.gpu.requestAdapter()
const device = await adapter?.requestDevice()

if (!device) {
  console.error('Not able to request device')
  Deno.exit(1)
}

const shaderModule = device.createShaderModule({
  code: Deno.readTextFileSync(new URL('./shader.wgsl', import.meta.url)),
})
const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [] })
const renderPipeline = device.createRenderPipeline({
  layout: pipelineLayout,
  vertex: {
    module: shaderModule,
    entryPoint: 'vs_main',
  },
  fragment: {
    module: shaderModule,
    entryPoint: 'fs_main',
    targets: [
      {
        format: 'rgba8unorm-srgb',
      },
    ],
  },
})

const { texture, outputBuffer } = createCapture(device, dimensions)
const encoder = device.createCommandEncoder()
const renderPass = encoder.beginRenderPass({
  colorAttachments: [
    {
      view: texture.createView(),
      storeOp: 'store',
      loadValue: [0, 1, 0, 1],
    },
  ],
})
renderPass.setPipeline(renderPipeline)
renderPass.draw(3, 1)
renderPass.endPass()
copyToBuffer(encoder, texture, outputBuffer, dimensions)
device.queue.submit([encoder.finish()])

await createPNG(outputBuffer, dimensions)
