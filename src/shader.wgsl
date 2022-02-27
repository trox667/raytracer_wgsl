struct Data {
    data: array<u32>;
};

struct Input {
    width: u32;
    height: u32;
    viewport_width: u32;
    viewport_height: u32;
};

[[group(0), binding(0)]]
var<storage, read_write> outputBuffer: Data;
[[group(0), binding(1)]]
var<storage, read_write> inputData: Input;


struct Ray {
    origin: vec3<f32>;
    direction: vec3<f32>;
};

fn ray_at(ray: Ray, t: f32) ->  vec3<f32> {
    return ray.origin + t * ray.direction;
}

fn ray_color(ray: Ray) -> vec3<f32> {
    let unit_direction = normalize(ray.direction);
    let t = 0.5 * (unit_direction.y + 1.0);
    return (1.0-t) * vec3<f32>(1.0, 1.0, 1.0) + t * vec3<f32>(0.5, 0.7, 1.0);
}


fn write_color(color: vec3<f32>) -> u32 {
    return (255u << 24u) | (u32(255.999 * color.z) << 16u) | (u32(255.999*color.y) << 8u) | u32(255.999*color.x);
}

[[stage(compute), workgroup_size(1,1)]]
fn main([[builtin(global_invocation_id)]] global_id: vec3<u32>) {
    if (global_id.x >= inputData.width || global_id.y >= inputData.height) {
        return;
    }

    let origin = vec3<f32>(0.0, 0.0, 0.0);
    let horizontal = vec3<f32>(f32(inputData.viewport_width), 0.0, 0.0);
    let vertical = vec3<f32>(0.0, f32(inputData.viewport_height), 0.0);
    let lower_left_corner = origin - horizontal / 2.0 - vertical / 2.0 - vec3<f32>(0.0, 0.0, 1.0);

    let u = f32(global_id.x) / ((f32(inputData.width) - 1.0));
    let v = f32(global_id.y) / ((f32(inputData.height) - 1.0));
    let ray = Ray(origin, lower_left_corner + u * horizontal + v * vertical - origin);

    let idx = (global_id.y * inputData.width) + global_id.x;

    outputBuffer.data[idx] = write_color(ray_color(ray));
}
