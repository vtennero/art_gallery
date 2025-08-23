import React, { useState, useEffect } from "react";
import pool from "../lib/database";
import OpeningSequence from "../components/OpeningSequence";
import MainGallery from "../components/MainGallery";

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
    
    // Hardcoded list of specific image IDs for spinning grid (opening sequence)
    const spinningGridIds = [1, 2, 3, 4, 5, 6, 7, 8];
    
    // Fetch the specific images for spinning grid
    const spinningQuery = `
      SELECT id, href, imagesrc as "imageSrc", name, worktype, year, rank 
      FROM paintings 
      WHERE id = ANY($1)
      ORDER BY array_position($1, id)
    `;
    const { rows: spinningImages } = await pool.query(spinningQuery, [spinningGridIds]);
    
    // Fetch all remaining images for the main gallery
    const galleryQuery = `
      SELECT id, href, imagesrc as "imageSrc", name, worktype, year, rank 
      FROM paintings 
      ORDER BY rank DESC
    `;
    const { rows: allImages } = await pool.query(galleryQuery);
    
    console.log(`✅ Found ${spinningImages.length} spinning images and ${allImages.length} total images`);

    return {
      props: {
        images: allImages,
        spinningImages: spinningImages,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error("❌ Database error:", error);
    return {
      props: {
        images: [],
        spinningImages: [],
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

/**
 * Main Gallery Page Component
 * Orchestrates the opening sequence and main gallery experience
 */
export default function Gallery({ images, spinningImages }: { images: Image[]; spinningImages: Image[] }) {
  // Opening sequence state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Background images for opening sequence (non-spinning grid images)
  const backgroundImages = images.filter(img => !spinningImages.find(spinner => spinner.id === img.id));

  // Handle opening sequence scroll and transition
  useEffect(() => {
    const handleScroll = () => {
      if (!showGallery) {
        const scrollTop = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = Math.min(scrollTop / documentHeight, 1);
        setScrollProgress(progress);
        
        // Start transition when scroll is nearly complete
        if (progress >= 0.95 && !isTransitioning) {
          setIsTransitioning(true);
          
          // Fade out opening sequence then show gallery
          setTimeout(() => {
            setShowGallery(true);
            window.scrollTo(0, 0);
            
            // Complete transition after gallery is shown
            setTimeout(() => {
              setIsTransitioning(false);
            }, 500);
          }, 800);
        }
      }
    };

    if (!showGallery) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [showGallery, isTransitioning]);

  console.log("🎨 Gallery component received images:", images?.length || 0);
  console.log("🔄 Spinning images:", spinningImages?.length || 0);
  console.log("🌄 Background images:", backgroundImages?.length || 0);
  
  // Show opening sequence or main gallery based on state
  if (!showGallery) {
    return (
      <OpeningSequence
        spinningImages={spinningImages}
        backgroundImages={backgroundImages}
        scrollProgress={scrollProgress}
        isTransitioning={isTransitioning}
      />
    );
  }

  // Show main gallery after opening sequence
  return (
    <MainGallery
      images={images}
      isTransitioning={isTransitioning}
    />
  );
}