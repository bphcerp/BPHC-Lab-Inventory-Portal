import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authenticateToken';
import { ConsumableTransactionModel } from '../models/consumableTransaction';
import PDFDocument from 'pdfkit';
import { IPeople } from '../models/people';

const router = express.Router();

router.use(authenticateToken);

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type, startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ message: 'Start date and end date are required.' });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59);

    const filter: any = { transactionDate: { $gte: start, $lte: end } };
    if (type === 'ADD' || type === 'ISSUE') {
      filter.transactionType = type;
    }

    const transactions = await ConsumableTransactionModel.find(filter).populate([
      'addedBy',
      'issuedBy',
      'issuedTo',
    ]);

    res.status(200).json(transactions);
  })
);

router.get(
  '/pdf',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type, startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).send('Start date and end date are required.');
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59);

    const filter: any = { transactionDate: { $gte: start, $lte: end } };
    if (type === 'ADD' || type === 'ISSUE') {
      filter.transactionType = type;
    }

    const transactions = await ConsumableTransactionModel.find(filter)
      .populate('addedBy', 'name')
      .populate('issuedBy', 'name')
      .populate('issuedTo', 'name');

    const doc = new PDFDocument({ layout: 'landscape', margin: 10 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=consumable-report.pdf');

    doc.pipe(res);

    doc.fontSize(12).text('Consumable Transactions Report', { align: 'center' });
    doc.moveDown(0.5);

    // Define table headers
    const headers = [
      'S.No',
      'Consumable Name',
      'Transaction Type',
      'Qty',
      'Ref No.',
      'Added By',
      'Issued By',
      'Issued To',
      'Date',
      'Category Fields',
    ];

    // Adjusted column widths
    const columnWidths = [20, 100, 80, 40, 70, 80, 80, 80, 60, 150];
    const rowHeight = 15;
    const tableStartX = 10;
    const tableStartY = 70;

    // Draw table headers
    let y = tableStartY;
    doc.fontSize(8).font('Helvetica-Bold');
    headers.forEach((header, i) => {
      doc.text(header, tableStartX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
        width: columnWidths[i],
        align: 'center',
      });
    });

    y += rowHeight;
    doc.font('Helvetica').fontSize(8);

    // Add table rows
    transactions.forEach((txn, index) => {
      const addedBy = (txn.addedBy as { name: string })?.name || 'N/A';
      const issuedBy = (txn.issuedBy as { name: string })?.name || 'N/A';
      const issuedTo = (txn.issuedTo as { name: string })?.name || 'N/A';

      const categoryDetails = txn.categoryFields
        ? Object.entries(txn.categoryFields)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
        : 'N/A';

      const row = [
        index + 1,
        txn.consumableName,
        txn.transactionType,
        txn.transactionQuantity,
        txn.referenceNumber || 'N/A',
        addedBy,
        issuedBy,
        issuedTo,
        txn.transactionDate.toLocaleDateString(), // Only date
        categoryDetails,
      ];

      row.forEach((cell, i) => {
        doc.text(cell.toString(), tableStartX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
          width: columnWidths[i],
          align: 'left',
        });
      });

      y += rowHeight;

      // Handle page overflow
      if (y > doc.page.height - 20) {
        doc.addPage({ layout: 'landscape' });
        y = tableStartY;

        // Redraw headers on the new page
        doc.font('Helvetica-Bold');
        headers.forEach((header, i) => {
          doc.text(header, tableStartX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
            width: columnWidths[i],
            align: 'center',
          });
        });

        y += rowHeight;
        doc.font('Helvetica');
      }
    });

    doc.end();
  })
);

export default router;
