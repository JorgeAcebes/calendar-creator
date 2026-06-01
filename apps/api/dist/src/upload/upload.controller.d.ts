import { UploadService } from './upload.service';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    uploadFile(file: Express.Multer.File): Promise<import("@calendar-creator/shared-types").UploadImageResponse>;
}
//# sourceMappingURL=upload.controller.d.ts.map