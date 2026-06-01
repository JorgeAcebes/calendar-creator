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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderController = void 0;
const common_1 = require("@nestjs/common");
const render_service_1 = require("./render.service");
let RenderController = class RenderController {
    renderService;
    constructor(renderService) {
        this.renderService = renderService;
    }
    async render(body) {
        const jobId = await this.renderService.enqueueRender(body.project);
        return {
            jobId,
            status: 'queued',
            message: 'Render job queued successfully',
        };
    }
    async getStatus(jobId) {
        return this.renderService.getJobStatus(jobId);
    }
    async download(jobId, res) {
        const filePath = await this.renderService.getDownloadPath(jobId);
        res.download(filePath, `calendar_${jobId}.pdf`);
    }
};
exports.RenderController = RenderController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RenderController.prototype, "render", null);
__decorate([
    (0, common_1.Get)('status/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RenderController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('download/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RenderController.prototype, "download", null);
exports.RenderController = RenderController = __decorate([
    (0, common_1.Controller)('render'),
    __metadata("design:paramtypes", [render_service_1.RenderService])
], RenderController);
//# sourceMappingURL=render.controller.js.map