import { Controller, Post, Body, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { RenderService } from './render.service';
import type { RenderRequest, RenderResponse, RenderStatusResponse } from '@calendar-creator/shared-types';

@Controller('render')
export class RenderController {
  constructor(private readonly renderService: RenderService) {}

  @Post()
  async render(@Body() body: RenderRequest): Promise<RenderResponse> {
    const jobId = await this.renderService.enqueueRender(body.project);
    return {
      jobId,
      status: 'queued',
      message: 'Render job queued successfully',
    };
  }

  @Get('status/:jobId')
  async getStatus(@Param('jobId') jobId: string): Promise<RenderStatusResponse> {
    return this.renderService.getJobStatus(jobId);
  }

  @Get('download/:jobId')
  async download(
    @Param('jobId') jobId: string,
    @Res() res: Response,
  ): Promise<void> {
    const filePath = await this.renderService.getDownloadPath(jobId);
    res.download(filePath, `calendar_${jobId}.pdf`);
  }
}
