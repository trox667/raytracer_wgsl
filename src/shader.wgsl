struct Data {
    data: array<u32>;
};

struct Input {
    width: u32;
    height: u32;
};

[[group(0), binding(0)]]
var<storage, read_write> outputBuffer: Data;
[[group(0), binding(1)]]
var<storage, read_write> inputData: Input;

fn write_color(color: vec4<u32>) -> u32 {
    return (color.w << 24u) | (color.z << 16u) | (color.y << 8u) | color.x;
}

[[stage(compute), workgroup_size(1,1)]]
fn main([[builtin(global_invocation_id)]] global_id: vec3<u32>) {
    if (global_id.x >= inputData.width || global_id.y >= inputData.height) {
        return;
    }

    let r = f32(global_id.x) / (f32(inputData.width) - 1.0);
    let g = f32(global_id.y) / (f32(inputData.height) - 1.0);
    let b = 0.25;

    let ir = u32(255.99 * r);
    let ig = u32(255.99 * g);
    let ib = u32(255.99 * b);

    let idx = (global_id.y * 256u) + global_id.x;

    outputBuffer.data[idx] = write_color(vec4<u32>(ir, ig, ib, 255u));
    //outputBuffer.data[idx] = write_color(vec4<u32>(255u, 0u, 0u, 255u));
}
