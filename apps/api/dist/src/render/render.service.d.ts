import type { CalendarProject, RenderStatusResponse } from '@calendar-creator/shared-types';
import { PdfComposerService } from './pdf-composer.service';
import { GhostscriptService } from './ghostscript.service';
export declare class RenderService {
    private readonly pdfComposer;
    private readonly ghostscript;
    private readonly logger;
    private readonly jobs;
    private readonly outputDir;
    private readonly uploadDir;
    constructor(pdfComposer: PdfComposerService, ghostscript: GhostscriptService);
    /**
     * Queue a render job. In a production setup this would use BullMQ,
     * but for the downloadable app we process inline.
     */
    enqueueRender(project: CalendarProject): Promise<string>;
    /**
     * Process a render job: compose PDF → convert to CMYK.
     */
    private processJob;
    /**
     * Get the status of a render job.
     */
    getJobStatus(jobId: string): Promise<RenderStatusResponse>;
    /**
     * Get the file path for downloading a completed job.
     */
    getDownloadPath(jobId: string): Promise<string>;
}
//# sourceMappingURL=render.service.d.ts.map