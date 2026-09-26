import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

type AnimatedNavIconProps = {
  /** URL to the Lottie JSON file */
  src: string;
  /** Width and height in pixels */
  size?: number;
  /** Optional className for container */
  className?: string;
};

/**
 * Simple wrapper that fetches a Lottie animation from a URL and renders it.
 * Used to give life to navigation icons (e.g., shopping bag, orders, etc.).
 */
export default function AnimatedNavIcon({ src, size = 24, className }: AnimatedNavIconProps) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setAnimationData(json);
      })
      .catch((e) => console.error('Failed to load Lottie animation', e));
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!animationData) return null;

  return (
    <Lottie
      animationData={animationData}
      loop={false}
      style={{ width: size, height: size }}
      className={className}
    />
  );
}
