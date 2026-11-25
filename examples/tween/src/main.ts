import { animate } from "rocket";

const pause = document.getElementById("btn-pause");
const reverse = document.getElementById("btn-reverse");
const play = document.getElementById("btn-play");
const resume = document.getElementById("btn-resume");
const seek = document.getElementById("btn-seek");

let t;
// t = animate(".green", {
//   // y: 335,
//   x: 535,
//   // loop: 1,
//   // alternate: false,
//   duration: 1500,
//   ease: "back-inOut(4)",
//   // ease: "inOut",
//   // ease: steps(12),
//   // ease: cubicBezier(0.77, -0.29, 0.84, 0.96),
//   // ease: cubicBezier(1, -0.5, 0, 1.5),
//   // ease: cubicBezier(0.14, 0.89, 0.93, 0.38),
// });

// STAGGER AND KEYFRAMES

t = animate(".ball", {
  x: 535,

  // // rotate: 180,
  // scale: 0.4,
  // width: 200,
  // height: 100,
  // alternate: true,
  // loopDelay: 500,
  // loop: 1,
  duration: 1500,

  onStart: () => {
    console.log("Animation started");
  },

  onPause: () => {
    console.log("Animation paused");
  },

  onFinish: () => {
    console.log("Animation finished");
  },

  onLoop: () => {
    console.log("Loop occurred");
  },
});

pause!.onclick = () => {
  t.pause();
};

reverse!.onclick = () => {
  console.log("----------------------------");
  t.reverse();
};

play!.onclick = () => {
  t.play();
};

resume!.onclick = () => {
  t.resume();
};

seek!.onclick = () => {
  t.seek(750);
};
