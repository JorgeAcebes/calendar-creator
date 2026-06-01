import { Module } from '@nestjs/common';
import { RenderController } from './render.controller';
import { RenderService } from './render.service';
import { PdfComposerService } from './pdf-composer.service';
import { GhostscriptService } from './ghostscript.service';

@Module({
  controllers: [RenderController],
  providers: [RenderService, PdfComposerService, GhostscriptService],
})
export class RenderModule {}
