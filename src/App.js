import React, { useRef, useState } from 'react';
import './App.css';

function App() {
  const [pixelInfo, setPixelInfo] = useState('');
  const originalCanvasRef = useRef(null);
  const smoothedCanvasRef = useRef(null);
  const [imageData, setImageData] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = originalCanvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        setImageData(ctx.getImageData(0, 0, img.width, img.height));

        const smoothedCanvas = smoothedCanvasRef.current;
        smoothedCanvas.width = img.width;
        smoothedCanvas.height = img.height;
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const getIndex = (x, y, width) => (y * width + x) * 4;

  const smoothImage = () => {
    const neighborhoodSize = parseInt(document.getElementById('neighborhood').value);
    const toGray = document.getElementById('grayscale').checked;

    if (!imageData) return;
    const width = imageData.width;
    const height = imageData.height;
    const input = imageData.data;
    const output = new Uint8ClampedArray(input.length);
    const half = Math.floor(neighborhoodSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        for (let dy = -half; dy <= half; dy++) {
          for (let dx = -half; dx <= half; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
              const idx = getIndex(nx, ny, width);
              let pr = input[idx], pg = input[idx + 1], pb = input[idx + 2], pa = input[idx + 3];
              if (toGray) {
                const gray = (pr + pg + pb) / 3;
                r += gray; g += gray; b += gray;
              } else {
                r += pr; g += pg; b += pb;
              }
              a += pa;
              count++;
            }
          }
        }
        const idx = getIndex(x, y, width);
        output[idx] = r / count;
        output[idx + 1] = g / count;
        output[idx + 2] = b / count;
        output[idx + 3] = a / count;
      }
    }
    const ctx = smoothedCanvasRef.current.getContext('2d');
    const outputData = new ImageData(output, width, height);
    ctx.putImageData(outputData, 0, 0);
  };

  const handleMouseMove = (e) => {
    const rect = originalCanvasRef.current.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    const ctx = originalCanvasRef.current.getContext('2d');
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    setPixelInfo(`(${x}, ${y}): R=${pixel[0]}, G=${pixel[1]}, B=${pixel[2]}, A=${pixel[3]}`);
  };

  return (
    <div className="container">
      <h2>React Image Smoothing Filter</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <label>
        <input type="checkbox" id="grayscale" /> Convert to Grayscale First
      </label>
      <label>
        Neighborhood Size:
        <select id="neighborhood">
          <option value="3">3x3</option>
          <option value="5">5x5</option>
        </select>
      </label>
      <button onClick={smoothImage}>Smooth Image</button>

      <div className="canvas-row">
        <div>
          <h4>Original Image</h4>
          <canvas ref={originalCanvasRef} onMouseMove={handleMouseMove}></canvas>
          <div>{pixelInfo}</div>
        </div>
        <div>
          <h4>Smoothed Image</h4>
          <canvas ref={smoothedCanvasRef}></canvas>
        </div>
      </div>
    </div>
  );
}

export default App;
