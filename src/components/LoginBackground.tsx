import { keyframes, styled } from '@mui/material/styles';
import { useEffect, useState, useRef } from 'react';

// ===== ANIMATION TIMING CONFIGURATION =====
const LINE_ANIMATION_DURATION = 10; // Duration in seconds for each line animation
const NUM_LINES_PER_BATCH = 2; // Number of overlapping lines
const STAGGER_DELAY = 4; // Delay between each line start (in seconds)

// Calculated values
const BATCH_INTERVAL = LINE_ANIMATION_DURATION; // Generate new batch every X seconds
const MAX_DELAY = (NUM_LINES_PER_BATCH - 1) * STAGGER_DELAY; // Maximum delay for last line
const CLEANUP_TIMEOUT = (LINE_ANIMATION_DURATION + MAX_DELAY) * 1000; // When to remove old batches (in ms)

// Generate smooth curved path using Catmull-Rom spline
const generatePath = (width: number, height: number) => {
  const points = 12;
  // Extend width by 10% (5% on each side)
  const extendedWidth = width * 1.1;
  const offsetX = width * -0.05; // Start 5% to the left
  
  // Generate control points
  const controlPoints: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const x = offsetX + (i / points) * extendedWidth;
    const y = Math.random() * height * 0.9 + height * 0.05;
    controlPoints.push([x, y]);
  }
  
  let path = `M ${controlPoints[0][0]},${controlPoints[0][1]}`;
  
  // Create smooth cubic Bézier curves between points
  for (let i = 0; i < controlPoints.length - 1; i++) {
    const [x0, y0] = controlPoints[Math.max(0, i - 1)];
    const [x1, y1] = controlPoints[i];
    const [x2, y2] = controlPoints[i + 1];
    const [x3, y3] = controlPoints[Math.min(controlPoints.length - 1, i + 2)];
    
    // Calculate control points for smooth curve (Catmull-Rom to Bezier conversion)
    const tension = 0.9;
    const cp1x = x1 + (x2 - x0) / 6 * tension;
    const cp1y = y1 + (y2 - y0) / 6 * tension;
    const cp2x = x2 - (x3 - x1) / 6 * tension;
    const cp2y = y2 - (y3 - y1) / 6 * tension;
    
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
  }
  
  return path;
};

const getPathLength = (width: number, height: number) => {
  // Account for extended width
  const extendedWidth = width * 1.1;
  return Math.sqrt(extendedWidth * extendedWidth + height * height) * 1.5;
};

const AnimatedPath = styled('path')<{ delay: number; pathLength: number }>`
  stroke: rgba(226, 226, 226, 0.3);
  stroke-width: 10;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: ${props => props.pathLength};
  stroke-dashoffset: ${props => props.pathLength};
  animation: ${keyframes`
    0% {
      stroke-dashoffset: var(--path-length);
      opacity: 0;
    }
    5% {
      opacity: 0.6;
      stroke-dashoffset: var(--path-length);
    }
    95% {
      opacity: 0.6;
      stroke-dashoffset: 0;
    }
    100% {
      opacity: 0;
      stroke-dashoffset: 0;
    }
  `} ${LINE_ANIMATION_DURATION}s linear;
  animation-delay: ${props => props.delay}s;
  animation-fill-mode: forwards;
  --path-length: ${props => props.pathLength}px;
`;

const BackgroundSvg = styled('svg')`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.5;
  overflow: hidden;
`;

const LoginBackground = () => {
  const [pathBatches, setPathBatches] = useState<Array<{ id: number; paths: string[] }>>([]);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const pendingDimensionsRef = useRef<{ width: number; height: number } | null>(null);
  const batchIdRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      pendingDimensionsRef.current = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const generateNewBatch = () => {
      // Check if there's a pending dimension update
      if (pendingDimensionsRef.current) {
        setDimensions(pendingDimensionsRef.current);
        pendingDimensionsRef.current = null;
        return;
      }

      // Create a batch of paths
      const newPaths = Array.from({ length: NUM_LINES_PER_BATCH }, () =>
        generatePath(dimensions.width, dimensions.height)
      );

      const newBatch = {
        id: batchIdRef.current++,
        paths: newPaths
      };

      // Add new batch
      setPathBatches(prev => [...prev, newBatch]);

      // Remove old batches after animation completes
      setTimeout(() => {
        setPathBatches(prev => prev.filter(batch => batch.id !== newBatch.id));
      }, CLEANUP_TIMEOUT);
    };

    // Only generate initial batch once
    if (!isInitializedRef.current) {
      generateNewBatch();
      isInitializedRef.current = true;
    }

    // Generate new batch at regular intervals
    const interval = setInterval(generateNewBatch, BATCH_INTERVAL * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [dimensions]);

  const pathLength = getPathLength(dimensions.width, dimensions.height);

  return (
    <BackgroundSvg 
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} 
      preserveAspectRatio="none"
    >
      {pathBatches.flatMap((batch) =>
        batch.paths.map((path, index) => (
          <AnimatedPath
            key={`${batch.id}-${index}`}
            d={path}
            delay={index * STAGGER_DELAY}
            pathLength={pathLength}
          />
        ))
      )}
    </BackgroundSvg>
  );
};

export default LoginBackground;