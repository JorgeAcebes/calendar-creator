"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RenderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pdf_composer_service_1 = require("./pdf-composer.service");
const ghostscript_service_1 = require("./ghostscript.service");
let RenderService = RenderService_1 = class RenderService {
    pdfComposer;
    ghostscript;
    logger = new common_1.Logger(RenderService_1.name);
    jobs = new Map();
    outputDir;
    uploadDir;
    constructor(pdfComposer, ghostscript) {
        this.pdfComposer = pdfComposer;
        this.ghostscript = ghostscript;
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
    async enqueueRender(project) {
        const jobId = (0, uuid_1.v4)();
        const job = {
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
    async processJob(job) {
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
        }
        catch {
            // Ignore cleanup errors
        }
        job.outputPath = cmykPath;
        job.status = 'completed';
        this.logger.log(`Job ${job.id} completed: ${cmykPath}`);
    }
    /**
     * Get the status of a render job.
     */
    async getJobStatus(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new common_1.NotFoundException(`Job ${jobId} not found`);
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
    async getDownloadPath(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new common_1.NotFoundException(`Job ${jobId} not found`);
        }
        if (job.status !== 'completed' || !job.outputPath) {
            throw new common_1.NotFoundException(`Job ${jobId} is not ready for download`);
        }
        return job.outputPath;
    }
};
exports.RenderService = RenderService;
exports.RenderService = RenderService = RenderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pdf_composer_service_1.PdfComposerService,
        ghostscript_service_1.GhostscriptService])
], RenderService);
//# sourceMappingURL=render.service.js.map