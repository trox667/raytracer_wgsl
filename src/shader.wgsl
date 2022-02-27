struct Data {
    data: array<u32>;
};

[[group(0), binding(0)]]
var<storage, read_write> outputBuffer: Data;

fn write_color(color: vec4<u32>) -> u32 {
    return (color.w << 24u) | (color.z << 16u) | (color.y << 8u) | color.x;
}

[[stage(compute), workgroup_size(1,1)]]
fn main([[builtin(global_invocation_id)]] global_id: vec3<u32>) {
    if (global_id.x >= 256u) {
        return;
    }
    let idx = global_id.x;

    outputBuffer.data[idx] = write_color(vec4<u32>(255u, 0u, 0u, 255u));
}
