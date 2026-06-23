import { v4 as uuidv4 } from 'uuid';
import type { UploadedImage } from '@calendar-creator/shared-types';
import { useCalendarStore } from '@/store/calendarStore';

export interface FileData {
  name: string;
  size: number;
  type: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

export type DuplicatePromptCallback = (
  duplicates: FileData[],
  newFiles: FileData[]
) => Promise<boolean>;

export async function uploadFiles(
  filesData: FileData[],
  promptForDuplicates?: DuplicatePromptCallback
): Promise<string[]> {
  const storeState = useCalendarStore.getState();
  const currentImages = Object.values(storeState.project.images);
  const warnOnDuplicate = storeState.project.globalSettings.warnOnDuplicatePhotos !== false;

  const duplicates: FileData[] = [];
  const newFiles: FileData[] = [];

  for (const file of filesData) {
    if (warnOnDuplicate) {
      const existsInStore = currentImages.some((img: any) => img.originalFilename === file.name && img.fileSizeBytes === file.size);
      const existsInBatch = newFiles.some(f => f.name === file.name && f.size === file.size) || duplicates.some(f => f.name === file.name && f.size === file.size);
      
      if (existsInStore || existsInBatch) {
        if (!duplicates.some(f => f.name === file.name && f.size === file.size)) {
           duplicates.push(file);
        }
        continue;
      }
    }
    newFiles.push(file);
  }

  const filesToUpload = [...newFiles];

  if (duplicates.length > 0 && promptForDuplicates) {
    const uploadDuplicates = await promptForDuplicates(duplicates, newFiles);
    if (uploadDuplicates) {
      filesToUpload.push(...duplicates);
    }
  } else if (duplicates.length > 0 && !promptForDuplicates) {
    // If no prompt provided, we just skip duplicates or add them? 
    // By default, if no UI prompt is available, we skip duplicates to be safe.
  }

  const uploadedIds: string[] = [];

  for (const file of filesToUpload) {
    try {
      const buffer = await file.arrayBuffer();
      const blob = new Blob([buffer], { type: file.type });
      const reader = new FileReader();
      
      const imgData = await new Promise<UploadedImage>((resolve, reject) => {
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const imageData: UploadedImage = {
              id: uuidv4(),
              originalFilename: file.name,
              storagePath: '',
              thumbnailPath: '',
              previewDataUrl: reader.result as string,
              widthPx: img.naturalWidth,
              heightPx: img.naturalHeight,
              fileSizeBytes: file.size,
              mimeType: file.type as UploadedImage['mimeType'],
              folder: 'Sin clasificar',
            };
            resolve(imageData);
          };
          img.onerror = reject;
          img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      useCalendarStore.getState().addImage(imgData);
      uploadedIds.push(imgData.id);
    } catch(err) {
      console.error("Error processing file", err);
    }
  }

  // Also return any duplicates that were already in the store so they can be assigned
  // Wait, if they were skipped, we might want to return their existing IDs!
  // If we drop an existing file, it's nice to just assign the existing one.
  for (const dup of duplicates) {
    if (!filesToUpload.includes(dup)) {
      const existing = currentImages.find((img: any) => img.originalFilename === dup.name && img.fileSizeBytes === dup.size);
      if (existing) {
        uploadedIds.push(existing.id);
      }
    }
  }

  return uploadedIds;
}
