// import { createPNG } from "./png.ts";
import { Dimensions } from "./types.ts";
import { createBufferInit, createOutputBuffer } from "./BufferUtils.ts";
import shaderWGSL from 'bundle-text:./shader.wgsl'

const aspect_ratio = 16.0 / 9.0
const width = 1024;
// const aspect_ratio = 1.0;
const dimensions: Dimensions = {
  width,
  height: Math.ceil(width / aspect_ratio),
};
async function init() {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter?.requestDevice();

  if (device) {

    const viewport_height = 2;
    const viewport_width = aspect_ratio * viewport_height;
    const focal_length = 1;

    const outputBuffer = createOutputBuffer(device, dimensions);
    const inputBuffer = createBufferInit(device, {
      label: "InputBuffer",
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC |
        GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      contents: new Uint32Array([
        dimensions.width,
        dimensions.height,
        viewport_width,
        viewport_height,
      ]).buffer,
    });

    const shaderModule = device.createShaderModule({
      // code: Deno.readTextFileSync(new URL("./shader.wgsl", import.meta.url)),
      code: shaderWGSL
    });

    const computePipeline = device.createComputePipeline({
      layout: "auto",
      compute: {
        module: shaderModule,
        entryPoint: "main",
      },
    });

    const bindGroupLayout = computePipeline.getBindGroupLayout(0);
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
    });

    const stagingBuffer = device.createBuffer({
      size: dimensions.width * dimensions.height * 4,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    const encoder = device.createCommandEncoder();
    const computePass = encoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, bindGroup);
    computePass.dispatchWorkgroups(
      Math.ceil(dimensions.width / 8),
      Math.ceil(dimensions.height / 8),
    );
    computePass.end();

    encoder.copyBufferToBuffer(
      outputBuffer,
      0,
      stagingBuffer,
      0,
      dimensions.width * dimensions.height * 4,
    );

    device.queue.submit([encoder.finish()]);

    await stagingBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = stagingBuffer.getMappedRange();
    console.log(new Uint8Array(arrayBuffer));
    draw(new Uint8Array(arrayBuffer));
    // await createPNG(new Uint8Array(arrayBuffer), dimensions);
    stagingBuffer.unmap();
  }
}

function draw(buffer: Uint8Array) {
  const canvas = document.getElementById('canvas');
  canvas?.setAttribute('width', dimensions.width)
  canvas?.setAttribute('height', dimensions.height)

  const ctx = (canvas as HTMLCanvasElement)?.getContext('2d')
  const pixels = new Uint8ClampedArray(buffer);
  const imageData = new ImageData(pixels, dimensions.width, dimensions.height);
  ctx?.putImageData(imageData, 0, 0)
}

init().then(() => {});
