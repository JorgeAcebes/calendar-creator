import { Module } from '@nestjs/common';
import { RenderModule } from './render/render.module';
import { UploadModule } from './upload/upload.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    RenderModule,
    UploadModule,
    PrismaModule,
    AuthModule,
    ProjectsModule,
  ],
})
export class AppModule {}
