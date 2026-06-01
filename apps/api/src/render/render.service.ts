import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import type { CalendarProject, RenderStatusResponse, RenderJobStatus } from '@calendar-creator/shared-types';
import { PdfComposerService } from './pdf-composer.service';
import { GhostscriptService } from './ghostscript.service';

interface RenderJob {
  id: string;
  status: RenderJobStatus;
  project: CalendarProject;
  outputPath?: string;
  error?: string;
  createdAt: Date;
}

@Injectable()
export class RenderService {
  private readonly logger = new Logger(RenderService.name);
  private readonly jobs = new Map<string, RenderJob>();
  private readonly outputDir: string;
  private readonly uploadDir: string;

  constructor(
    private readonly pdfComposer: PdfComposerService,
    private readonly ghostscript: GhostscriptService,
  ) {
    this.outputDir = process.env.OUTPUT_DIR || path.join(process.cwd(), 'generated-pdfs');
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

    // Ensure directories exist
    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  /**
   * Queue a render job. In a production setup this would use BullMQ,
   * but for the downloadable app we process inline.
   */
  async enqueueRender(project: CalendarProject): Promise<string> {
    const jobId = uuidv4();
    const job: RenderJob = {
      id: jobId,
      status: 'queued',
      project,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);

    // Process asynchronously
    this.processJob(job).catch((err) => {
      this.logger.error(`Job ${jobId} failed: ${err.message}`);
      job.status = 'failed';
      job.error = err.message;
    });

    return jobId;
  }

  /**
   * Process a render job: compose PDF → convert to CMYK.
   */
  private async processJob(job: RenderJob): Promise<void> {
    job.status = 'processing';

    // Step 1: Compose RGB PDF with PDFKit
    this.logger.log(`Composing PDF for job ${job.id}...`);
    const pdfBuffer = await this.pdfComposer.compose(job.project, this.uploadDir);

    // Save intermediate RGB PDF
    const rgbPath = path.join(this.outputDir, `${job.id}_rgb.pdf`);
    fs.writeFileSync(rgbPath, pdfBuffer);

    // Step 2: Convert to CMYK with Ghostscript
    const cmykPath = path.join(this.outputDir, `${job.id}_cmyk.pdf`);
    const iccPath = process.env.ICC_PROFILE_PATH;
    await this.ghostscript.convertToCmyk(rgbPath, cmykPath, iccPath);

    // Clean up intermediate file
    try {
      fs.unlinkSync(rgbPath);
    } catch {
      // Ignore cleanup errors
    }

    job.outputPath = cmykPath;
    job.status = 'completed';
    this.logger.log(`Job ${job.id} completed: ${cmykPath}`);
  }

  /**
   * Get the status of a render job.
   */
  async getJobStatus(jobId: string): Promise<RenderStatusResponse> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    return {
      jobId: job.id,
      status: job.status,
      downloadUrl: job.status === 'completed' ? `/api/render/download/${job.id}` : undefined,
      error: job.error,
    };
  }

  /**
   * Get the file path for downloading a completed job.
   */
  async getDownloadPath(jobId: string): Promise<string> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }
    if (job.status !== 'completed' || !job.outputPath) {
      throw new NotFoundException(`Job ${jobId} is not ready for download`);
    }
    return job.outputPath;
  }
}
