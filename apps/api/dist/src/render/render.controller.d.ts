import { Response } from 'express';
import { RenderService } from './render.service';
import type { RenderRequest, RenderResponse, RenderStatusResponse } from '@calendar-creator/shared-types';
export declare class RenderController {
    private readonly renderService;
    constructor(renderService: RenderService);
    render(body: RenderRequest): Promise<RenderResponse>;
    getStatus(jobId: string): Promise<RenderStatusResponse>;
    download(jobId: string, res: Response): Promise<void>;
}
//# sourceMappingURL=render.controller.d.ts.map