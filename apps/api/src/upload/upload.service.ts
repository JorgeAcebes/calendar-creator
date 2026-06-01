import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { UploadImageResponse } from '@calendar-creator/shared-types';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;
  private readonly thumbDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    this.thumbDir = path.join(this.uploadDir, 'thumbs');
    fs.mkdirSync(this.thumbDir, { recursive: true });
  }

  async processUpload(file: Express.Multer.File): Promise<UploadImageResponse> {
    const id = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${id}${ext}`;
    const filePath = path.join(this.uploadDir, filename);
    const thumbPath = path.join(this.thumbDir, `${id}_thumb.jpg`);

    // Save original
    fs.writeFileSync(filePath, file.buffer);

    // Get metadata
    const metadata = await sharp(file.buffer).metadata();

    // Generate thumbnail (400px wide, JPEG)
    await sharp(file.buffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbPath);

    this.logger.log(`Uploaded: ${file.originalname} → ${filename} (${metadata.width}×${metadata.height})`);

    return {
      id,
      originalFilename: file.originalname,
      storagePath: filePath,
      thumbnailPath: thumbPath,
      widthPx: metadata.width ?? 0,
      heightPx: metadata.height ?? 0,
      fileSizeBytes: file.size,
      mimeType: file.mimetype,
    };
  }
}
