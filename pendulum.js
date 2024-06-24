const vertexShader = `#version 300 es
in vec2 apos;
in vec4 acol;

out vec4 vcol;
// out vec2 vpos;

// vec2 lerp(vec2 a, vec2 b, float t) {
//     return a + (b - a) * t;
// }

void main() {
    vcol = acol;
    
    // vec2 tpos = apos.xy * vec2(1, -1);
    // vpos = tpos;

    gl_Position = vec4(apos, 0, 1);
}`;

const fragmentShader = `#version 300 es
precision highp float;

in vec4 vcol;
// in vec2 vpos;
out vec4 outCol;

vec3 lerp(vec3 a, vec3 b, float t) {
    return a + (b - a) * t;
}

void main () {
    vec3 dark = vec3(20.0 / 255.0, 20.0 / 255.0, 20.0 / 255.0);
    // vec3 light = vec3(0.2 + (vpos.x / 1.6 - 0.25) * 1.0, 0.4, 0.6 + (vpos.y / 2.0 - 0.1) * 1.0) / 1.0; //vec3(240.0 / 255.0, 240.0 / 255.0, 240.0 / 255.0);

    //vec3 col = lerp(dark, vcol.rgb, vcol.a);//pow(max(0.0, min(1.0 - vage.x / 3.0, vage.y) + 0.3), 2.0));
    outCol = vcol;//vec4(col, 1);//vage / 10.0);
}`;

const pendulums = [];

const program = createProgram(
    gl,
    createShader(gl, gl.VERTEX_SHADER, vertexShader),
    createShader(gl, gl.FRAGMENT_SHADER, fragmentShader),
);

const posAttrib = gl.getAttribLocation(program, 'apos'),
    posBuffer = gl.createBuffer();
const colAttrib = gl.getAttribLocation(program, 'acol'),
    colBuffer = gl.createBuffer();

const pvao = gl.createVertexArray();
gl.bindVertexArray(pvao);

let positions = [];
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
gl.enableVertexAttribArray(posAttrib);
gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

const cols = [];
gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cols), gl.STATIC_DRAW);
gl.enableVertexAttribArray(colAttrib);
gl.vertexAttribPointer(colAttrib, 4, gl.FLOAT, false, 0, 0);

gl.viewport(0, 0, width, height);

const arrhalf = [];
const pushPos = (p, i, arr) => {
    arr.push(
        // First point of the line
        // Math.random() * 2 - 1,
        // Math.random() * 2 - 1,
        p.tail[i    ] / width,
        p.tail[i + 1] / height,

        // Second point
        // Math.random() * 2 - 1,
        // Math.random() * 2 - 1,
        p.tail[i + 2] / width,
        p.tail[i + 3] / height,
    );
}
const pushCol = (p, i, arr) => {
    arr.push(
        p.col[0],
        p.col[1],
        p.col[2],
        1 - i / p.tail.length,

        p.col[0],
        p.col[1],
        p.col[2],
        1 - (i + 1) / p.tail.length,
    );
}
const glStuff = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    if (!adult) {
        gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cols), gl.STATIC_DRAW);
    }
}

let adult = false;
const fillBuffer = () => {
    positions.length = 0;
    cols.length = 0;

    for (let i = pendulums[0].tail.length - 2 - 1; i >= 0; i -= 2) {
        for (let j = 0; j < pendulums.length; j ++) {
            const p = pendulums[j];
            pushPos(p, i, positions);
            if (!adult) pushCol(p, i, cols);
        }
    }

    glStuff();
};
const display = () => {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindVertexArray(pvao);

    // Each line has two verticies ( / 2) and each vertex takes 2 floats ( / 2)
    gl.drawArrays(gl.LINES, 0, positions.length / 2 / 2 * 2);
    
};

// Maybe make it adaptive, so more when going fast and fewer when slow?
// This could cause issues where it looks halting and doesn't accurately
// represent anything
const grav = 0.3,
    mass = 10;


class Pendulum {
    static num = 4000;
    static tailLen = 50;
    constructor(theta1, vel1, theta2, vel2, offset) {
        this.point1 = {
            theta: theta1,
            vel: vel1,
        };
        this.point2 = {
            theta: theta2,
            vel: vel2,
        };

        this.tail = [];

        offset = offset / Pendulum.arc + 0.5;
        this.col = degToCol(offset * 0.7 + 0.6);
    }
    update() {
        const a1 = (
            - grav * (2.0 * mass + mass) * Math.sin(this.point1.theta)
            - mass * grav * Math.sin(this.point1.theta - 2.0 * this.point2.theta)
            - 2.0 * Math.sin(this.point1.theta - this.point2.theta) * mass * (this.point2.vel * this.point2.vel * len + this.point1.vel * this.point1.vel * len * Math.cos(this.point1.theta - this.point2.theta))
        ) / (len * (2.0 * mass + mass - mass * Math.cos(2.0 * this.point1.theta - 2.0 * this.point2.theta)));

        const a2 = (
            2.0 * Math.sin(this.point1.theta - this.point2.theta) * (this.point1.vel * this.point1.vel * len * (mass + mass)
            + grav * (mass + mass) * Math.cos(this.point1.theta) + this.point2.vel * this.point2.vel * len * mass * Math.cos(this.point1.theta - this.point2.theta))
        ) / (len * (2.0 * mass + mass - mass * Math.cos(2.0 * this.point1.theta - 2.0 * this.point2.theta)));

        this.point1.theta += this.point1.vel * timestep;
        this.point2.theta += this.point2.vel * timestep;
        this.point1.vel += a1 * timestep;
        this.point2.vel += a2 * timestep;

        

        if (frame % 2 === 0) {
            this.tail.unshift(
                len * (Math.cos(this.point1.theta + Math.PI) + Math.cos(this.point2.theta + Math.PI)),
                len * (Math.sin(this.point1.theta + Math.PI) + Math.sin(this.point2.theta + Math.PI)),
            );

            if (this.tail.length > Pendulum.tailLen) {
                this.tail.pop();
                this.tail.pop();
                this.tail.pop();
                this.tail.pop();
            }
            // console.log(Pendulum.tailLen);
        }


        // point1.vel += timeStep * (-grav * (2.0 * mass + mass) * sin(point1.theta) - mass * grav * sin(point1.theta - 2.0 * point2.theta) - 2.0 * sin(point1.theta - point2.theta) * mass * (point2.vel * point2.vel * length + point1.vel * point1.vel * length * cos(point1.theta - point2.theta))) / (length * (2.0 * mass + mass - mass * cos(2.0 * point1.theta - 2.0 * point2.theta)));
        // point2.vel += timeStep * (2.0 * sin(point1.theta - point2.theta) * (point1.vel * point1.vel * length * (mass + mass) + grav * (mass + mass) * cos(point1.theta) + point2.vel * point2.vel * length * mass * cos(point1.theta - point2.theta))) / (length * (2.0 * mass + mass - mass * cos(2.0 * point1.theta - 2.0 * point2.theta)));
        // point1.theta += timeStep * point1.vel;
        // point2.theta += timeStep * point2.vel;
    }

    static arc = 0.01; // In radians
    static fill() {
        const vel = (Math.random() - 0.5) * 0.02;
        const angle1 = Math.PI,//
            angle2 = Math.PI + (Math.random() - 0.5) * Math.PI;//Math.random() * tau;
        for (let i = 0; i < Pendulum.num; i ++) {
            const offset = (i / Pendulum.num - 0.5) * Pendulum.arc;
            pendulums.push(new Pendulum(angle1 + offset, vel, angle2 + offset, vel, offset));
        }
    }
    static run() {
        for (const p of pendulums) p.update();

        if (frame % 2 === 0) {
            fillBuffer();
            display();
        }
    }
}