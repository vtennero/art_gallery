import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import pool from '../../../lib/database';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
                  supabase_created_at: file.created_at,
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
          upload_source: 'database'
        };
      })
    );

    // Sort by the best available date (Supabase metadata > database created_at > fallback by ID)
    const sortedPaintings = paintingsWithMetadata.sort((a, b) => {
      const dateA = a.supabase_created_at || a.created_at || `2021-01-01T00:00:${String(a.id).padStart(2, '0')}.000Z`;
      const dateB = b.supabase_created_at || b.created_at || `2021-01-01T00:00:${String(b.id).padStart(2, '0')}.000Z`;
      
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    res.status(200).json({
      paintings: sortedPaintings,
      metadata: {
        total: sortedPaintings.length,
        withSupabaseData: sortedPaintings.filter(p => p.supabase_created_at).length,
        withDatabaseData: sortedPaintings.filter(p => p.created_at && !p.supabase_created_at).length,
        withFallback: sortedPaintings.filter(p => !p.created_at && !p.supabase_created_at).length
      }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch painting history' });
  }
}
