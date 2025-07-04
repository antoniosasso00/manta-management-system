# Deployment Guide - MES Aerospazio

## Netlify Deployment

### Required Environment Variables

Configure these in Netlify Dashboard > Site Settings > Environment Variables:

1. **DATABASE_URL** (Required)
   - Your PostgreSQL connection string
   - Example: `postgresql://user:password@host:5432/database?sslmode=require`
   - Use Neon, Supabase, or any PostgreSQL provider

2. **NEXTAUTH_URL** (Required)
   - Your production URL
   - Example: `https://your-site.netlify.app`
   - Must match your actual Netlify domain

3. **NEXTAUTH_SECRET** (Required)
   - Generate with: `openssl rand -base64 32`
   - Must be at least 32 characters
   - Keep this secret and never commit it

4. **Database Performance** (Recommended)
   ```
   DATABASE_MAX_CONNECTIONS=25
   DATABASE_POOL_TIMEOUT=30
   DATABASE_QUERY_TIMEOUT=10
   ```

### Build Settings

Already configured in `netlify.toml`:
- Build command: `npm run build`
- Publish directory: `.next`
- Node version: 20

### Important Notes

1. **Prisma Client Generation**: The build command automatically runs `prisma generate`

2. **Edge Functions**: The middleware is configured to handle Netlify's edge runtime limitations

3. **Session Cookies**: NextAuth is configured with secure cookies for production

4. **Database Migrations**: Run migrations before deployment:
   ```bash
   npm run db:migrate
   ```

### Troubleshooting

1. **Login Issues**: Ensure NEXTAUTH_URL matches your exact Netlify domain
2. **Database Connection**: Check DATABASE_URL includes `?sslmode=require` for secure connections
3. **Build Failures**: Check build logs for missing environment variables