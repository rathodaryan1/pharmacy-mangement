declare module "pdfkit" {
  interface PDFDocumentOptions {
    margin?: number;
  }
  class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    pipe(dest: NodeJS.WritableStream): this;
    fontSize(size: number): this;
    text(text: string, xOrOptions?: number | Record<string, unknown>, y?: number, options?: Record<string, unknown>): this;
    moveDown(n?: number): this;
    end(): void;
  }
  export = PDFDocument;
}
