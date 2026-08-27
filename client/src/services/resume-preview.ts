import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.mjs',
  import.meta.url,
).toString();

let activeResumePreviewUrl: string | null = null;

export async function setResumePreview(file: File): Promise<void> {
  try {
    const bytes = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      await pdf.destroy();
      activeResumePreviewUrl = null;
      return;
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    activeResumePreviewUrl = canvas.toDataURL('image/jpeg', 0.9);
    canvas.width = 0;
    canvas.height = 0;
    await pdf.destroy();
  } catch {
    activeResumePreviewUrl = null;
  }
}

export function getResumePreviewUrl(): string | null {
  return activeResumePreviewUrl;
}

export function clearResumePreview(): void {
  activeResumePreviewUrl = null;
}
