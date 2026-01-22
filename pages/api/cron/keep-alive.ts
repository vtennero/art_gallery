import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret to prevent unauthorized access
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Ping Supabase storage by listing files
    const { data, error } = await supabase.storage
      .from('myart')
      .list('', { limit: 1 });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Supabase pinged successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Keep-alive ping failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to ping Supabase'
    });
  }
}
