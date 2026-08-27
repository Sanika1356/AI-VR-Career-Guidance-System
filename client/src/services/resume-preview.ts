let activeResumePreviewUrl: string | null = null;

export function setResumePreview(file: File): void {
  if (activeResumePreviewUrl) URL.revokeObjectURL(activeResumePreviewUrl);
  activeResumePreviewUrl = URL.createObjectURL(file);
}

export function getResumePreviewUrl(): string | null {
  return activeResumePreviewUrl;
}

export function clearResumePreview(): void {
  if (activeResumePreviewUrl) URL.revokeObjectURL(activeResumePreviewUrl);
  activeResumePreviewUrl = null;
}
