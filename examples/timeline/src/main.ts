import { createTimeline } from "rocket";

const pause = document.getElementById("btn-pause");
const reverse = document.getElementById("btn-reverse");
const play = document.getElementById("btn-play");
const resume = document.getElementById("btn-resume");
const seek = document.getElementById("btn-seek");

let t = createTimeline({
  loop: 2,
  alternate: true,
  // loopDelay: 500, rocket-animation
  duration: 1000,
});

t.add(".green", {
  x: "535px",
  scale: 0.7,
  rotate: 180,
  onStart: () => {
    console.log("Green Started");
  },
  onFinish: () => {
    console.log("Green Finished");
  },
})
  .add(".yellow", {
    x: 535,
    scale: 0.4,
    onStart: (flow) => {
      console.log("yellow Started ", flow?.time);
    },
    onFinish: (flow) => {
      console.log("yellow Finished", flow?.time);
    },
  })
  .add(".red", {
    x: 535,
    onStart: () => {
      console.log("Red Started");
    },
    onFinish: () => {
      console.log("Red Finished");
    },
  });

// const b = animate(".blue", { x: 535, duration: 1500, delay: 500 });

// t.add(".green", {
//   x: 535,
//   // scale: 0.5,
//   rotate: 180,
//   duration: 1500,
// })
//   .add(".green", {
//     y: 70,
//     scale: 0.3,
//     duration: 1500,
//   })
//   .add(".green", {
//     x: 0,
//     duration: 1500,
//   })
//   .add(".green", {
//     y: 0,
//     scale: 1,
//     duration: 1500,
//   });

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
  t.seek(1500);
};
