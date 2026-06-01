import { CalendarProject } from '@calendar-creator/shared-types';
export declare class PdfComposerService {
    private readonly logger;
    /**
     * Compose a complete calendar PDF from the project state.
     * Returns a Buffer containing the raw PDF.
     */
    compose(project: CalendarProject, uploadDir: string): Promise<Buffer>;
    /**
     * Draw crop marks at the four corners of the trim area.
     */
    private drawCropMarks;
    /**
     * Render the calendar grid on a month page.
     */
    private renderCalendarGrid;
    /**
     * Render cover text overlay.
     */
    private renderCoverText;
}
//# sourceMappingURL=pdf-composer.service.d.ts.map