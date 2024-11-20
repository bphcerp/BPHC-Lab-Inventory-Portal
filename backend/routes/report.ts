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

    const doc = new PDFDocument({ layout: 'landscape', margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=consumable-report.pdf');

    doc.pipe(res);
    doc.fontSize(18).text('Consumable Transactions Report', { align: 'center' });
    doc.moveDown();

    // Gather all unique category fields
    const categoryFieldsSet = new Set<string>();
    transactions.forEach(txn => {
      const categoryFields = txn.categoryFields || {};
      Object.keys(categoryFields).forEach(field => categoryFieldsSet.add(field));
    });

    const categoryFieldsArray = Array.from(categoryFieldsSet);

    // Define table headers including category fields
    const headers = [
      'S.No',
      'Consumable Name',
      'Transaction Type',
      'Quantity',
      'Reference No.',
      'Added By',
      'Issued By',
      'Issued To',
      'Date',
      ...categoryFieldsArray,
    ];

    const tableStartX = 30;
    const tableStartY = 100;
    const columnWidths = [
      30, // S.No
      100, // Consumable Name
      100, // Transaction Type
      50, // Quantity
      80, // Reference No.
      80, // Added By
      80, // Issued By
      80, // Issued To
      100, // Date
      ...categoryFieldsArray.map(() => 80), // Dynamic width for category fields
    ];
    const rowHeight = 20;

    // Draw table header
    let y = tableStartY;
    doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach((header, i) => {
      doc.text(header, tableStartX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
        width: columnWidths[i],
        align: 'center',
      });
    });

    // Draw table rows
    y += rowHeight;
    doc.font('Helvetica');
    transactions.forEach((txn, index) => {
      const addedBy = (txn.addedBy as IPeople)?.name || 'N/A';
      const issuedBy = (txn.issuedBy as IPeople)?.name || 'N/A';
      const issuedTo = (txn.issuedTo as IPeople)?.name || 'N/A';
       const categoryFields = (txn.categoryFields as Record<string, any>) || {};

      const row = [
        index + 1,
        txn.consumableName,
        txn.transactionType,
        txn.transactionQuantity,
        txn.referenceNumber || 'N/A',
        addedBy,
        issuedBy,
        issuedTo,
        txn.transactionDate.toLocaleString(),
        ...categoryFieldsArray.map(field => categoryFields[field] || 'N/A'),
      ];

      row.forEach((cell, i) => {
        doc.text(cell.toString(), tableStartX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
          width: columnWidths[i],
          align: 'center',
        });
      });

      y += rowHeight;

      // Start a new page if the table exceeds the page height
      if (y > doc.page.height - 50) {
        doc.addPage({ layout: 'landscape' });
        y = tableStartY;

        // Redraw the header on the new page
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
