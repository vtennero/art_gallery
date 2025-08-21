# Admin Panel Setup Guide

## Overview
The admin panel allows you to upload new paintings to your art gallery through a secure GitHub OAuth authentication system.

## Features
- ✅ GitHub OAuth authentication
- ✅ Image upload to Supabase Storage
- ✅ Database integration with Neon PostgreSQL
- ✅ One-click workflow: upload image → save to database
- ✅ Modern, responsive UI
- ✅ ISR (Incremental Static Regeneration) for auto-refresh

## Setup Steps

### 1. GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Art Gallery Admin
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret**

### 2. Environment Variables

Create a `.env.local` file in your project root with:

```env
# Supabase (existing - keep these for storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Neon Database
DATABASE_URL=postgresql://username:password@host:port/database

# NextAuth
NEXTAUTH_SECRET=your_random_secret_key_here
GITHUB_ID=your_github_oauth_client_id
GITHUB_SECRET=your_github_oauth_client_secret
NEXTAUTH_URL=http://localhost:3000

# Optional: Restrict admin access to specific GitHub users
# ALLOWED_GITHUB_USERS=your_email@example.com
```

### 3. Database Schema

Make sure your Neon database has the `paintings` table:

```sql
CREATE TABLE paintings (
  id SERIAL PRIMARY KEY,
  href TEXT,
  imageSrc TEXT NOT NULL,
  name TEXT NOT NULL,
  worktype TEXT NOT NULL,
  year INTEGER NOT NULL,
  rank INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Supabase Storage Bucket

Ensure you have a `paintings` bucket in your Supabase storage with public access.

## Usage

### Accessing the Admin Panel

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/admin`
3. Click "Sign in with GitHub"
4. Authorize the application
5. You'll be redirected to the admin panel

### Adding a New Painting

1. Fill in the painting details:
   - **Name**: The title of the artwork
   - **Work Type**: Medium (e.g., "Oil on Canvas", "Watercolor")
   - **Year**: Year created
   - **Link**: Optional external link
2. Upload an image (drag & drop or click to browse)
3. Click "Add Painting"
4. The image will be uploaded to Supabase Storage
5. The painting data will be saved to the Neon database
6. The gallery will automatically refresh within an hour (ISR)

## Security Features

- **GitHub OAuth**: Only authenticated users can access the admin panel
- **User Restriction**: Optionally restrict access to specific GitHub email addresses
- **Server-side validation**: All API endpoints validate authentication
- **Secure file uploads**: Images are validated and stored securely

## Production Deployment

### Update Environment Variables

For production, update your environment variables:

```env
NEXTAUTH_URL=https://your-domain.com
GITHUB_ID=your_production_github_client_id
GITHUB_SECRET=your_production_github_client_secret
```

### Update GitHub OAuth App

1. Go to your GitHub OAuth app settings
2. Update the **Authorization callback URL** to: `https://your-domain.com/api/auth/callback/github`
3. Update the **Homepage URL** to: `https://your-domain.com`

### Vercel Deployment

1. Add all environment variables to your Vercel project
2. Deploy your application
3. The admin panel will be available at `https://your-domain.com/admin`

## Troubleshooting

### Common Issues

1. **"Access denied" error**: Check your `ALLOWED_GITHUB_USERS` environment variable
2. **Image upload fails**: Verify your Supabase storage bucket exists and is public
3. **Database connection error**: Check your `DATABASE_URL` and Neon database status
4. **OAuth callback error**: Ensure your GitHub OAuth app callback URL matches your domain

### Debug Mode

To enable debug logging, add to your environment variables:

```env
DEBUG=next-auth:*
```

## File Structure

```
pages/
├── admin/
│   └── index.tsx          # Admin panel interface
├── auth/
│   ├── signin.tsx         # Custom sign-in page
│   └── error.tsx          # Auth error page
└── api/
    ├── auth/
    │   └── [...nextauth].ts # NextAuth configuration
    ├── paintings/
    │   └── index.ts       # Paintings API (GET/POST)
    └── upload.ts          # Image upload API
```

## API Endpoints

- `GET /api/paintings` - Fetch all paintings
- `POST /api/paintings` - Add new painting (requires auth)
- `POST /api/upload` - Upload image to Supabase (requires auth)
- `GET /api/auth/signin` - Sign in page
- `GET /api/auth/signout` - Sign out

## Next Steps

After setup, you can:
1. Add more admin features (edit/delete paintings)
2. Implement image optimization
3. Add bulk upload functionality
4. Create user management system
5. Add analytics and usage statistics
