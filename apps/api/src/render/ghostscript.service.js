"use strict";
// =============================================================================
// Ghostscript Service — CMYK conversion and PDF/X post-processing
// =============================================================================
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
var GhostscriptService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhostscriptService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let GhostscriptService = GhostscriptService_1 = class GhostscriptService {
    logger = new common_1.Logger(GhostscriptService_1.name);
    /**
     * Convert an RGB PDF to CMYK with embedded fonts and prepress settings.
     *
     * @param inputPath - Path to the source RGB PDF
     * @param outputPath - Path for the output CMYK PDF
     * @param iccProfilePath - Path to the ICC profile (e.g., ISOcoated_v2_eci.icc)
     */
    async convertToCmyk(inputPath, outputPath, iccProfilePath) {
        // Verify Ghostscript is available
        try {
            await execAsync('gs --version');
        }
        catch {
            this.logger.warn('Ghostscript not found. Skipping CMYK conversion. The PDF will remain in RGB.');
            // Copy the file as-is
            fs.copyFileSync(inputPath, outputPath);
            return;
        }
        const args = [
            'gs',
            '-dBATCH',
            '-dNOPAUSE',
            '-dSAFER',
            '-sDEVICE=pdfwrite',
            '-dPDFSETTINGS=/prepress',
            '-sColorConversionStrategy=CMYK',
            '-sProcessColorModel=DeviceCMYK',
            '-dEmbedAllFonts=true',
            '-dSubsetFonts=true',
            '-dCompatibilityLevel=1.6',
            '-dAutoRotatePages=/None',
            `-sOutputFile="${outputPath}"`,
        ];
        // Add ICC profile if available
        if (iccProfilePath && fs.existsSync(iccProfilePath)) {
            args.push(`-sOutputICCProfile="${iccProfilePath}"`);
        }
        args.push(`"${inputPath}"`);
        const command = args.join(' ');
        this.logger.log(`Running Ghostscript: ${command}`);
        try {
            const { stderr } = await execAsync(command, { timeout: 120000 });
            if (stderr) {
                this.logger.warn(`Ghostscript stderr: ${stderr}`);
            }
            this.logger.log('CMYK conversion completed successfully');
        }
        catch (error) {
            this.logger.error(`Ghostscript failed: ${error}`);
            // Fall back to the RGB version
            fs.copyFileSync(inputPath, outputPath);
        }
    }
};
exports.GhostscriptService = GhostscriptService;
exports.GhostscriptService = GhostscriptService = GhostscriptService_1 = __decorate([
    (0, common_1.Injectable)()
], GhostscriptService);
//# sourceMappingURL=ghostscript.service.js.map