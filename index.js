setup();

Pendulum.fill();

const loop = () => {
    if (pendulums[0].tail.length === Pendulum.tailLen) adult = true;

    Pendulum.run();
    
    frame ++;
    window.requestAnimationFrame(loop);
};
loop();