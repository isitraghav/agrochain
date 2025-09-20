# 🔐 Pinata Security Setup Guide

**⚠️ CRITICAL SECURITY NOTICE**
Your Pinata credentials were previously exposed in source code. Please follow these steps immediately:

## 1. Revoke Exposed Credentials (IMMEDIATE ACTION REQUIRED)

1. Go to [Pinata Dashboard](https://app.pinata.cloud/)
2. Navigate to "API Keys" or "Developers" section
3. Find and **REVOKE** the API key: `05ac4f7202bf76be346f`
4. **Delete** any JWT tokens that may be compromised

## 2. Generate New Credentials

1. In your Pinata dashboard, create a new API key
2. Set appropriate permissions (typically: `pinFileToIPFS`, `pinJSONToIPFS`, `unpin`)
3. Copy the new **API Key** and **Secret Key**
4. Generate a new **JWT token** if needed

## 3. Configure Environment Variables

### Option A: Using JWT Token (Recommended)
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and replace with your NEW credentials:
VITE_PINATA_JWT=your_new_jwt_token_here
VITE_PINATA_API_KEY=your_new_api_key_here  
VITE_PINATA_SECRET_KEY=your_new_secret_key_here
```

### Option B: Using API Key/Secret Only
If you prefer not to use JWT, you can remove the JWT line and use only:
```bash
VITE_PINATA_API_KEY=your_new_api_key_here
VITE_PINATA_SECRET_KEY=your_new_secret_key_here
```

## 4. Verify Setup

Start your development server to verify the configuration:
```bash
npm run dev
```

The application will throw an error if credentials are missing or invalid.

## 5. Security Best Practices

- ✅ **Never commit `.env.local` or `.env` files** (already added to `.gitignore`)
- ✅ **Use different credentials for development/production**
- ✅ **Regularly rotate API keys**
- ✅ **Set minimum required permissions** on Pinata API keys
- ✅ **Monitor API usage** in Pinata dashboard for suspicious activity

## 6. Production Deployment

For production environments, set environment variables in your hosting platform:

### Vercel
```bash
vercel env add VITE_PINATA_JWT
vercel env add VITE_PINATA_API_KEY
vercel env add VITE_PINATA_SECRET_KEY
```

### Netlify
Add variables in: Site Settings → Environment Variables

### Docker
```dockerfile
ENV VITE_PINATA_JWT=your_jwt_token
ENV VITE_PINATA_API_KEY=your_api_key
ENV VITE_PINATA_SECRET_KEY=your_secret_key
```

## Troubleshooting

If you see errors like "Pinata configuration incomplete":
1. Check that your `.env.local` file exists
2. Verify all required environment variables are set
3. Restart your development server after making changes
4. Check browser console for specific error messages

## Support

- [Pinata Documentation](https://docs.pinata.cloud/)
- [Pinata API Reference](https://docs.pinata.cloud/api-reference)