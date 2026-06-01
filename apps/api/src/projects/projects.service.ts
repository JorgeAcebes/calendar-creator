import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService implements OnModuleInit {
  private localUserId: string = '';

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Ensure a default local user exists for local usage
    let user = await this.prisma.user.findUnique({ where: { email: 'local@calendar.app' } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: 'local@calendar.app',
          name: 'Local User',
          password: 'nopassword', // Not used since auth is bypassed
        }
      });
    }
    this.localUserId = user.id;
  }

  private getLocalUserId() {
    return this.localUserId;
  }

  async create(dto: CreateProjectDto) {
    const parsed = JSON.parse(dto.data);
    return this.prisma.project.create({
      data: {
        id: parsed.id,
        name: dto.name,
        data: dto.data,
        userId: this.getLocalUserId(),
      },
    });
  }

  async findAll() {
    return this.prisma.project.findMany({
      where: { userId: this.getLocalUserId() },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId: this.getLocalUserId() },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId: this.getLocalUserId() },
    });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        data: dto.data,
      },
    });
  }

  async remove(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId: this.getLocalUserId() },
    });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.project.delete({
      where: { id },
    });
  }
}
