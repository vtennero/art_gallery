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

    console.log("🔍 Fetching top ranked paintings from Neon database...");
    
    const { rows } = await pool.query(
      "SELECT id, href, imagesrc as \"imageSrc\", name, worktype, year, rank FROM paintings ORDER BY rank DESC LIMIT 8"
    );
    
    console.log(`✅ Found ${rows.length} top paintings in database`);

    return {
      props: {
        images: rows,
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

  // Split images: first 8 for spinning grid, rest for background
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
  
  return (
    <>
      {/* Main container with scroll height */}
      <div style={{ height: '300vh', width: '100vw', overflowX: 'hidden' }}>
        
        {/* Background images - static, no spinning */}
        <div className="background-images">
          {backgroundImages.map((image, index) => (
            <div
              key={`bg-${image.id}`}
              className="background-image"
              style={{
                left: `${Math.random() * 80}%`,
                top: `${Math.random() * 80}%`,
                animationDelay: `${index * 0.5}s`
              }}
            >
              <Image
                src={image.imageSrc}
                alt={image.name}
                width={300}
                height={300}
                objectFit="cover"
                className="bg-img"
              />
            </div>
          ))}
        </div>
        
        {/* Fixed spinning grid container */}
        <main>
          <ul 
            ref={gridRef}
            className="image-grid"
            style={{
              transform: `translate(-50%, -50%) scale(${0.4 + (0.6 * scrollProgress)}) rotate(${270 * scrollProgress}deg)`
            }}
          >
            {spinningImages.map((image, index) => {
              const position = gridPositions[index] || gridPositions[0];
              
              // Index 3 is the center-ish image (4th image, positioned at x1:4, x2:7, y1:4, y2:7)
              const isCenterImage = index === 3;
              const centerScale = isCenterImage ? 1 + (scrollProgress * 0.8) : 1;
              
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
          --scale: 0.4;
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

        .image-grid img {
          height: 200% !important;
          min-width: 200% !important;
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
          background: red;
          max-inline-size: 100%;
          grid-column: var(--x1, auto) / var(--x2, auto);
          grid-row: var(--y1, auto) / var(--y2, auto);
          border-radius: 8px;
          overflow: hidden;
        }

        /* Background images */
        .background-images {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -1;
          opacity: 0.3;
        }

        .background-image {
          position: absolute;
          width: 150px;
          height: 150px;
          border-radius: 8px;
          overflow: hidden;
          animation: float 8s ease-in-out infinite;
        }

        .background-image:nth-child(even) {
          animation-direction: reverse;
        }

        .bg-img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
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
