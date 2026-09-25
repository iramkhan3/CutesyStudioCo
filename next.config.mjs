/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product photos uploaded via /admin/products go to Supabase Storage
    // (see lib/admin-products.ts + app/api/admin/upload) and are served from
    // this project's own *.supabase.co storage host.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  // About/Reviews/Contact/Customize are now homepage sections, not separate
  // pages — redirect old URLs (bookmarks, any indexed links) to the anchor.
  async redirects() {
    return [
      { source: "/about", destination: "/#about", permanent: true },
      { source: "/reviews", destination: "/#reviews", permanent: true },
      { source: "/contact", destination: "/#contact", permanent: true },
      { source: "/custom", destination: "/#customize", permanent: true },
    ];
  },
};

export default nextConfig;
