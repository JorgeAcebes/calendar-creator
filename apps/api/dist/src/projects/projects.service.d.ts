import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
export declare class ProjectsService implements OnModuleInit {
    private prisma;
    private localUserId;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private getLocalUserId;
    create(dto: CreateProjectDto): Promise<{
        data: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        data: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    update(id: string, dto: UpdateProjectDto): Promise<{
        data: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    remove(id: string): Promise<{
        data: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
}
//# sourceMappingURL=projects.service.d.ts.map