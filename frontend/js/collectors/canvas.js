/**
 * Canvas 2D fingerprinting.
 * Different GPUs/browsers render pixels slightly differently.
 */

import { sha256 } from '../hash.js';

export async function collectCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 280;
  canvas.height = 60;
  const ctx = canvas.getContext('2d');

  // Draw various shapes and text to maximize GPU-specific variation
  ctx.fillStyle = '#f60';
  ctx.fillRect(10, 1, 62, 20);

  ctx.fillStyle = '#069';
  ctx.font = '15px Arial';
  ctx.fillText('Fingerprint Lab 🦊', 2, 15);

  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.font = '18px Times New Roman';
  ctx.fillText('Canvas Test', 4, 45);

  // Gradient
  const gradient = ctx.createLinearGradient(0, 0, 280, 0);
  gradient.addColorStop(0, '#ff0000');
  gradient.addColorStop(0.5, '#00ff00');
  gradient.addColorStop(1, '#0000ff');
  ctx.fillStyle = gradient;
  ctx.fillRect(100, 1, 160, 20);

  // Arc
  ctx.beginPath();
  ctx.arc(50, 50, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#8844ee';
  ctx.fill();

  // Blend mode text
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#ff6633';
  ctx.font = '14px monospace';
  ctx.fillText('blend test', 130, 55);

  const dataUrl = canvas.toDataURL();
  const hash = await sha256(dataUrl);

  return {
    name: 'Canvas 2D',
    category: 'rendering',
    value: hash,
    displayValue: hash.substring(0, 16) + '...',
    entropy: 8.2,
    description: 'Draws shapes, text, gradients, and emoji on a hidden canvas. Your GPU renders pixels slightly differently than anyone else\'s, producing a unique hash.',
    mitigation: 'Use Firefox with privacy.resistFingerprinting enabled, or install CanvasBlocker extension.',
  };
}
