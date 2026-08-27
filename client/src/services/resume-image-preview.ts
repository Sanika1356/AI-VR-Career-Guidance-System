export interface ResumeImagePreview {
  imageUrl: string;
  width: number;
  height: number;
}

type PdfDocument = {
  getPage: (pageNumber: number) => Promise<{
    getViewport: (options: { scale: number }) => { width: number; height: number };
    render: (options: Record<string, unknown>) => { promise: Promise<unknown> };
  }>;
  destroy?: () => Promise<void>;
};

type PdfJsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: Record<string, unknown>) => {
    promise: Promise<PdfDocument>;
  };
  version?: string;
};

let pdfJsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfJsPromise) {
    pdfJsPromise = import('pdfjs-dist').then((module) => {
      const pdfJs = module as unknown as PdfJsModule;
      const version = pdfJs.version || '5.4.54';
      pdfJs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
      return pdfJs;
    });
  }
  return pdfJsPromise;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
}

export async function createResumeImagePreview(file: File): Promise<ResumeImagePreview | null> {
  let pdf: PdfDocument | undefined;
  try {
    const pdfJs = await Promise.race([
      loadPdfJs(),
      new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error('Resume image preview timed out.')), 12_000),
      ),
    ]);
    const loadingTask = pdfJs.getDocument({
      data: await file.arrayBuffer(),
      useSystemFonts: true,
      stopAtErrors: false,
    });
    pdf = await Promise.race([
      loadingTask.promise,
      new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error('Resume image rendering timed out.')), 12_000),
      ),
    ]);
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    await page.render({ canvasContext: context, viewport }).promise;

    const blob = await canvasToBlob(canvas);
    if (!blob) return null;
    return {
      imageUrl: URL.createObjectURL(blob),
      width: canvas.width,
      height: canvas.height,
    };
  } catch {
    return null;
  } finally {
    try {
      await pdf?.destroy?.();
    } catch {
      // Preview cleanup is best effort and must not affect analysis.
    }
  }
}
