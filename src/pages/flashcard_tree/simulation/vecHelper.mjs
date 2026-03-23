//Generic vector helpers (Vector in form {x, y})

function sub(vec1, vec2) {
    return { x: vec1.x - vec2.x, y: vec1.y - vec2.y };
}

function add(vec1, vec2) {
    return { x: vec1.x + vec2.x, y: vec1.y + vec2.y };
}

function dist(vec1, vec2) {
    return Math.sqrt(((vec1.x - vec2.x) ** 2) + ((vec1.y - vec2.y) ** 2));
}

function mul(vec1, vec2) {
    return { x: vec1.x * vec2.x, y: vec1.y * vec2.y };
}

function scale(vec, scalar) {
    return { x: vec.x * scalar, y: vec.y * scalar };
}

function clamp(vec, maxLength) {
    const length = dist({ x: 0, y: 0 }, vec);
    if (length > maxLength) {
        const scaleFactor = maxLength / length;
        return scale(vec, scaleFactor);
    }
    return vec;
}

function dot(vec1, vec2) { //Dot product can be used to tell approximatley how aligned 2 vectors are (1 = same direction, 0 = perpendicular, -1 = opposite direction)
    return vec1.x * vec2.x + vec1.y * vec2.y;
}

function dotNorm(vec1, vec2) { //Dot product of normalized vectors, gives a more accurate alignment measure that is not affected by vector length
    const length1 = dist({ x: 0, y: 0 }, vec1);
    const length2 = dist({ x: 0, y: 0 }, vec2);
    if (length1 === 0 || length2 === 0) {
        return 0; // If either vector has zero length, we consider them not aligned
    }
    const normVec1 = { x: vec1.x / length1, y: vec1.y / length1 };
    const normVec2 = { x: vec2.x / length2, y: vec2.y / length2 };
    return dot(normVec1, normVec2);
}

//Package it in a Vec name so access is Vec.sub, very similar like Math.sqrt
export const Vec = {
    sub,
    add,
    dist,
    mul,
    scale,
    clamp,
    dot,
    dotNorm,
}