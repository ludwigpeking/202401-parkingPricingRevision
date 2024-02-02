function toggleB3() {
  var moreFloorsCheckbox = document.getElementById("moreFloors");
  var B3Button = document.getElementById("B3");
  if (moreFloorsCheckbox.checked) {
    B3Button.style.display = "inline-block";
  } else {
    B3Button.style.display = "none";
  }
}

// Example canvas zoom functionality (basic concept)
const canvas = document.getElementById("canvasArea");
const ctx = canvas.getContext("2d");

let scale = 1;
const scaleStep = 0.1;
const minScale = 1;
const maxScale = 10;

canvas.onwheel = (e) => {
  e.preventDefault();
  const direction = e.deltaY < 0 ? 1 : -1;
  scale += scaleStep * direction;
  scale = Math.min(Math.max(minScale, scale), maxScale);
  console.log(scale); // Here you'd actually apply scaling to your canvas drawing
};
