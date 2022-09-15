import Image from "next/image";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

export async function getStaticProps() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  const { data } = await supabaseAdmin.from("swag").select("*").order("id");

  return {
    props: {
      images: data,
    },
  };
}
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type Image = {
  id: number;
  href: string;
  imageSrc: string;
  name: string;
  worktype: string;
  year: number;
};

export default function Gallery({ images }: { images: Image[] }) {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
      <div className="text-center">
        <p className="text-xl">Art</p>
        <p className="mb-8">Victor Tenneroni</p>
      </div>

      <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {images.map((image) => (
          <BlurImage key={image.id} image={image} />
        ))}
      </div>
    </div>
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
