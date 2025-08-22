import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
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
  const router = useRouter();
  const [zoomedImage, setZoomedImage] = useState<Image | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredImageId, setHoveredImageId] = useState<number | null>(null);
  const [delayedHoveredImageId, setDelayedHoveredImageId] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isZoomAnimating, setIsZoomAnimating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [clickedImageRect, setClickedImageRect] = useState<DOMRect | null>(null);
  const [shareNotification, setShareNotification] = useState(false);

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
        // Prevent default behavior for all arrow keys when in zoom mode
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
        }
        
        if (e.key === 'Escape') {
          handleCloseZoom();
        } else if (e.key === 'ArrowLeft') {
          const currentIdx = images.findIndex(img => img.id === zoomedImage.id);
          if (currentIdx > 0) {
            handleImageClick(images[currentIdx - 1]);
          }
        } else if (e.key === 'ArrowRight') {
          const currentIdx = images.findIndex(img => img.id === zoomedImage.id);
          if (currentIdx < images.length - 1) {
            handleImageClick(images[currentIdx + 1]);
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

  const handleImageClick = (image: Image, event?: React.MouseEvent) => {
    // Capture the clicked image position for mobile animation
    if (event && window.innerWidth < 768) {
      const target = event.currentTarget.querySelector('img');
      if (target) {
        setClickedImageRect(target.getBoundingClientRect());
      }
    }
    
    setIsZoomAnimating(true);
    setImageLoaded(false);
    setZoomedImage(image);
    
    // Small delay to trigger animation
    setTimeout(() => {
      setIsZoomAnimating(false);
    }, 100);
  };

  const handleCloseZoom = () => {
    setIsZoomAnimating(true);
    setTimeout(() => {
      setZoomedImage(null);
      setIsZoomAnimating(false);
      setImageLoaded(false);
      setClickedImageRect(null);
    }, 200);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleShare = (paintingId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering image click
    const shareUrl = `${window.location.origin}${router.asPath.split('?')[0]}?painting=${paintingId}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareNotification(true);
      setTimeout(() => setShareNotification(false), 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setShareNotification(true);
      setTimeout(() => setShareNotification(false), 2000);
    });
  };

  // Handle URL-based painting navigation
  useEffect(() => {
    const paintingParam = router.query.painting;
    if (paintingParam && images.length > 0) {
      const paintingId = parseInt(paintingParam as string);
      const paintingIndex = images.findIndex(img => img.id === paintingId);
      
      if (paintingIndex !== -1) {
        // Small delay to ensure images are rendered
        setTimeout(() => {
          scrollToIndex(paintingIndex);
        }, 500);
      }
    }
  }, [router.query.painting, images]);

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
                onClick={(e) => handleImageClick(image, e)}
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
                    priority={index < 10}
                    loading={index < 10 ? "eager" : "lazy"}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNmNWY1ZjUiLz4KICA8Y2lyY2xlIGN4PSI0MDAiIGN5PSIzMDAiIHI9IjQwIiBmaWxsPSIjZGRkZGRkIi8+Cjwvc3ZnPgo="
                  />
                </div>
                
                {/* Museum Tag and Share Button */}
                <div className="mt-4 flex justify-center md:justify-start items-center gap-2">
                  <div className="text-center md:text-left bg-gray-50 border border-gray-200 px-2 py-1 text-xs inline-block">
                    <h3 className="font-medium text-gray-900">{image.name}</h3>
                    <p className="text-gray-600 italic">{image.worktype}, {image.year}</p>
                  </div>
                  
                  {/* Share Button - Outside the tag */}
                  <button
                    onClick={(e) => handleShare(image.id, e)}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors duration-200 text-gray-500 hover:text-gray-700 group"
                    title="Share this painting"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:scale-110 transition-transform">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                      <polyline points="16,6 12,2 8,6"/>
                      <line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                  </button>
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
          className={`fixed inset-0 z-50 bg-gray-800 transition-all duration-500 ${
            isZoomAnimating 
              ? 'bg-opacity-0 md:bg-opacity-0' 
              : 'bg-opacity-95 md:bg-opacity-90'
          }`}
          onClick={handleCloseZoom}
        >
          {/* Close Button */}
          <button
            onClick={handleCloseZoom}
            className={`absolute top-4 right-4 z-20 text-white text-2xl bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-all duration-300 ${
              isZoomAnimating ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
            }`}
          >
            ×
          </button>
          
          {/* Desktop Navigation Arrows - Outside painting area */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentIdx = images.findIndex(img => img.id === zoomedImage.id);
              if (currentIdx > 0) {
                handleImageClick(images[currentIdx - 1]);
              }
            }}
            className={`hidden md:block absolute left-4 top-1/2 transform -translate-y-1/2 z-20 text-white text-3xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-70 transition-all duration-300 disabled:opacity-30 ${
              isZoomAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
            }`}
            disabled={images.findIndex(img => img.id === zoomedImage.id) === 0}
          >
            ‹
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentIdx = images.findIndex(img => img.id === zoomedImage.id);
              if (currentIdx < images.length - 1) {
                handleImageClick(images[currentIdx + 1]);
              }
            }}
            className={`hidden md:block absolute right-4 top-1/2 transform -translate-y-1/2 z-20 text-white text-3xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-70 transition-all duration-300 disabled:opacity-30 ${
              isZoomAnimating ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'
            }`}
            disabled={images.findIndex(img => img.id === zoomedImage.id) === images.length - 1}
          >
            ›
          </button>

          {/* Mobile: Full-screen image with dark background */}
          <div className="md:hidden flex items-center justify-center h-full p-4">
            <div 
              className={`max-w-full max-h-full transition-all duration-500 ${
                isZoomAnimating && clickedImageRect
                  ? 'opacity-0' 
                  : isZoomAnimating
                  ? 'opacity-0 scale-95'
                  : 'opacity-100 scale-100'
              }`}
              style={
                isZoomAnimating && clickedImageRect
                  ? {
                      transform: `translate(${clickedImageRect.left - window.innerWidth/2}px, ${clickedImageRect.top - window.innerHeight/2}px) scale(0.3)`,
                    }
                  : {}
              }
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                alt={zoomedImage.name}
                src={zoomedImage.imageSrc}
                width={1200}
                height={900}
                objectFit="contain"
                className="w-full h-auto max-h-screen"
                onLoad={handleImageLoad}
              />
            </div>
          </div>

          {/* Desktop: Centered layout with painting and details */}
          <div className="hidden md:flex items-center justify-center h-full px-16 py-8" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex items-end gap-8">
              {/* Painting */}
              <div 
                className={`bg-white shadow-2xl transition-all duration-700 ${
                  isZoomAnimating 
                    ? 'opacity-0 scale-95' 
                    : 'opacity-100 scale-100'
                }`}
              >
                <Image
                  alt={zoomedImage.name}
                  src={zoomedImage.imageSrc}
                  width={1200}
                  height={900}
                  objectFit="contain"
                  className="max-h-[80vh] w-auto h-auto"
                  onLoad={handleImageLoad}
                />
              </div>
              
              {/* Details - positioned to the right and bottom-aligned with painting */}
              <div 
                className={`text-white mb-8 transition-all duration-700 delay-200 ${
                  isZoomAnimating || !imageLoaded
                    ? 'opacity-0' 
                    : 'opacity-100'
                }`}
              >
                <div className="space-y-4">
                  <h2 className="text-2xl font-light tracking-wide">{zoomedImage.name}</h2>
                  <div className="space-y-2 text-gray-300">
                    <p className="text-lg italic">{zoomedImage.worktype}</p>
                    <p className="text-lg font-light">{zoomedImage.year}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Notification */}
      {shareNotification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg text-sm font-medium animate-pulse">
          Link copied to clipboard!
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
