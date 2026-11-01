import { animate } from "../../packages/src/index";

const pause = document.getElementById("btn-pause");
const reverse = document.getElementById("btn-reverse");
const play = document.getElementById("btn-play");
const resume = document.getElementById("btn-resume");
const seek = document.getElementById("btn-seek");

animate.from(".ball", {});

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
  rotate: 180,
  // scale: 0.4,
  // from: true,

  stagger: {
    each: 500,
    from: 4,

    // loop: 2,
    // alternate: true,
  },
  // alternate: true,
  // loop: 1,
  duration: 1000,
});

// t = animate(".green", {
//   // x: [0, 535, 535, 0, 0],
//   // y: [0, 0, 100, 100, 0],
//   x: [0, { to: 535, duration: 1500 }, { to: 535, duration: 1000 }, 0, 0],
//   y: [
//     { to: 100, duration: 500 },
//     { to: 0, duration: 500, delay: 1500 },
//   ],
//   // from: true,
//   loop: 2,
//   rotate: 360,
//   alternate: true,
//   duration: 2000,
// });

// t = animate(".green", {
//   // width: [500, 200],
//   // width: 200,
//   x: [535, 300],
//   // x: 535,
//   // scale: 0.5,
//   // loop: 1,
//   // alternate: true,
//   from: true,
//   duration: 1000,
// });

/** KEYFRAMES */

// t = animate(".green", {
//   keyframes: {
//     // x: [0, 535, 535, 0, 0],
//     // y: [0, 0, 100, 100, 0],

//     "0%": { x: 0, y: 0, scale: 1 },
//     "25%": { x: 535, y: 0, scale: 0.5 },
//     "50%": { x: 535, y: 100, scale: 0.5 },
//     "75%": { x: 0, y: 100, scale: 1 },
//     "100%": { x: 0, y: 0, scale: 1 },
//   },
//   rotate: 360,
//   // scale: 0.5,
//   // loop: 2,
//   // alternate: true,
//   // from: true,
//   duration: 4000,
// });

// t = animate(".green", {
//   keyframes: [
//     { x: 0, y: 0 },
//     { x: 535, y: 0, duration: 1000 },
//     { x: 535, y: 100 },
//     { x: 0, y: 100 },
//     { x: 0, y: 0 },
//   ],
//   rotate: 360,
//   // scale: 0.5,
//   loop: 2,
//   alternate: true,
//   // from: true,
//   duration: 4000,
// });

pause.onclick = () => {
  t.pause();
};

reverse.onclick = () => {
  console.log("----------------------------");
  t.reverse();
};

play.onclick = () => {
  t.play();
};

resume.onclick = () => {
  t.resume();
};

seek.onclick = () => {
  t.seek(1000);
};

// start.onclick = () => {
//   // t.animate(".yellow", "left", { duration: 1000, to: 420 });
// };

/**
 * Splits a cubic Bézier curve at parameter t (0 to 1).
 * Points are objects: { x: number, y: number }
 */
function splitCubicBezier(p0, p1, p2, p3, t = 0.5) {
  // First level
  const a = lerpPoint(p0, p1, t);
  const b = lerpPoint(p1, p2, t);
  const c = lerpPoint(p2, p3, t);

  // Second level
  const d = lerpPoint(a, b, t);
  const e = lerpPoint(b, c, t);

  // Split point on the curve
  const f = lerpPoint(d, e, t);

  return {
    left: [p0, a, d, f], // First segment:  C a.x a.y, d.x d.y, f.x f.y
    right: [f, e, c, p3], // Second segment: C e.x e.y, c.x c.y, p3.x p3.y
  };
}

function lerpPoint(pA, pB, t) {
  return {
    x: pA.x + (pB.x - pA.x) * t,
    y: pA.y + (pB.y - pA.y) * t,
  };
}
