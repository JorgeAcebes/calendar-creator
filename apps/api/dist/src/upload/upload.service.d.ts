import type { UploadImageResponse } from '@calendar-creator/shared-types';
export declare class UploadService {
    private readonly logger;
    private readonly uploadDir;
    private readonly thumbDir;
    constructor();
    processUpload(file: Express.Multer.File): Promise<UploadImageResponse>;
}
//# sourceMappingURL=upload.service.d.ts.map