import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import pool from "../lib/database";

export async function getStaticProps() {
  try {
    console.log("🔍 Fetching paintings from Neon database...");
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
  console.log("🎨 Gallery component received images:", images?.length || 0);
  console.log("📋 First image:", images?.[0]);
  
  return (
    <>
      <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="text-center">
          <p className="text-xl">Art</p>
          <p className="mb-8">Victor Tenneroni</p>
        </div>

        <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {images?.map((image) => (
            <BlurImage key={image.id} image={image} />
          ))}
        </div>
      </div>

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
    </>
  );
}

function BlurImage({ image }: { image: Image }) {
  const [isLoading, setLoading] = useState(true);

  return (
    <a href={image.imageSrc} className="group">
      <div className="w-full aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden xl:aspect-w-7 xl:aspect-h-8">
        <Image
          alt=""
          src={image.imageSrc}
          layout="fill"
          objectFit="cover"
          className={cn(
            // "group-hover:opacity-75 duration-700 ease-in-out",
            "group-hover:opacity-75 duration-700 ease-in-out group-hover:scale-110 ",
            isLoading
              ? "grayscale blur-2xl scale-110"
              : "grayscale-0 blur-0 scale-100"
          )}
          onLoadingComplete={() => setLoading(false)}
        />
      </div>
      <h3 className="mt-4 text-lg  text-gray-700">{image.name}</h3>
      <p className="mt-1 text-sm font-medium text-gray-900">{image.worktype}</p>
      <p className="mt-1 text-sm font-medium text-gold">{image.year}</p>
    </a>
  );
}
