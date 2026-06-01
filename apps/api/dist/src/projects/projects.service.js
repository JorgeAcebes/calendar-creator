"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProjectsService = class ProjectsService {
    prisma;
    localUserId = '';
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    getLocalUserId() {
        return this.localUserId;
    }
    async create(dto) {
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
    async findOne(id) {
        const project = await this.prisma.project.findFirst({
            where: { id, userId: this.getLocalUserId() },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        return project;
    }
    async update(id, dto) {
        const project = await this.prisma.project.findFirst({
            where: { id, userId: this.getLocalUserId() },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        return this.prisma.project.update({
            where: { id },
            data: {
                name: dto.name,
                data: dto.data,
            },
        });
    }
    async remove(id) {
        const project = await this.prisma.project.findFirst({
            where: { id, userId: this.getLocalUserId() },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        return this.prisma.project.delete({
            where: { id },
        });
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map