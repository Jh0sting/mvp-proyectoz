import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit lee sus fuentes desde node_modules en tiempo de ejecución.
  serverExternalPackages: ["pdfkit", "svg-to-pdfkit"],
};

export default nextConfig;
