import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Table, TableDocument } from './table.schema';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import * as QRCode from 'qrcode';
import * as jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';

@Injectable()
export class TablesService {
  constructor(
    @InjectModel(Table.name) private tableModel: Model<TableDocument>,
  ) {}

  async create(createTableDto: CreateTableDto): Promise<Table> {
    const { tableNumber } = createTableDto;
    const existingTable = await this.tableModel.findOne({ tableNumber });

    if (existingTable) {
      throw new ConflictException('Table number already exists');
    }

    const table = new this.tableModel(createTableDto);
    return table.save();
  }

  async findAll(): Promise<Table[]> {
    return this.tableModel.find().exec();
  }

  async findOne(id: string): Promise<TableDocument> {
    const table = await this.tableModel.findById(id).exec();
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async update(id: string, updateDto: UpdateTableDto): Promise<Table> {
    const table = await this.tableModel.findById(id);
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (updateDto.tableNumber) {
      const existed = await this.tableModel.findOne({
        tableNumber: updateDto.tableNumber,
        _id: { $ne: id },
      });

      if (existed) {
        throw new ConflictException('Table number already exists');
      }
    }

    Object.assign(table, updateDto);
    return table.save();
  }

  async updateStatus(id: string, statusDto: UpdateStatusDto): Promise<Table> {
    const table = await this.tableModel
      .findByIdAndUpdate(id, { status: statusDto.status }, { new: true })
      .exec();
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async generateQR(
    id: string,
  ): Promise<{ qrUrl: string; token: string; createdAt: string }> {
    const table = await this.findOne(id);
    const nextVersion = (table.qrTokenVersion ?? 0) + 1;

    const payload = {
      tableId: table._id,
      v: nextVersion,
      createdAt: Date.now(),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: '30d',
    });

    const qrUrl = `https://restaurant-domain.com/menu?table=${table._id}&token=${token}`;

    const updatedTable = await this.tableModel.findByIdAndUpdate(id, {
      qrToken: token,
      qrTokenCreatedAt: new Date(),
      qrTokenVersion: nextVersion,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl);

    return {
      qrUrl: qrCodeDataUrl,
      token,
      createdAt: updatedTable!.qrTokenCreatedAt!.toISOString().split('T')[0],
    };
  }

  async downloadQR(
    id: string,
    format: 'png' | 'pdf',
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const table = await this.findOne(id);

    if (!table.qrToken) {
      throw new NotFoundException(
        'QR code not generated yet. Please generate first.',
      );
    }

    const qrUrl = `https://restaurant-domain.com/menu?table=${table._id}&token=${table.qrToken}`;

    if (format === 'png') {
      const qrBuffer = await QRCode.toBuffer(qrUrl, {
        width: 500,
        margin: 2,
        errorCorrectionLevel: 'H',
      });

      return {
        buffer: qrBuffer,
        filename: `table-${table.tableNumber}-qr.png`,
        contentType: 'image/png',
      };
    }

    // PDF format
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          resolve({
            buffer: Buffer.concat(buffers),
            filename: `table-${table.tableNumber}-qr.pdf`,
            contentType: 'application/pdf',
          });
        });
        doc.on('error', reject);

        // Title
        doc
          .fontSize(28)
          .font('Helvetica-Bold')
          .text('Smart Restaurant', { align: 'center' });
        doc.moveDown(0.5);

        // Table Info
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text(`Table ${table.tableNumber}`, { align: 'center' });
        doc.moveDown(0.3);

        doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Capacity: ${table.capacity} seats`, { align: 'center' });
        if (table.location) {
          doc.text(`Location: ${table.location}`, { align: 'center' });
        }
        doc.moveDown(1);

        // QR Code
        QRCode.toBuffer(qrUrl, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: 'H',
        })
          .then((qrBuffer) => {
            const xPos = (doc.page.width - 300) / 2;
            doc.image(qrBuffer, xPos, doc.y, { width: 300 });
            doc.moveDown(8);

            // Instructions
            doc
              .fontSize(16)
              .font('Helvetica-Bold')
              .text('📱 Scan to Order', { align: 'center' });
            doc.moveDown(0.5);

            doc
              .fontSize(10)
              .font('Helvetica')
              .text('1. Open your camera app', { align: 'center' })
              .text('2. Point at the QR code', { align: 'center' })
              .text('3. Tap the notification to view menu', {
                align: 'center',
              });

            doc.moveDown(1);
            doc
              .fontSize(8)
              .fillColor('gray')
              .text(`Generated: ${new Date().toLocaleDateString()}`, {
                align: 'center',
              });

            doc.end();
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async downloadAllQR(): Promise<{ buffer: Buffer; filename: string }> {
    const tables = await this.tableModel.find({ status: 'active' }).exec();

    if (tables.length === 0) {
      throw new NotFoundException('No active tables found');
    }

    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const buffers: Buffer[] = [];

      archive.on('data', (chunk) => buffers.push(chunk));
      archive.on('end', () => {
        resolve({
          buffer: Buffer.concat(buffers),
          filename: `all-tables-qr-${Date.now()}.zip`,
        });
      });
      archive.on('error', reject);

      // Generate QR code for each table
      const promises = tables.map(async (table) => {
        if (!table.qrToken) return;

        const qrUrl = `https://restaurant-domain.com/menu?table=${table._id}&token=${table.qrToken}`;
        const qrBuffer = await QRCode.toBuffer(qrUrl, {
          width: 500,
          margin: 2,
          errorCorrectionLevel: 'H',
        });

        archive.append(qrBuffer, { name: `table-${table.tableNumber}-qr.png` });
      });

      Promise.all(promises)
        .then(() => archive.finalize())
        .catch(reject);
    });
  }

  async regenerateAllQR(): Promise<{ affected: number; tables: string[] }> {
    const tables = await this.tableModel.find({ status: 'active' }).exec();

    if (tables.length === 0) {
      throw new NotFoundException('No active tables found');
    }

    const tableNumbers: string[] = [];

    for (const table of tables) {
      const nextVersion = (table.qrTokenVersion ?? 0) + 1;

      const payload = {
        tableId: table._id,
        v: nextVersion,
        createdAt: Date.now(),
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
      });

      await this.tableModel.findByIdAndUpdate(table._id, {
        qrToken: token,
        qrTokenCreatedAt: new Date(),
        qrTokenVersion: nextVersion,
      });

      tableNumbers.push(table.tableNumber);
    }

    return {
      affected: tables.length,
      tables: tableNumbers,
    };
  }
}
