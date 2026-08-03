'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const TOTAL_FRAMES = 117;

export const ScrollHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Preload frames and handle canvas resizing
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    imagesRef.current = loadedImages;

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width > 0 && height > 0) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Preload 117 high-res original frames
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const frameNum = String(i).padStart(4, '0');
      const img = new Image();
      img.src = `/frames/${frameNum}.jpg`;

      img.onload = () => {
        if (i === 1) {
          drawFrame(0);
        }
      };

      loadedImages.push(img);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const images = imagesRef.current;
    if (!images || images.length === 0) return;

    const img = images[frameIndex] || images[0];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;

    const dpr = Math.max(window.devicePixelRatio || 1, 2);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, width, height);

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;

    if (canvasRatio > imgRatio) {
      drawWidth = width;
      drawHeight = width / imgRatio;
    } else {
      drawHeight = height;
      drawWidth = height * imgRatio;
    }

    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
  };

  // Scroll handler with RAF throttle
  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollableDistance = rect.height - windowHeight;

      if (totalScrollableDistance <= 0) return;

      const currentScroll = -rect.top;
      const rawProgress = currentScroll / totalScrollableDistance;
      const clampedProgress = Math.min(Math.max(rawProgress, 0), 1);

      setScrollProgress(clampedProgress);

      const frameIndex = Math.min(
        Math.floor(clampedProgress * TOTAL_FRAMES),
        TOTAL_FRAMES - 1
      );

      animationFrameId = requestAnimationFrame(() => drawFrame(frameIndex));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const textOpacity = Math.max(1 - scrollProgress / 0.35, 0);
  const textTransformY = -scrollProgress * 80;

  const scrollToCatalog = () => {
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: window.innerHeight * 1.8, behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-[250vh] bg-black">
      {/* Sticky Full-Screen Canvas Viewport */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col justify-between items-center bg-black">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover z-10"
        />

        {/* Ambient Overlay Vignette */}
        <div className="absolute inset-0 z-15 pointer-events-none bg-[#043d27]/10 bg-radial from-transparent via-black/20 to-black/70" />

        {/* HEADING OVERLAY */}
        <div
          className="relative z-20 pt-16 sm:pt-24 px-6 flex flex-col items-center text-center transition-all duration-150 ease-out pointer-events-none"
          style={{
            opacity: textOpacity,
            transform: `translateY(${textTransformY}px)`,
          }}
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white drop-shadow-2xl leading-tight">
            Malik Enterprises
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-200 font-medium max-w-md leading-relaxed drop-shadow">
            Shop chairs, electronics, and accessories at unbeatable prices with direct WhatsApp delivery.
          </p>
        </div>

        {/* BOTTOM SCROLL INDICATOR BUTTON */}
        <div
          className="relative z-20 pb-10 transition-opacity duration-150 cursor-pointer"
          style={{ opacity: textOpacity }}
          onClick={scrollToCatalog}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-100 bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/30 shadow-xl hover:bg-white/25 transition-all animate-bounce">
            <span>Scroll or Click to Explore Items</span>
            <ChevronDown className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
