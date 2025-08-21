# Migration Plan: V1 (Supabase) → V2 (Neon + Supabase Storage)

## Current State (V1)
- **Database**: Supabase PostgreSQL (shuts down every 30 days)
- **Storage**: Supabase Storage (images)
- **Deployment**: Vercel with `getStaticProps()` (requires manual redeploy for new content)
- **Data Structure**: `{ id, href, imageSrc, name, worktype, year }`
- **Table**: `swag`

## Target State (V2)
- **Database**: Neon PostgreSQL (always on, reliable)
- **Storage**: Supabase Storage (keep existing images)
- **Deployment**: Vercel with ISR (Incremental Static Regeneration)
- **Admin Panel**: GitHub OAuth protected interface for easy content management
- **Data Structure**: `{ id, href, imageSrc, name, worktype, year, rank }`
- **Table**: `paintings` with `imagesrc` (lowercase) and `rank` columns

## Migration Workflow

### Phase 1: Database Setup
1. **Create Neon Database**
   - Sign up for Neon account
   - Create new PostgreSQL database
   - Get connection string and credentials

2. **Create Database Schema**
   ```sql
   CREATE TABLE paintings (
     id SERIAL PRIMARY KEY,
     href TEXT,
     imagesrc TEXT NOT NULL,
     name TEXT NOT NULL,
     worktype TEXT NOT NULL,
     year INTEGER NOT NULL,
     rank INTEGER NOT NULL DEFAULT 0,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```
   
   **IMPORTANT NOTES:**
   - ✅ **Use `imagesrc` (lowercase)** - NOT `imageSrc`! This prevents case sensitivity issues.
   - ✅ **Include `rank` column** - This is essential for manual ordering control.
   - ✅ **Rank system**: Higher numbers appear first (rank 34 shows before rank 1).

3. **Migrate Existing Data**
   - Export data from Supabase `swag` table
   - Import data to Neon `paintings` table
   - Verify all records migrated correctly

### Phase 2: Code Updates
1. **Install Dependencies**
   ```bash
   npm install pg @types/pg
   npm install next-auth # for GitHub OAuth
   ```

2. **Update Environment Variables**
   - Add `DATABASE_URL` (Neon connection string)
   - Add `NEXTAUTH_SECRET`
   - Add `GITHUB_ID` and `GITHUB_SECRET` for OAuth
   - Keep existing Supabase storage variables

3. **Update Database Connection**
   - Replace Supabase client with PostgreSQL client
   - Update `getStaticProps()` to use Neon with proper column aliasing:
     ```sql
     SELECT id, href, imagesrc as "imageSrc", name, worktype, year, rank 
     FROM paintings ORDER BY rank DESC
     ```
   - Add ISR (revalidate: 3600) for auto-refresh
   - **CRITICAL**: Use `imagesrc as "imageSrc"` to handle case sensitivity properly

4. **Update Image Domains**
   - Keep Supabase storage domain in `next.config.js`
   - No changes needed for existing image URLs

### Phase 3: Admin Panel Development
1. **Create Authentication System**
   - Set up NextAuth.js with GitHub provider
   - Create protected routes for admin panel
   - Add login/logout functionality

2. **Build Admin Interface**
   - Create `/admin` page with GitHub login
   - Build image upload form (uploads to Supabase storage)
   - Build database insert form (saves to Neon with `imagesrc` column)
   - Combine both into single "Add Painting" workflow
   - **Auto-rank assignment**: New paintings get next highest rank automatically

3. **Admin Panel Features**
   - Image upload with preview
   - Form for painting details (name, worktype, year)
   - One-click submit that handles both storage and database
   - List of existing paintings with edit/delete options

### Phase 4: Testing & Deployment
1. **Local Testing**
   - Test database connection
   - Test image uploads
   - Test admin panel functionality
   - Test ISR auto-refresh

2. **Production Deployment**
   - Update Vercel environment variables
   - Deploy to production
   - Test admin panel in production
   - Verify ISR is working

3. **Data Verification**
   - Confirm all existing paintings display correctly
   - Test adding new paintings through admin panel
   - Verify auto-refresh works without manual redeploy

## Benefits After Migration
- ✅ **No more database shutdowns** (Neon is always on)
- ✅ **No more manual redeploys** (ISR auto-refreshes)
- ✅ **Easy content management** (admin panel)
- ✅ **Secure access** (GitHub OAuth)
- ✅ **Existing images preserved** (no re-uploading needed)
- ✅ **Manual ordering control** (rank system for custom gallery order)
- ✅ **Case-insensitive queries** (proper column aliasing)

## Rollback Plan
If issues arise:
1. Keep Supabase database as backup
2. Can quickly revert to V1 by changing environment variables
3. All existing images remain accessible

## Timeline Estimate
- **Phase 1**: 1-2 hours (database setup)
- **Phase 2**: 2-3 hours (code updates)
- **Phase 3**: 4-6 hours (admin panel)
- **Phase 4**: 1-2 hours (testing & deployment)
- **Total**: 8-13 hours
