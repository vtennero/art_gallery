import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import pool from "../lib/database";

export async function getStaticProps() {
  try {
    // Validate environment variables
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL environment variable is not set!");
      return {
        props: {
          images: [],
        },
        revalidate: 3600,
      };
    }

    console.log("🔍 Fetching specific paintings from Neon database...");
    
    // Hardcoded list of specific image IDs for spinning grid
    // Position 3 (index 3) = CENTER image with zoom effect
    const spinningGridIds = [1, 2, 3, 4, 5, 6, 7, 8];
    
    // Fetch the specific images for spinning grid
    const spinningQuery = `
      SELECT id, href, imagesrc as "imageSrc", name, worktype, year, rank 
      FROM paintings 
      WHERE id = ANY($1)
      ORDER BY array_position($1, id)
    `;
    const { rows: spinningImages } = await pool.query(spinningQuery, [spinningGridIds]);
    
    // Fetch remaining images for background
    const backgroundQuery = `
      SELECT id, href, imagesrc as "imageSrc", name, worktype, year, rank 
      FROM paintings 
      WHERE id != ALL($1)
      ORDER BY rank DESC
    `;
    const { rows: backgroundImages } = await pool.query(backgroundQuery, [spinningGridIds]);
    
    // Combine arrays - spinning images first, then background
    const allImages = [...spinningImages, ...backgroundImages];
    
    console.log(`✅ Found ${spinningImages.length} spinning images and ${backgroundImages.length} background images`);

    return {
      props: {
        images: allImages,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error("❌ Database error:", error);
    return {
      props: {
        images: [],
      },
      revalidate: 3600,
    };
  }
}

type Image = {
  id: number;
  href?: string;
  imageSrc: string;
  name: string;
  worktype: string;
  year: number;
  rank: number;
};

// Grid positions for the 8 images
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

export default function TestAnimation({ images }: { images: Image[] }) {
  const gridRef = useRef<HTMLUListElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Split images: first 8 are for spinning grid (already in correct order), rest for background
  const spinningImages = images.slice(0, 8);
  const backgroundImages = images.slice(8);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollTop / documentHeight, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  console.log("🎨 Test Animation component received images:", images?.length || 0);
  console.log("🔄 Spinning images:", spinningImages?.length || 0);
  console.log("🌄 Background images:", backgroundImages?.length || 0);
  
  // Debug the ID changes
  console.log("📊 First 8 image IDs:", images.slice(0, 8).map(img => img.id));
  console.log("📊 Final spinning image IDs:", spinningImages.map(img => img.id));
  console.log("📊 Center image (index 3) ID:", spinningImages[3]?.id);
  console.log("🔍 Does ID 4 exist?", !!images.find(img => img.id === 4));
  console.log("🔍 Does ID 5 exist in first 8?", !!images.slice(0, 8).find(img => img.id === 5));
  console.log("🔍 Does ID 18 exist?", !!images.find(img => img.id === 18));
  
  return (
    <>
      {/* Main container with scroll height */}
      <div style={{ height: '300vh', width: '100vw', overflowX: 'hidden' }}>
        
        {/* Background images grid */}
        <div className="background-grid">
          <div className="bg-column bg-column-1">
            {/* Duplicate images for seamless loop */}
            {[...backgroundImages.filter((_, i) => i % 6 === 0), ...backgroundImages.filter((_, i) => i % 6 === 0)].map((image, index) => (
              <div key={`bg-1-${image.id}-${index}`} className="bg-item">
                <img
                  src={image.imageSrc}
                  alt={image.name}
                />
              </div>
            ))}
          </div>
          <div className="bg-column bg-column-2">
            {[...backgroundImages.filter((_, i) => i % 6 === 1), ...backgroundImages.filter((_, i) => i % 6 === 1)].map((image, index) => (
              <div key={`bg-2-${image.id}-${index}`} className="bg-item">
                <img
                  src={image.imageSrc}
                  alt={image.name}
                />
              </div>
            ))}
          </div>
          <div className="bg-column bg-column-3">
            {[...backgroundImages.filter((_, i) => i % 6 === 2), ...backgroundImages.filter((_, i) => i % 6 === 2)].map((image, index) => (
              <div key={`bg-3-${image.id}-${index}`} className="bg-item">
                <img
                  src={image.imageSrc}
                  alt={image.name}
                />
              </div>
            ))}
          </div>
          <div className="bg-column bg-column-4">
            {[...backgroundImages.filter((_, i) => i % 6 === 3), ...backgroundImages.filter((_, i) => i % 6 === 3)].map((image, index) => (
              <div key={`bg-4-${image.id}-${index}`} className="bg-item">
                <img src={image.imageSrc} alt={image.name} />
              </div>
            ))}
          </div>
          <div className="bg-column bg-column-5">
            {[...backgroundImages.filter((_, i) => i % 6 === 4), ...backgroundImages.filter((_, i) => i % 6 === 4)].map((image, index) => (
              <div key={`bg-5-${image.id}-${index}`} className="bg-item">
                <img src={image.imageSrc} alt={image.name} />
              </div>
            ))}
          </div>
          <div className="bg-column bg-column-6">
            {[...backgroundImages.filter((_, i) => i % 6 === 5), ...backgroundImages.filter((_, i) => i % 6 === 5)].map((image, index) => (
              <div key={`bg-6-${image.id}-${index}`} className="bg-item">
                <img src={image.imageSrc} alt={image.name} />
              </div>
            ))}
          </div>
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
            {spinningImages.map((image, index) => {
              const position = gridPositions[index] || gridPositions[0];
              
              // Index 3 is the center-ish image (4th image, positioned at x1:4, x2:7, y1:4, y2:7)
              const isCenterImage = index === 3;
              const centerScale = isCenterImage ? 1 + (scrollProgress * 0.4) : 1;
              
              return (
                <li
                  key={image.id}
                  style={{
                    '--x1': position.x1,
                    '--x2': position.x2,
                    '--y1': position.y1,
                    '--y2': position.y2,
                  } as React.CSSProperties}
                >
                  <img
                    src={image.imageSrc}
                    alt={image.name}
                    style={{
                      transform: `translate(-50%, -50%) rotate(${-270 * scrollProgress}deg) scale(${centerScale})`
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </main>


      </div>

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
        }

        .bg-column-2 {
          width: 16%;
        }

        .bg-column-3 {
          width: 15%;
        }

        .bg-column-4 {
          width: 17%;
        }

        .bg-column-5 {
          width: 16%;
        }

        .bg-column-6 {
          width: 15%;
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

        .bg-column-1 {
          animation: continuousUp 40s linear infinite;
        }

        .bg-column-2 {
          animation: continuousDown 45s linear infinite;
        }

        .bg-column-3 {
          animation: continuousUp 50s linear infinite;
        }

        .bg-column-4 {
          animation: continuousDown 55s linear infinite;
        }

        .bg-column-5 {
          animation: continuousUp 60s linear infinite;
        }

        .bg-column-6 {
          animation: continuousDown 65s linear infinite;
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
            transform: translateY(-50%);
          }
        }

        @keyframes continuousDown {
          0% {
            transform: translateY(-50%);
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
          background: #f5f5f5;
          overflow-x: hidden;
        }
      `}</style>
    </>
  );
}
