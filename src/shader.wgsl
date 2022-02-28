struct Data {
    data: array<u32>;
};

struct Input {
    width: u32;
    height: u32;
    viewport_width: u32;
    viewport_height: u32;
};

//@group(0) @binding(0)
[[group(0), binding(0)]]
var<storage, read_write> outputBuffer: Data;
//@group(0) @binding(1)
[[group(0), binding(1)]]
var<storage, read_write> inputData: Input;


struct Ray {
    origin: vec3<f32>;
    direction: vec3<f32>;
};

fn ray_at(ray: Ray, t: f32) ->  vec3<f32> {
    return ray.origin + t * ray.direction;
}

struct HitRecord {
    point: vec3<f32>;
    normal: vec3<f32>;
    t: f32;
    front_face: bool;
};

// How to use pointers
// https://github.com/gpuweb/gpuweb/discussions/2197?sort=new

fn set_face_normal(hit_record: ptr<function, HitRecord>, ray: Ray, outward_normal: vec3<f32>) {
    if (dot(ray.direction, outward_normal) < 0.0) {
        (*hit_record).front_face = true;
        (*hit_record).normal = outward_normal;
    }  else {
        (*hit_record).front_face = false;
        (*hit_record).normal = -outward_normal;
    }
}

struct Sphere {
    radius: f32;
    center: vec3<f32>;
};

fn hit_sphere(ray: Ray, sphere: Sphere, t_min: f32, t_max: f32, hit_record: ptr<function, HitRecord>) -> bool {
    let oc = ray.origin - sphere.center;
    let a = dot(ray.direction, ray.direction);
    let half_b = dot(oc, ray.direction);
    let c = dot(oc, oc) - sphere.radius*sphere.radius;
    let discriminant = half_b * half_b - a * c;
    if (discriminant < 0.0) {
        return false;
    }
    let sqrtd = sqrt(discriminant);
    var root = (-half_b - sqrtd) / a;
    if (root < t_min || t_max < root) {
        root = (-half_b + sqrtd) / a;
        if (root < t_min || t_max < root) {
            return false;
        }
    }
    let t = root;
    let p = ray_at(ray, t);
    let outward_normal = (p - sphere.center) / sphere.radius;
    (*hit_record).t = t;
    (*hit_record).point = p;
    set_face_normal(hit_record, ray, outward_normal);
    return true;
}

struct SphereList {
    spheres: array<Sphere, 2>;
};

fn sphere_list_hit(sphere_list: ptr<function, SphereList>, ray: Ray, t_min: f32, t_max: f32, hit_record: ptr<function, HitRecord>) -> bool {
    var temp_record = HitRecord(vec3<f32>(0.0, 0.0, 0.0), vec3<f32>(0.0, 0.0, 0.0), 0.0, false);
    var hit_anything = false;
    var closest_so_far = t_max;

    for (var i: i32 = 0; i < 2; i = i+1) {
        if (hit_sphere(ray, (*sphere_list).spheres[i], t_min, closest_so_far, &temp_record)) {
            hit_anything = true;
            closest_so_far = temp_record.t;
            (*hit_record) = temp_record;
        }
    }
    return hit_anything;
}


fn ray_color(ray: Ray, sphere_list: ptr<function, SphereList>) -> vec3<f32> {
    var hit_record = HitRecord(vec3<f32>(0.0, 0.0, 0.0), vec3<f32>(0.0, 0.0, 0.0), 0.0, false);

    if (sphere_list_hit(sphere_list, ray, 0.0001, 10000.0, &hit_record)) {
        return 0.5 * (hit_record.normal + vec3<f32>(1.0, 1.0, 1.0));
    }

    let unit_direction = normalize(ray.direction);
    let t = 0.5 * (unit_direction.y + 1.0);
    return (1.0-t) * vec3<f32>(1.0, 1.0, 1.0) + t * vec3<f32>(0.5, 0.7, 1.0);
}

fn write_color(color: vec3<f32>) -> u32 {
    return (255u << 24u) | (u32(255.999 * color.z) << 16u) | (u32(255.999*color.y) << 8u) | u32(255.999*color.x);
}

[[stage(compute), workgroup_size(8,8)]]
fn main([[builtin(global_invocation_id)]] global_id: vec3<u32>) {
//@stage(compute) @workgroup_size(8,8)
//fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
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

    var sphere_list = SphereList(array<Sphere, 2>(
        Sphere(0.5, vec3<f32>(0.0, 0.0, -1.0)),
        Sphere(100.0, vec3<f32>(0.0, -100.5, -1.0))
        ));

    outputBuffer.data[idx] = write_color(ray_color(ray, &sphere_list));
}
