'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const TOTAL_FRAMES = 38;

export const ScrollHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Preload all 38 image frames into memory
  useEffect(() => {
    let loadedCount = 0;
    const imgArray: HTMLImageElement[] = [];

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const frameNum = String(i).padStart(3, '0');
      const img = new Image();
      img.src = `/frames/ezgif-frame-${frameNum}.jpg`;

      img.onload = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          setIsLoaded(true);
        }
      };

      imgArray.push(img);
    }

    setImages(imgArray);
  }, []);

  // Draw full-bleed canvas using object-cover scaling math
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas || images.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = images[frameIndex];
    if (!img || !img.complete) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

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
  };

  // Scroll listener to compute progress and trigger frame drawing
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
    window.addEventListener('resize', handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [images, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      drawFrame(0);
    }
  }, [isLoaded]);

  // Text Animation Math: Fade out slowly as user scrolls past 30% (0.3)
  const textOpacity = Math.max(1 - scrollProgress / 0.3, 0);
  const textTransformY = -scrollProgress * 60;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[280vh] bg-black"
    >
      {/* Sticky Full-Screen Canvas Viewport */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col justify-between items-center bg-black">
        {/* Full Bleed HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover z-10"
        />

        {/* Ambient Overlay Vignette */}
        <div className="absolute inset-0 z-15 pointer-events-none bg-radial from-transparent via-black/10 to-black/50" />

        {/* TOP SHIFTED HEADING OVERLAY - Positioned higher so it doesn't overlap product */}
        <div
          className="relative z-20 pt-16 sm:pt-20 lg:pt-24 px-6 flex flex-col items-center text-center pointer-events-none transition-all duration-150 ease-out"
          style={{
            opacity: textOpacity,
            transform: `translateY(${textTransformY}px)`,
          }}
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white drop-shadow-2xl leading-tight">
            Malik Enterprises
          </h1>

          <p className="mt-2 text-sm sm:text-base text-slate-200 font-medium max-w-md leading-relaxed drop-shadow">
            Quality Refurbished Goods, Unbeatable Prices
          </p>
        </div>

        {/* BOTTOM SCROLL INDICATOR PILL */}
        <div
          className="relative z-20 pb-10 pointer-events-none transition-opacity duration-150"
          style={{ opacity: textOpacity }}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg animate-bounce">
            <span>Scroll down to explore product line</span>
            <ChevronDown className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
