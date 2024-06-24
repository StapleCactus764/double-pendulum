let frame = 0;
const timestep = 0.35;

const tau = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;

const wrapper = document.getElementById('wrapper'),
    input = document.getElementById('points-input');
input.addEventListener('change', e => {
    const num = +input.value;
    if (num !== Pendulum.num) {
        pendulums.length = 0;
        Pendulum.num = num;
        cols.length = 0;
        adult = false;
        Pendulum.fill();
    }

    console.log(num, Pendulum.num);
});


const degToCol = h => {
    const s = 0.9,
        l = 0.7;
    h *= 360;
    let a=s*Math.min(l,1-l);
    let f= (n,k=(n+h/30)%12) => l - a*Math.max(Math.min(k-3,9-k,1),-1);
    return [f(0),f(8),f(4)];
        // const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    // const p = 2 * l - q;
    // return [degToVal(p, q, h + 1 / 3), degToVal(p, q, h), degToVal(p, q, h - 1 / 3)];
};
// const degToVal = (p, q, t) => {
//     if (t < 1/6) return p + (q - p) * 6 * t;
//     if (t < 1/2) return q;
//     if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
//     return p;
// };

const gl = canvas.getContext('webgl2', {premultipliedAlpha: false});

let len;
let width, height;
const setup = () => {
    width = window.innerWidth * 2;
    height = window.innerHeight * 2;

    canvas.width = width;
    canvas.height = height;

    first = false;

    len =  Math.min(width, height) * 0.8 / 2;
    gl.viewport(0, 0, width, height);
};

setup();

onresize = setup;



gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
   
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
};
const createProgram =(gl, vertexShader, fragmentShader) => {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
};