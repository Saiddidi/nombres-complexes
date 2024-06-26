const canvas = document.getElementById("drawing");
const ctx = canvas.getContext("2d");

const baseRealInput = document.getElementById("baseReal");
const baseImaginaryInput = document.getElementById("baseImaginary");
const maxIterationsInput = document.getElementById("maxIterations");

let baseReal = parseFloat(baseRealInput.value);
let baseImaginary = parseFloat(baseImaginaryInput.value);
let cReal = baseReal;
let cImaginary = baseImaginary;
let maxIterations = parseInt(maxIterationsInput.value);
let useColor = false;

let zoomLevel = 1;
let centerX = 0; // Initial center coordinates
let centerY = 0;

let isDragging = false;
let lastX = 0;
let lastY = 0;

let initialDistance = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawJuliaSet();
}

function drawJuliaSet() {
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const zx = (x - width / 2 + centerX) / ((width / 4) * zoomLevel);
      const zy = (y - height / 2 + centerY) / ((height / 4) * zoomLevel);
      let zr = zx;
      let zi = zy;

      let iterations = 0;
      while (iterations < maxIterations) {
        const zrNew = zr * zr - zi * zi + cReal;
        const ziNew = 2 * zr * zi + cImaginary;
        zr = zrNew;
        zi = ziNew;
        if (zr * zr + zi * zi > 4) break;
        iterations++;
      }

      const index = (x + y * width) * 4;
      if (useColor) {
        if (iterations === maxIterations) {
          data[index] = data[index + 1] = data[index + 2] = 0;
        } else {
          const hue = Math.floor((360 * iterations) / maxIterations);
          const [r, g, b] = hsvToRgb(hue, 1, 1);
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
        }
      } else {
        const brightness = (iterations / maxIterations) * 255;
        data[index] = brightness;
        data[index + 1] = brightness;
        data[index + 2] = brightness;
      }
      data[index + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function hsvToRgb(h, s, v) {
  let f = (n, k = (n + h / 60) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

function updateParametersAndDraw() {
  baseReal = parseFloat(baseRealInput.value);
  baseImaginary = parseFloat(baseImaginaryInput.value);
  cReal = baseReal;
  cImaginary = baseImaginary;
  maxIterations = parseInt(maxIterationsInput.value);
  drawJuliaSet();
}

function toggleColorMode() {
  useColor = !useColor;
  drawJuliaSet();
}

function zoomIn() {
  zoomLevel *= 1.1; // Increase zoom level by 10%
  drawJuliaSet();
}

function zoomOut() {
  zoomLevel /= 1.1; // Decrease zoom level by 10%
  drawJuliaSet();
}

function resetZoom() {
  zoomLevel = 1;
  drawJuliaSet();
}

function saveImage() {
  const originalWidth = canvas.width;
  const originalHeight = canvas.height;

  canvas.width = 1920;
  canvas.height = 1080;

  drawJuliaSet();

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "fractal.png";
  link.click();

  canvas.width = originalWidth;
  canvas.height = originalHeight;
  drawJuliaSet();
}

function handleMouseDown(e) {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
}

function handleMouseMove(e) {
  if (isDragging) {
    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    centerX += deltaX;
    centerY += deltaY;
    lastX = e.clientX;
    lastY = e.clientY;
    drawJuliaSet();
  }
}

function handleMouseUp() {
  isDragging = false;
}

function handleTouchStart(e) {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    isDragging = true;
    lastX = touch.clientX;
    lastY = touch.clientY;
  } else if (e.touches.length === 2) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    initialDistance = Math.sqrt(
      Math.pow(touch1.clientX - touch2.clientX, 2) +
        Math.pow(touch1.clientY - touch2.clientY, 2)
    );
  }
}

function handleTouchMove(e) {
  if (isDragging && e.touches.length === 1) {
    const touch = e.touches[0];
    const deltaX = touch.clientX - lastX;
    const deltaY = touch.clientY - lastY;
    centerX += deltaX;
    centerY += deltaY;
    lastX = touch.clientX;
    lastY = touch.clientY;
    drawJuliaSet();
    e.preventDefault(); // Prevent scrolling on touch devices
  } else if (e.touches.length === 2) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = Math.sqrt(
      Math.pow(touch1.clientX - touch2.clientX, 2) +
        Math.pow(touch1.clientY - touch2.clientY, 2)
    );
    const scaleChange = distance / initialDistance;
    zoomLevel *= scaleChange;
    drawJuliaSet();
  }
}

function handleTouchEnd() {
  isDragging = false;
}

function setupEventListeners() {
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mouseleave", handleMouseUp);

  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchend", handleTouchEnd);
  canvas.addEventListener("touchcancel", handleTouchEnd);

  baseRealInput.addEventListener("input", updateParametersAndDraw);
  baseImaginaryInput.addEventListener("input", updateParametersAndDraw);
  maxIterationsInput.addEventListener("input", updateParametersAndDraw);
  document
    .getElementById("colorToggleButton")
    .addEventListener("click", toggleColorMode);
  document.getElementById("zoomInButton").addEventListener("click", zoomIn);
  document.getElementById("zoomOutButton").addEventListener("click", zoomOut);
  document.getElementById("resetButton").addEventListener("click", resetZoom);
  document
    .getElementById("saveImageButton")
    .addEventListener("click", saveImage);

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 250);
  });

  document.getElementById("menuToggle").addEventListener("click", function () {
    const controls = document.getElementById("controls");
    controls.classList.toggle("show");
  });
}

function init() {
  resizeCanvas();
  setupEventListeners();
  drawJuliaSet();
}

init();
