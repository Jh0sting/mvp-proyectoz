declare module "svg-to-pdfkit" {
  const SVGtoPDF: (doc: PDFKit.PDFDocument, svg: string, x: number, y: number, options?: { width?: number; height?: number; assumePt?: boolean }) => void;
  export default SVGtoPDF;
}
