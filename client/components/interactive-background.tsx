"use client";

import React, { useEffect, useRef } from "react";

interface InteractiveBackgroundProps {
  className?: string;
}

export default function InteractiveBackground({ className = "" }: InteractiveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Mouse interactive tracking with smooth spring interpolation
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      radius: 170,
      isHovered: false,
    };

    // Grid configuration
    const GRID_GAP = 36; // Clean, high-density dot matrix
    let cols = 0;
    let rows = 0;

    // Ripple waves triggered by mouse movement
    interface Ripple {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      speed: number;
      intensity: number;
    }
    const ripples: Ripple[] = [];

    // Animated traveling light beams (packets traveling through grid coordinates)
    interface GridBeam {
      type: "horizontal" | "vertical";
      index: number;
      pos: number;
      speed: number;
      length: number;
      color: string;
      active: boolean;
    }

    const beams: GridBeam[] = [];
    const BEAM_COLORS = [
      "rgba(16, 185, 129,", // Emerald
      "rgba(6, 182, 212,",  // Cyan
      "rgba(52, 211, 153,", // Mint
      "rgba(20, 184, 166,", // Teal
    ];

    const spawnBeam = () => {
      if (beams.length >= 6) return;
      const isHorizontal = Math.random() > 0.5;
      const color = BEAM_COLORS[Math.floor(Math.random() * BEAM_COLORS.length)];
      if (isHorizontal) {
        beams.push({
          type: "horizontal",
          index: Math.floor(Math.random() * rows),
          pos: -100,
          speed: Math.random() * 3 + 2.5,
          length: Math.random() * 180 + 120,
          color,
          active: true,
        });
      } else {
        beams.push({
          type: "vertical",
          index: Math.floor(Math.random() * cols),
          pos: -100,
          speed: Math.random() * 3 + 2.5,
          length: Math.random() * 180 + 120,
          color,
          active: true,
        });
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      cols = Math.ceil(width / GRID_GAP) + 1;
      rows = Math.ceil(height / GRID_GAP) + 1;

      if (!mouse.isHovered) {
        mouse.x = mouse.targetX = width * 0.5;
        mouse.y = mouse.targetY = height * 0.35;
      }
    };

    resize();

    let lastRippleTime = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isHovered = true;

      // Spawn subtle ripple every 180ms of movement
      const now = performance.now();
      if (now - lastRippleTime > 180) {
        if (ripples.length < 5) {
          ripples.push({
            x: e.clientX,
            y: e.clientY,
            radius: 10,
            maxRadius: 220,
            speed: 3.2,
            intensity: 0.35,
          });
        }
        lastRippleTime = now;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.isHovered = true;
      }
    };

    const onMouseLeave = () => {
      mouse.isHovered = false;
      mouse.targetX = width * 0.5;
      mouse.targetY = height * 0.35;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    let time = 0;
    let beamTimer = 0;

    const render = () => {
      time += 0.018;
      beamTimer += 1;

      // Randomly trigger light beam pulses along grid
      if (beamTimer % 110 === 0) {
        spawnBeam();
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse spring interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.intensity *= 0.965;
        if (r.radius >= r.maxRadius || r.intensity < 0.02) {
          ripples.splice(i, 1);
        }
      }

      // Update grid beams
      for (let i = beams.length - 1; i >= 0; i--) {
        const b = beams[i];
        b.pos += b.speed;
        const maxLimit = b.type === "horizontal" ? width + b.length : height + b.length;
        if (b.pos > maxLimit) {
          beams.splice(i, 1);
        }
      }

      const isLight = document.documentElement.classList.contains("light");

      // -------------------------------------------------------------
      // 1. Draw Subtle Connecting Grid Lines (Faint Architectural Grid)
      // -------------------------------------------------------------
      ctx.beginPath();
      // Horizontal subtle lines
      for (let j = 0; j < rows; j++) {
        const y = j * GRID_GAP;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      // Vertical subtle lines
      for (let i = 0; i < cols; i++) {
        const x = i * GRID_GAP;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.04)" : "rgba(229, 228, 226, 0.018)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // -------------------------------------------------------------
      // 2. Draw Traveling Light Beams along Grid
      // -------------------------------------------------------------
      beams.forEach((b) => {
        ctx.beginPath();
        if (b.type === "horizontal") {
          const y = b.index * GRID_GAP;
          const startX = Math.max(0, b.pos - b.length);
          const endX = Math.min(width, b.pos);
          if (endX > startX) {
            const grad = ctx.createLinearGradient(startX, y, endX, y);
            grad.addColorStop(0, `${b.color} 0)`);
            grad.addColorStop(0.7, `${b.color} 0.22)`);
            grad.addColorStop(1, `${b.color} 0.5)`);
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        } else {
          const x = b.index * GRID_GAP;
          const startY = Math.max(0, b.pos - b.length);
          const endY = Math.min(height, b.pos);
          if (endY > startY) {
            const grad = ctx.createLinearGradient(x, startY, x, endY);
            grad.addColorStop(0, `${b.color} 0)`);
            grad.addColorStop(0.7, `${b.color} 0.22)`);
            grad.addColorStop(1, `${b.color} 0.5)`);
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      });

      // -------------------------------------------------------------
      // 3. Draw Dots with Ambient Wave & Mouse Spotlight Interaction
      // -------------------------------------------------------------
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * GRID_GAP;
          const y = j * GRID_GAP;

          // 1. Ambient breathing wave animation across the dot matrix
          const wavePhase = Math.sin(x * 0.007 + y * 0.007 + time * 1.4);
          let alpha = 0.038 + wavePhase * 0.015;
          let radius = 1.0;
          let color = isLight ? "15, 23, 42" : "229, 228, 226"; // adapts between light slate and platinum

          // 2. Mouse distance & spotlight illumination
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.hypot(dx, dy);

          if (dist < mouse.radius) {
            const factor = Math.pow(1 - dist / mouse.radius, 2);
            // Smoothly illuminate dot
            alpha = 0.04 + factor * 0.45;
            radius = 1.0 + factor * 1.8;

            // Brand color shift near mouse
            if (factor > 0.4) {
              color = "52, 211, 153"; // Emerald glow
            } else if (factor > 0.15) {
              color = "6, 182, 212";  // Cyan glow
            }
          }

          // 3. Ripples expansion interaction
          for (let r = 0; r < ripples.length; r++) {
            const rip = ripples[r];
            const ripDist = Math.abs(Math.hypot(x - rip.x, y - rip.y) - rip.radius);
            if (ripDist < 28) {
              const ripFactor = (1 - ripDist / 28) * rip.intensity;
              alpha = Math.min(alpha + ripFactor * 0.35, 0.7);
              radius = Math.max(radius, 1.0 + ripFactor * 1.4);
              color = "16, 185, 129";
            }
          }

          // 4. Highlight dots intersected by traveling beams
          beams.forEach((b) => {
            if (b.type === "horizontal" && b.index === j) {
              if (x >= b.pos - b.length && x <= b.pos) {
                alpha = Math.min(alpha + 0.3, 0.65);
                radius = Math.max(radius, 1.6);
                color = "52, 211, 153";
              }
            } else if (b.type === "vertical" && b.index === i) {
              if (y >= b.pos - b.length && y <= b.pos) {
                alpha = Math.min(alpha + 0.3, 0.65);
                radius = Math.max(radius, 1.6);
                color = "6, 182, 212";
              }
            }
          });

          // Draw the dot
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color}, ${alpha})`;
          ctx.fill();
        }
      }

      // -------------------------------------------------------------
      // 4. Soft Vignette Mask to keep content readable
      // -------------------------------------------------------------
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        width * 0.2,
        width * 0.5,
        height * 0.45,
        width * 0.75
      );
      const vRgb = isLight ? "253, 251, 247" : "5, 5, 5";
      vignette.addColorStop(0, `rgba(${vRgb}, 0)`);
      vignette.addColorStop(0.7, `rgba(${vRgb}, 0.15)`);
      vignette.addColorStop(1, `rgba(${vRgb}, 0.65)`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
    />
  );
}
