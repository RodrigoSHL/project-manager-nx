import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { FilesApiService } from '../files-api/files-api.service';
import { WorkReport, ReportItem, groupReportSections } from './work-report';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const LEFT = 44;
const RIGHT = PAGE_WIDTH - LEFT;
const CONTENT_WIDTH = RIGHT - LEFT;
const BOTTOM = PAGE_HEIGHT - 95;

@Injectable()
export class WorkReportPdf {
  constructor(private readonly files: FilesApiService) {}

  async render(
    report: WorkReport,
    user: AuthenticatedUser,
    version?: { version: number; status: 'DRAFT' | 'FINAL' }
  ): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 72, right: LEFT, bottom: 55, left: LEFT },
      bufferPages: true,
      autoFirstPage: true,
    });
    const whitePage = () =>
      doc.save().rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill('#FFFFFF').restore();
    whitePage();
    doc.on('pageAdded', whitePage);
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const finished = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
    const ink = '#111827';
    const muted = '#64748b';
    const ensure = (height: number) => {
      if (doc.y + height > BOTTOM) doc.addPage();
    };
    const heading = (value: string, size = 13) => {
      ensure(size + 26);
      doc
        .moveDown(0.6)
        .font('Helvetica-Bold')
        .fontSize(size)
        .fillColor(ink)
        .text(value, LEFT, doc.y, { width: CONTENT_WIDTH });
      doc.moveDown(0.35);
    };
    const line = (label: string, value?: string | null) => {
      if (!value) return;
      const content = label ? `${label}: ${value}` : value;
      const h = doc
        .font('Helvetica')
        .fontSize(9)
        .heightOfString(content, { width: CONTENT_WIDTH });
      ensure(h + 5);
      doc.fillColor(ink).text(content, LEFT, doc.y, { width: CONTENT_WIDTH });
      doc.moveDown(0.25);
    };
    const itemText = (item: ReportItem) => {
      const lines = [
        item.type === 'TASK'
          ? `${item.completed ? 'Realizada' : 'Pendiente'} · ${item.title}`
          : `${item.title}: ${item.value || '—'}`,
      ];
      if (item.description) lines.push(item.description);
      if (item.observation) lines.push(`Observación: ${item.observation}`);
      return lines.join('\n');
    };
    const h = report.header;
    if (version) {
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(version.status === 'FINAL' ? '#047857' : '#92400E')
        .text(
          `Informe v${version.version} · ${
            version.status === 'FINAL' ? 'FINAL' : 'BORRADOR'
          }`,
          LEFT,
          doc.y,
          { width: CONTENT_WIDTH }
        );
      doc.moveDown(0.4);
    }
    doc
      .font('Helvetica-Bold')
      .fontSize(19)
      .fillColor(ink)
      .text(h.title, LEFT, doc.y, { width: CONTENT_WIDTH });
    doc.moveDown(0.5);
    line('Fecha', h.executionDate);
    line('Trabajo', h.workId);
    line('Contenido', h.content);
    line('Solicitado por', h.requestedBy);
    line('Preparado por', h.preparedBy);
    line('Aprobado por', h.approvedBy);
    line('Distribución', h.distribution);
    line('Recibido conforme', h.receivedBy);
    heading('Datos generales');
    line('Mina / faena', h.site);
    line('Activo principal', h.asset);
    line('Tipo de trabajo', h.workType);
    line('Responsable', h.responsible);
    line('Empresa contratista', h.company);
    line('Estado', h.status);
    if (h.introduction) {
      heading('Introducción');
      line('', h.introduction);
    }

    for (const section of groupReportSections(report.sections)) {
      ensure(100);
      heading(section.title);
      if (section.description) line('', section.description);
      for (const assetGroup of section.assetGroups ?? []) {
        ensure(30);
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(muted)
          .text(assetGroup.assetPath, LEFT, doc.y, { width: CONTENT_WIDTH });
        doc.moveDown(0.25);
        for (const item of assetGroup.items) {
          const content = itemText(item);
          const textHeight = doc
            .font('Helvetica')
            .fontSize(9)
            .heightOfString(content, { width: CONTENT_WIDTH - 20 });
          ensure(textHeight + 16);
          doc
            .roundedRect(LEFT, doc.y, CONTENT_WIDTH, textHeight + 12, 3)
            .fill('#F8FAFC');
          doc
            .fillColor(ink)
            .text(content, LEFT + 8, doc.y + 6, { width: CONTENT_WIDTH - 16 });
          doc.y += 10;
          if (item.photos.length)
            await this.drawPhotos(doc, item.photos, user, ensure);
        }
      }
    }
    heading('Observaciones adicionales');
    line('', report.observations || 'Sin observaciones adicionales.');
    ensure(100);
    heading('Hallazgos');
    if (!report.findings.length) {
      line('', 'No se registraron hallazgos durante la ejecución del trabajo.');
    } else {
      const widths = [25, 245, 77, 42, 106];
      const drawCells = (cells: string[], header = false) => {
        doc.font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
        const heights = cells.map((cell, index) =>
          doc.heightOfString(cell, { width: widths[index] - 10 })
        );
        const rowHeight = Math.max(23, ...heights.map((n) => n + 10));
        ensure(rowHeight);
        const y = doc.y;
        doc
          .rect(LEFT, y, CONTENT_WIDTH, rowHeight)
          .fill(header ? '#E2E8F0' : '#FFFFFF');
        let x = LEFT;
        cells.forEach((cell, index) => {
          doc.fillColor(ink).text(cell, x + 5, y + 5, {
            width: widths[index] - 10,
            height: rowHeight - 8,
          });
          x += widths[index];
        });
        doc.y = y + rowHeight;
      };
      drawCells(['Nº', 'Hallazgo', 'Criticidad', 'HH', 'Materiales'], true);
      for (const finding of report.findings) {
        drawCells([
          String(finding.number),
          `${finding.assetPath}\n${finding.title}${
            finding.description ? `\n${finding.description}` : ''
          }`,
          finding.severity || '—',
          finding.manHours == null ? '—' : String(finding.manHours),
          finding.materials || '—',
        ]);
      }
    }
    const count = doc.bufferedPageRange().count;
    for (let page = 0; page < count; page++) {
      doc.switchToPage(page);
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(muted)
        .text(`${report.branding.companyName} · ${h.workType}`, LEFT, 30, {
          width: CONTENT_WIDTH,
          align: 'left',
          lineBreak: false,
        });
      doc.moveTo(LEFT, 48).lineTo(RIGHT, 48).strokeColor('#CBD5E1').stroke();
      doc
        .moveTo(LEFT, PAGE_HEIGHT - 78)
        .lineTo(RIGHT, PAGE_HEIGHT - 78)
        .stroke();
      doc.text(
        report.branding.footerText || 'Documento generado por sistema',
        LEFT,
        PAGE_HEIGHT - 70,
        { width: 300, lineBreak: false }
      );
      doc.text(
        `Página ${page + 1} de ${count}`,
        RIGHT - 110,
        PAGE_HEIGHT - 70,
        { width: 110, align: 'right', lineBreak: false }
      );
    }
    doc.end();
    return finished;
  }

  private async drawPhotos(
    doc: PDFKit.PDFDocument,
    photos: ReportItem['photos'],
    user: AuthenticatedUser,
    ensure: (height: number) => void
  ) {
    for (let index = 0; index < photos.length; index++) {
      const photo = photos[index];
      const content = await this.files.content(photo.id, user);
      const buffer = Buffer.from(await content.arrayBuffer());
      const metadata = await sharp(buffer).metadata();
      const converted = await sharp(buffer)
        .rotate()
        .resize({
          width: 1200,
          height: 1200,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
      const ratio = (metadata.width || 1) / (metadata.height || 1);
      const next = photos[index + 1];
      const pair = ratio > 1.25 && next;
      const boxWidth = pair ? (CONTENT_WIDTH - 12) / 2 : CONTENT_WIDTH;
      const imageHeight = Math.min(pair ? 190 : 290, boxWidth / ratio);
      ensure(imageHeight + 33);
      const y = doc.y;
      doc.image(converted, LEFT, y, {
        fit: [boxWidth, imageHeight],
        align: 'center',
        valign: 'center',
      });
      doc.y = y + imageHeight + 3;
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#64748b')
        .text(photo.caption, LEFT, doc.y, { width: boxWidth });
      doc.y += 7;
      if (pair) {
        const nextContent = await this.files.content(next.id, user);
        const nextBuffer = Buffer.from(await nextContent.arrayBuffer());
        const nextImage = await sharp(nextBuffer)
          .rotate()
          .resize({
            width: 1200,
            height: 1200,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .png()
          .toBuffer();
        doc.image(nextImage, LEFT + boxWidth + 12, y, {
          fit: [boxWidth, imageHeight],
          align: 'center',
          valign: 'center',
        });
        doc.text(next.caption, LEFT + boxWidth + 12, y + imageHeight + 3, {
          width: boxWidth,
        });
        index++;
      }
    }
  }
}
