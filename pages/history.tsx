import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import pool from "../lib/database";
import HistoryGallery from "../components/HistoryGallery";

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

    console.log("🔍 Fetching paintings with enhanced upload date detection...");
    console.log("📋 DATABASE_URL is set:", !!process.env.DATABASE_URL);
    
    // Try to get enhanced data from our API endpoint that checks Supabase metadata
    try {
      // Import the handler and create a mock request/response to get data server-side
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get all paintings from database
      const { rows: paintings } = await pool.query(`
        SELECT 
          id, 
          href, 
          imagesrc as "imageSrc", 
          name, 
          worktype, 
          year, 
          rank,
          created_at
        FROM paintings 
        ORDER BY id ASC
      `);

      // Try to get file metadata from Supabase for better upload dates
      const paintingsWithMetadata = await Promise.all(
        paintings.map(async (painting) => {
          try {
            // Extract filename from the imageSrc URL
            const url = painting.imageSrc;
            const filename = url.split('/').pop();
            
            if (filename) {
              // Get file metadata from Supabase storage
              const { data: fileData, error } = await supabase.storage
                .from('myart')
                .list('', { 
                  limit: 1000,
                  search: filename
                });

              if (!error && fileData && fileData.length > 0) {
                const file = fileData.find(f => f.name === filename);
                if (file && file.created_at) {
                  return {
                    ...painting,
                    created_at: file.created_at, // Use Supabase metadata as created_at
                    upload_source: 'supabase'
                  };
                }
              }
            }
          } catch (error) {
            console.warn(`Could not get Supabase metadata for painting ${painting.id}:`, error);
          }
          
          return {
            ...painting,
            // If no created_at and no Supabase data, create a fallback date based on ID
            created_at: painting.created_at || `2021-01-01T00:00:${String(painting.id).padStart(2, '0')}.000Z`,
            upload_source: painting.created_at ? 'database' : 'fallback'
          };
        })
      );

      // Sort by upload date (oldest first)
      const sortedPaintings = paintingsWithMetadata.sort((a, b) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      console.log(`✅ Found ${sortedPaintings.length} paintings with enhanced metadata`);
      console.log("📋 First painting (oldest):", sortedPaintings[0]);
      console.log("📋 Last painting (newest):", sortedPaintings[sortedPaintings.length - 1]);
      
      const metadata = {
        withSupabaseData: sortedPaintings.filter(p => p.upload_source === 'supabase').length,
        withDatabaseData: sortedPaintings.filter(p => p.upload_source === 'database').length,
        withFallback: sortedPaintings.filter(p => p.upload_source === 'fallback').length
      };
      console.log("📊 Upload date sources:", metadata);

      return {
        props: {
          images: sortedPaintings,
        },
        revalidate: 3600, // Revalidate every hour
      };
    } catch (supabaseError) {
      console.warn("⚠️ Could not enhance with Supabase metadata, falling back to database only:", supabaseError);
      
      // Fallback to database-only query
      const { rows } = await pool.query(`
        SELECT 
          id, 
          href, 
          imagesrc as "imageSrc", 
          name, 
          worktype, 
          year, 
          rank,
          created_at
        FROM paintings 
        ORDER BY 
          CASE 
            WHEN created_at IS NOT NULL THEN created_at 
            ELSE '2021-01-01'::timestamp + (id || ' seconds')::interval 
          END ASC
      `);
      
      console.log(`✅ Found ${rows.length} paintings in database for history (fallback)`);

      return {
        props: {
          images: rows,
        },
        revalidate: 3600,
      };
    }
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
  created_at?: string;
  upload_source?: string;
};

export default function History({ images }: { images: Image[] }) {
  console.log("🎨 History page received images:", images?.length || 0);
  
  return (
    <HistoryGallery images={images} />
  );
}
