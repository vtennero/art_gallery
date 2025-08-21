# Migration Steps: Supabase → Neon

## Phase 1: Database Setup ✅

### Step 1: Get Your Neon Connection String
1. Go to your Neon dashboard
2. Find your database connection string
3. It should look like: `postgresql://username:password@host:port/database`

### Step 2: Set Up Environment Variables
1. Create a `.env.local` file in your project root
2. Add your Neon connection string:
   ```
   DATABASE_URL=your_neon_connection_string_here
   ```
3. Keep your existing Supabase variables for storage

### Step 3: Test Neon Connection
Run the test script to verify your connection:
```bash
node scripts/test-neon.js
```

### Step 4: Migrate Your Data
Run the migration script to move your data from Supabase to Neon:
```bash
node scripts/migrate-data.js
```

## Phase 2: Code Updates ✅

### What's Already Done:
- ✅ Installed `pg`, `@types/pg`, `next-auth`, `dotenv`
- ✅ Created database connection utility (`lib/database.ts`)
- ✅ Updated `pages/index.tsx` to use Neon + ISR
- ✅ Added revalidation (3600 seconds = 1 hour)

### What This Means:
- Your site will now auto-refresh every hour
- No more manual redeploys when you add paintings
- Database is now reliable (Neon doesn't shut down)

## Phase 3: Admin Panel (Next)

### Coming Up:
- GitHub OAuth setup
- Admin interface for easy painting uploads
- One-click workflow: upload image → save to database

## Testing Your Migration

1. **Test the connection:**
   ```bash
   node scripts/test-neon.js
   ```

2. **Run your development server:**
   ```bash
   npm run dev
   ```

3. **Check your site** - it should work exactly the same but now use Neon!

## Troubleshooting

### If the migration fails:
- Check your `DATABASE_URL` is correct
- Make sure your Neon database is active
- Verify your Supabase credentials are still valid

### If the site doesn't load:
- Check the console for database errors
- Verify the `paintings` table was created in Neon
- Make sure all environment variables are set

## Next Steps

Once you've completed Phase 1 and 2, we'll move to Phase 3: building the admin panel with GitHub OAuth for easy content management.
