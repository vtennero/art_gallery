import React, { useRef } from 'react';

type Image = {
  id: number;
  href?: string;
  imageSrc: string;
  name: string;
  worktype: string;
  year: number;
  rank: number;
};

// Grid positions for the 8 spinning images
const gridPositions = [
  { x1: 2, x2: 6, y1: 1, y2: 4 },
  { x1: 6, x2: 8, y1: 2, y2: 4 },
  { x1: 1, x2: 4, y1: 4, y2: 7 },
  { x1: 4, x2: 7, y1: 4, y2: 7 },
  { x1: 7, x2: 9, y1: 4, y2: 6 },
  { x1: 2, x2: 4, y1: 7, y2: 9 },
  { x1: 4, x2: 7, y1: 7, y2: 10 },
  { x1: 7, x2: 10, y1: 6, y2: 9 }
];

interface OpeningSequenceProps {
  spinningImages: Image[];
  backgroundImages: Image[];
  scrollProgress: number;
  isTransitioning: boolean;
}

/**
 * Opening sequence component with spinning grid animation and background columns
 * Displays an animated introduction before transitioning to the main gallery
 */
export default function OpeningSequence({ 
  spinningImages, 
  backgroundImages, 
  scrollProgress, 
  isTransitioning 
}: OpeningSequenceProps) {
  const gridRef = useRef<HTMLUListElement>(null);

  return (
    <div 
      style={{ 
        height: '300vh', 
        width: '100vw', 
        overflowX: 'hidden',
        opacity: isTransitioning ? 0 : 1,
        transition: 'opacity 0.8s ease-out'
      }}
    >
      {/* Background images grid - animated columns */}
      <div className="background-grid">
        {[0, 1, 2, 3, 4, 5].map(columnIndex => (
          <div key={columnIndex} className={`bg-column bg-column-${columnIndex + 1}`}>
            {/* Triple images for seamless loop */}
            {[...(backgroundImages || []).filter((_, i) => i % 6 === columnIndex), 
              ...(backgroundImages || []).filter((_, i) => i % 6 === columnIndex), 
              ...(backgroundImages || []).filter((_, i) => i % 6 === columnIndex)
            ].map((image, index) => (
              <div key={`bg-${columnIndex + 1}-${image.id}-${index}`} className="bg-item">
                <img
                  src={image.imageSrc}
                  alt={image.name}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Fixed spinning grid container */}
      <main>
        <ul 
          ref={gridRef}
          className="image-grid"
          style={{
            transform: `translate(-50%, -50%) scale(${0.5 + (0.5 * scrollProgress)}) rotate(${270 * scrollProgress}deg)`
          }}
        >
          {(spinningImages || []).map((image, index) => {
            const position = gridPositions[index] || gridPositions[0];
            
            // Index 3 is the center image with special zoom effect
            const isCenterImage = index === 3;
            const centerScale = isCenterImage ? 1 + (scrollProgress * 0.4) : 1;
            
            // Scatter animation when scroll > 0.8
            const scatterProgress = scrollProgress > 0.8 ? (scrollProgress - 0.8) / 0.2 : 0;
            const scatterDirections = [
              { x: -200, y: -150 }, // Top-left
              { x: 200, y: -150 },  // Top-right
              { x: -250, y: 0 },    // Left
              { x: 0, y: 0 },       // Center (stays)
              { x: 250, y: 0 },     // Right
              { x: -200, y: 150 },  // Bottom-left
              { x: 0, y: 200 },     // Bottom
              { x: 200, y: 150 }    // Bottom-right
            ];
            const scatter = scatterDirections[index] || { x: 0, y: 0 };
            const scatterX = scatter.x * scatterProgress;
            const scatterY = scatter.y * scatterProgress;
            
            // Fade out animation at the end
            const fadeProgress = scrollProgress > 0.9 ? (scrollProgress - 0.9) / 0.1 : 0;
            const opacity = 1 - fadeProgress;
            
            return (
              <li
                key={image.id}
                style={{
                  '--x1': position.x1,
                  '--x2': position.x2,
                  '--y1': position.y1,
                  '--y2': position.y2,
                  opacity: opacity,
                  transition: 'opacity 0.1s ease-out'
                } as React.CSSProperties}
              >
                <img
                  src={image.imageSrc}
                  alt={image.name}
                  style={{
                    transform: `translate(calc(-50% + ${scatterX}px), calc(-50% + ${scatterY}px)) rotate(${-270 * scrollProgress}deg) scale(${centerScale})`,
                    transition: 'transform 0.1s ease-out'
                  }}
                />
              </li>
            );
          })}
        </ul>
      </main>

      {/* Opening sequence styles */}
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .image-grid {
          --big-tile-size: 50vmin;
          --scale: 0.5;
          --tile-size: calc(var(--big-tile-size) / 3);
          list-style-type: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 1vmin;
          grid-template: repeat(9, var(--tile-size)) / repeat(9, var(--tile-size));
          position: fixed;
          top: 50%;
          left: 50%;
          transition: transform 0.1s ease-out;
        }

        /* Mobile: smaller starting size to fit screen width */
        @media (max-width: 768px) {
          .image-grid {
            --big-tile-size: 70vw;
            --scale: 0.6;
          }
        }

        .image-grid img {
          height: 140% !important;
          min-width: 140% !important;
          aspect-ratio: 1;
          object-fit: cover !important;
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform-origin: center center;
          transition: transform 0.1s ease-out;
        }

        .image-grid li {
          padding: 0;
          position: relative;
          background: #e5e5e5;
          max-inline-size: 100%;
          grid-column: var(--x1, auto) / var(--x2, auto);
          grid-row: var(--y1, auto) / var(--y2, auto);
          border-radius: 8px;
          overflow: hidden;
        }

        /* Background grid - fills entire screen */
        .background-grid {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -1;
          opacity: 0.3;
          display: flex;
          gap: 15px;
          padding: 0 10px;
        }

        .bg-column {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .bg-column-1 {
          width: 14%;
          animation: continuousUp 40s linear infinite;
        }

        .bg-column-2 {
          width: 16%;
          animation: continuousDown 45s linear infinite;
        }

        .bg-column-3 {
          width: 15%;
          animation: continuousUp 50s linear infinite;
        }

        .bg-column-4 {
          width: 17%;
          animation: continuousDown 55s linear infinite;
        }

        .bg-column-5 {
          width: 16%;
          animation: continuousUp 60s linear infinite;
        }

        .bg-column-6 {
          width: 15%;
          animation: continuousDown 65s linear infinite;
        }

        /* Mobile: 3 columns */
        @media (max-width: 768px) {
          .bg-column-4, .bg-column-5, .bg-column-6 {
            display: none;
          }
          .bg-column-1 {
            width: 30%;
          }
          .bg-column-2 {
            width: 35%;
          }
          .bg-column-3 {
            width: 35%;
          }
        }

        .bg-item {
          width: 100%;
        }

        .bg-item img {
          width: 100%;
          height: auto;
          display: block;
        }

        @keyframes continuousUp {
          0% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(-33.33%);
          }
        }

        @keyframes continuousDown {
          0% {
            transform: translateY(-33.33%);
          }
          100% {
            transform: translateY(0%);
          }
        }

        /* Global styles */
        :global(body) {
          margin: 0;
          padding: 0;
          font-family: 'Google Sans', sans-serif, system-ui;
          background: #ffffff;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
}
