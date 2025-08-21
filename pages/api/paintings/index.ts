import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import pool from '../../../lib/database';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
          const result = await pool.query(
      'SELECT * FROM paintings ORDER BY rank DESC'
    );
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching paintings:', error);
      res.status(500).json({ error: 'Failed to fetch paintings' });
    }
  } else if (req.method === 'POST') {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { imageSrc, name, worktype, year, rank } = req.body;
      
      // Validate required fields
      if (!imageSrc || !name || !worktype || !year || !rank) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Start transaction to handle rank shifting
      await pool.query('BEGIN');

      // Shift existing paintings with rank >= new rank
      await pool.query(
        'UPDATE paintings SET rank = rank + 1 WHERE rank >= $1',
        [rank]
      );

      // Insert new painting with specified rank
      const result = await pool.query(
        'INSERT INTO paintings (imagesrc, name, worktype, year, rank) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [imageSrc, name, worktype, year, rank]
      );

      // Commit transaction
      await pool.query('COMMIT');

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating painting:', error);
      try {
        await pool.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
      res.status(500).json({ error: 'Failed to create painting' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
