// =============================================================================
// Ghostscript Service — CMYK conversion and PDF/X post-processing
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
const execAsync = promisify(exec);

@Injectable()
export class GhostscriptService {
  private readonly logger = new Logger(GhostscriptService.name);

  /**
   * Convert an RGB PDF to CMYK with embedded fonts and prepress settings.
   *
   * @param inputPath - Path to the source RGB PDF
   * @param outputPath - Path for the output CMYK PDF
   * @param iccProfilePath - Path to the ICC profile (e.g., ISOcoated_v2_eci.icc)
   */
  async convertToCmyk(
    inputPath: string,
    outputPath: string,
    iccProfilePath?: string,
  ): Promise<void> {
    // Verify Ghostscript is available
    try {
      await execAsync('gs --version');
    } catch {
      this.logger.warn(
        'Ghostscript not found. Skipping CMYK conversion. The PDF will remain in RGB.',
      );
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
    } catch (error) {
      this.logger.error(`Ghostscript failed: ${error}`);
      // Fall back to the RGB version
      fs.copyFileSync(inputPath, outputPath);
    }
  }
}
