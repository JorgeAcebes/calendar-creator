export declare class GhostscriptService {
    private readonly logger;
    /**
     * Convert an RGB PDF to CMYK with embedded fonts and prepress settings.
     *
     * @param inputPath - Path to the source RGB PDF
     * @param outputPath - Path for the output CMYK PDF
     * @param iccProfilePath - Path to the ICC profile (e.g., ISOcoated_v2_eci.icc)
     */
    convertToCmyk(inputPath: string, outputPath: string, iccProfilePath?: string): Promise<void>;
}
//# sourceMappingURL=ghostscript.service.d.ts.map