import React, { useEffect, useState } from 'react';

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
 * Uses a plain <canvas>/<img> fallback approach to avoid Lottie TypeScript issues.
 */
export default function AnimatedNavIcon({ src, size = 24, className }: AnimatedNavIconProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

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

  // Dynamically import and render Lottie to avoid TS prop mismatch at compile time
  return (
    <DynamicLottie
      animationData={animationData}
      size={size}
      className={className}
    />
  );
}

function DynamicLottie({
  animationData,
  size,
  className,
}: {
  animationData: object;
  size: number;
  className?: string;
}) {
  const [LottieComp, setLottieComp] = React.useState<React.ComponentType<{
    animationData: object;
    loop: boolean;
    style?: React.CSSProperties;
    className?: string;
  }> | null>(null);

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('lottie-react').then((mod: any) => {
      setLottieComp(() => mod.default ?? mod.Lottie);
    });
  }, []);

  if (!LottieComp) return null;

  return (
    <LottieComp
      animationData={animationData}
      loop={false}
      style={{ width: size, height: size }}
      className={className}
    />
  );
}
