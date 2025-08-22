import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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

    console.log("🔍 Fetching paintings from Neon database...");
    console.log("📋 DATABASE_URL is set:", !!process.env.DATABASE_URL);
    
    const { rows } = await pool.query(
      "SELECT id, href, imagesrc as \"imageSrc\", name, worktype, year, rank FROM paintings ORDER BY rank DESC"
    );
    
    console.log(`✅ Found ${rows.length} paintings in database`);
    console.log("📋 First painting:", rows[0]);

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

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
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

export default function Gallery({ images }: { images: Image[] }) {
  const [zoomedImage, setZoomedImage] = useState<Image | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredImageId, setHoveredImageId] = useState<number | null>(null);
  const [delayedHoveredImageId, setDelayedHoveredImageId] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle scroll wheel for horizontal navigation (desktop only)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Only prevent default and use horizontal scrolling on desktop
      if (window.innerWidth >= 768) {
        e.preventDefault();
        
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const scrollAmount = e.deltaY * 2; // Amplify scroll for better UX
          container.scrollLeft += scrollAmount;
          
          // Update current index based on scroll position
          const itemWidth = container.scrollWidth / images.length;
          const newIndex = Math.round(container.scrollLeft / itemWidth);
          setCurrentIndex(Math.min(Math.max(newIndex, 0), images.length - 1));
        }
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [images.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (zoomedImage) {
        if (e.key === 'Escape') {
          setZoomedImage(null);
        } else if (e.key === 'ArrowLeft') {
          const currentIdx = images.findIndex(img => img.id === zoomedImage.id);
          if (currentIdx > 0) {
            setZoomedImage(images[currentIdx - 1]);
          }
        } else if (e.key === 'ArrowRight') {
          const currentIdx = images.findIndex(img => img.id === zoomedImage.id);
          if (currentIdx < images.length - 1) {
            setZoomedImage(images[currentIdx + 1]);
          }
        }
      } else {
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
          scrollToIndex(currentIndex - 1);
        } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
          scrollToIndex(currentIndex + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedImage, currentIndex, images]);

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const itemWidth = container.scrollWidth / images.length;
      container.scrollTo({
        left: index * itemWidth,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  };

  const handleMouseEnter = (imageId: number) => {
    setHoveredImageId(imageId);
    
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Set delayed hover effect after 1.5 seconds
    hoverTimeoutRef.current = setTimeout(() => {
      setDelayedHoveredImageId(imageId);
    }, 1500);
  };

  const handleMouseLeave = () => {
    setHoveredImageId(null);
    setDelayedHoveredImageId(null);
    
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  console.log("🎨 Gallery component received images:", images?.length || 0);
  
  return (
    <>
      {/* Main Gallery Container */}
      <div className="min-h-screen w-full md:h-screen md:overflow-hidden bg-gray-50">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white bg-opacity-90 backdrop-blur-sm border-b border-gray-200">
          <div className="px-8 py-4">
            <div className="text-center">
              <h1 className="text-2xl font-light text-gray-800">Gallery</h1>
              <p className="text-sm text-gray-600 mt-1">Victor Tenneroni</p>
            </div>
          </div>
        </div>



        {/* Scrolling Container - Horizontal on desktop, Vertical on mobile */}
        <div 
          ref={scrollContainerRef}
          className="md:flex md:h-full md:items-center pt-20 pb-8 md:pb-0 md:overflow-x-auto md:overflow-y-hidden scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {images?.map((image, index) => {
            const isHovered = hoveredImageId === image.id;
            const isDelayedOtherHovered = delayedHoveredImageId !== null && delayedHoveredImageId !== image.id;
            
            return (
            <div
              key={image.id}
              className={`md:flex-shrink-0 flex flex-col justify-center items-center px-4 mb-8 md:mb-0 md:px-4 md:h-full transition-all duration-700 ${
                isDelayedOtherHovered ? 'md:opacity-30 md:blur-sm' : 'md:opacity-100 md:blur-0'
              }`}
              style={{ minWidth: '350px' }}
            >
              {/* Painting */}
              <div 
                className="cursor-pointer group"
                onClick={() => setZoomedImage(image)}
                onMouseEnter={() => handleMouseEnter(image.id)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Painting with shadow */}
                <div className={`bg-white overflow-hidden max-w-[90vw] md:max-w-[450px] transition-all duration-300 ${
                  isHovered ? 'md:ring-8 md:ring-blue-400 md:ring-opacity-60 md:shadow-2xl md:scale-105 md:rounded-lg' : ''
                }`}
                     style={{
                       boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                       filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))'
                     }}>
                  <Image
                    alt={image.name}
                    src={image.imageSrc}
                    width={800}
                    height={600}
                    objectFit="contain"
                    className="w-auto h-auto max-w-full max-h-[60vh] md:max-h-[500px]"
                    priority={index < 3}
                  />
                </div>
                
                {/* Museum Tag - Small and at bottom */}
                <div className="mt-4 flex justify-center md:justify-start">
                  <div className="text-center md:text-left bg-gray-50 border border-gray-200 px-2 py-1 text-xs inline-block">
                    <h3 className="font-medium text-gray-900">{image.name}</h3>
                    <p className="text-gray-600 italic">{image.worktype}, {image.year}</p>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>


      </div>

      {/* Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-8"
          onClick={() => setZoomedImage(null)}
        >
          <div 
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 z-10 text-white text-2xl bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-colors"
            >
              ×
            </button>
            
            {/* Navigation Arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentIdx = images.findIndex(img => img.id === zoomedImage.id);
                if (currentIdx > 0) {
                  setZoomedImage(images[currentIdx - 1]);
                }
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white text-3xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-70 transition-colors disabled:opacity-30"
              disabled={images.findIndex(img => img.id === zoomedImage.id) === 0}
            >
              ‹
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentIdx = images.findIndex(img => img.id === zoomedImage.id);
                if (currentIdx < images.length - 1) {
                  setZoomedImage(images[currentIdx + 1]);
                }
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white text-3xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-70 transition-colors disabled:opacity-30"
              disabled={images.findIndex(img => img.id === zoomedImage.id) === images.length - 1}
            >
              ›
            </button>

            {/* Zoomed Image */}
            <div className="bg-white shadow-2xl max-w-4xl max-h-full overflow-auto">
              <div className="relative">
                <Image
                  alt={zoomedImage.name}
                  src={zoomedImage.imageSrc}
                  width={1200}
                  height={900}
                  objectFit="contain"
                  className=""
                />
              </div>
              
              {/* Zoomed Museum Etiquette */}
              <div className="mt-8 text-center px-8 py-6 bg-gray-50 border-t border-gray-200">
                <h3 className="text-2xl font-medium text-gray-900 mb-4 tracking-wide">{zoomedImage.name}</h3>
                <div className="text-gray-600 space-y-2">
                  <p className="italic text-lg">{zoomedImage.worktype}</p>
                  <p className="font-light text-lg">{zoomedImage.year}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Button */}
      <div
        style={{
          position: 'fixed',
          top: '32px',
          right: '32px',
          zIndex: 1000
        }}
      >
        <Link 
          href="/admin"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            backgroundColor: 'rgba(60, 60, 60, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
          title="Admin Panel"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(60, 60, 60, 0.9)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg 
            width="28" 
            height="28" 
            fill="none" 
            stroke="rgba(230, 230, 230, 0.9)" 
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </Link>
      </div>



      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
