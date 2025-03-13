import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/authenticateToken';
import { ConsumableTransactionModel } from '../models/consumableTransaction';
import PDFDocument from 'pdfkit';

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

    const filter: any = { 
      transactionDate: { $gte: start, $lte: end },
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]  // Include false and undefined
    };
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

    const filter: any = { 
      transactionDate: { $gte: start, $lte: end },
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]  // Include false and undefined
    };
    if (type === 'ADD' || type === 'ISSUE') {
      filter.transactionType = type;
    }

    const transactions = await ConsumableTransactionModel.find(filter)
      .populate('addedBy', 'name')
      .populate('issuedBy', 'name')
      .populate('issuedTo', 'name');

    // Create a PDF document with better margins
    const doc = new PDFDocument({ 
      layout: 'landscape', 
      margin: 30,
      size: 'A4',
      bufferPages: true,  // Enable page buffering for page numbers
      info: {
        Title: 'Consumable Transactions Report',
        Author: 'Lambda',
        Subject: `Consumable Report: ${new Date(start).toLocaleDateString('en-GB')} to ${new Date(end).toLocaleDateString('en-GB')}`,
      }
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=consumable-report.pdf');

    doc.pipe(res);
    
    // Define reusable colors
    const colors = {
      primary: '#1a56db',      // Deep blue for headers
      secondary: '#e5edff',    // Light blue for alternating rows
      border: '#d1d5db',       // Light gray for borders
      headerText: '#ffffff',   // White for header text
      text: '#111827',         // Near black for regular text
      subText: '#4b5563'       // Gray for secondary text
    };
    
    // Get page dimensions
    const pageWidth = doc.page.width - 2 * doc.page.margins.left;
    const pageHeight = doc.page.height;
    
    // Define column properties with better spacing
    const columns = [
      { header: 'S.No', width: pageWidth * 0.03, align: 'center' },
      { header: 'Consumable Name', width: pageWidth * 0.14, align: 'left' },
      { header: 'Category', width: pageWidth * 0.18, align: 'left' },
      { header: 'Type', width: pageWidth * 0.05, align: 'center' },
      { header: 'Qty', width: pageWidth * 0.04, align: 'center' },
      { header: 'Ref No.', width: pageWidth * 0.12, align: 'left' },
      { header: 'Entry Ref No.', width: pageWidth * 0.12, align: 'left' },
      { header: 'Added By', width: pageWidth * 0.08, align: 'left' },
      { header: 'Issued By', width: pageWidth * 0.08, align: 'left' },
      { header: 'Issued To', width: pageWidth * 0.08, align: 'left' },
      { header: 'Date', width: pageWidth * 0.08, align: 'center' },
    ];
    
    // Calculate row heights
    const rowHeight = 22;          // Increased for better readability
    const headerRowHeight = 28;    // Taller header row
    
    // Create a function to add a header/footer to each page
    const addPageHeaderAndFooter = (pageNum: number, totalPages: number) => {
      // Reset position to the top
      doc.y = doc.page.margins.top;
      
      // Add logo/company name area
      doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.primary)
         .text('LAMBDA', doc.page.margins.left, doc.y)
         .moveDown(0.2);
      
      // Add a thin line below the logo
      doc.moveTo(doc.page.margins.left, doc.y)
         .lineWidth(1)
         .lineTo(doc.page.margins.left + pageWidth, doc.y)
         .strokeColor(colors.primary)
         .stroke();
      
      doc.moveDown(1);
      
      // Title
      doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.text)
         .text('Consumable Transactions Report', { align: 'center' });
      
      // Date range
      doc.fontSize(10).font('Helvetica').fillColor(colors.subText)
         .text(
            `Date Range: ${new Date(start).toLocaleDateString('en-GB')} to ${new Date(end).toLocaleDateString('en-GB')}`, 
            { align: 'center' }
         );
      
      if (type && type !== 'BOTH') {
        doc.text(`Transaction Type: ${type}`, { align: 'center' });
      }
      
      doc.moveDown(1);
      
      // Add footer
      const footerTop = pageHeight - 25;
      
      // Horizontal line above footer
      doc.moveTo(doc.page.margins.left, footerTop - 5)
         .lineWidth(0.5)
         .lineTo(doc.page.margins.left + pageWidth, footerTop - 5)
         .strokeColor(colors.border)
         .stroke();
      
      // Left side: timestamp (only on first page)
      if (pageNum === 0) {
        doc.fontSize(8).fillColor(colors.subText)
           .text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 
                 doc.page.margins.left, footerTop);
      }
      
      // Center: page number
      doc.fontSize(8).fillColor(colors.subText)
         .text(`Page ${pageNum + 1} of ${totalPages}`, 
               0, footerTop, 
               { align: 'center' });
      
      // Right side: company info
      doc.fontSize(8).fillColor(colors.subText)
         .text('LAMBDA Inventory Management', 
               0, footerTop, 
               { align: 'right' });
    };
    
    // Function to add table header on each page
    const drawTableHeader = (startY: number) => {
      // Draw header background
      doc.fillColor(colors.primary)
         .rect(doc.page.margins.left, startY, pageWidth, headerRowHeight)
         .fill();
      
      // Draw header text
      doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.headerText);
      let xOffset = doc.page.margins.left;
      
      columns.forEach(column => {
        doc.text(
          column.header, 
          xOffset + 5, 
          startY + 10,  // Vertically center the text better
          { width: column.width - 10, align: column.align as 'center' | 'left' | 'justify' | 'right' | undefined }
        );
        xOffset += column.width;
      });
      
      return startY + headerRowHeight;
    };
    
    // Table start position
    const tableStartY = 130;  // Increased to accommodate header
    let y = tableStartY;
    
    // Draw the first table header
    y = drawTableHeader(y);
    
    // Draw table rows
    doc.font('Helvetica').fontSize(8).fillColor(colors.text);
    
    transactions.forEach((txn, index) => {
      // Check if we need a new page
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 30) {  // 30px for footer
        doc.addPage({ layout: 'landscape', size: 'A4', margin: 30 });
        y = doc.page.margins.top + 100;  // For header
        y = drawTableHeader(y);
      }
      
      // Draw alternating row backgrounds
      if (index % 2 === 1) {
        doc.fillColor(colors.secondary)
           .rect(doc.page.margins.left, y, pageWidth, rowHeight)
           .fill();
      }
      
      const addedBy = (txn.addedBy as { name: string })?.name || 'N/A';
      const issuedBy = (txn.issuedBy as { name: string })?.name || 'N/A';
      const issuedTo = (txn.issuedTo as { name: string })?.name || 'N/A';
      
      const categoryDetails = txn.categoryFields
        ? Object.entries(txn.categoryFields)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
        : 'N/A';
      
      // Prepare row data
      const row = [
        (index + 1).toString(),
        txn.consumableName,
        categoryDetails,
        txn.transactionType,
        txn.transactionQuantity.toString(),
        txn.referenceNumber || 'N/A',
        txn.entryReferenceNumber || 'N/A',
        addedBy,
        issuedBy,
        issuedTo,
        new Date(txn.transactionDate).toLocaleDateString('en-GB')
      ];
      
      // Draw cell content
      doc.fillColor(colors.text);
      let xOffset = doc.page.margins.left;
      
      columns.forEach((column, i) => {
        // Use different formatting for transaction type
        if (i === 3) { // Transaction Type column
          const isAddType = row[i] === 'ADD';
          
          // Create colored pill background for transaction type
          const pillColor = isAddType ? '#dcfce7' : '#fee2e2'; // Green for ADD, Red for ISSUE
          const textColor = isAddType ? '#166534' : '#991b1b'; // Darker green/red for text
          
          // Calculate position and width
          const textWidth = doc.widthOfString(row[i]);
          const pillWidth = textWidth + 10;
          const pillX = xOffset + (column.width - pillWidth) / 2;
          const pillY = y + 5;
          
          // Draw pill
          doc.roundedRect(pillX, pillY, pillWidth, rowHeight - 10, 8)
             .fillColor(pillColor)
             .fill();
          
          // Draw text
          doc.fillColor(textColor)
             .text(row[i], 
                   xOffset, 
                   y + 6, 
                   { width: column.width, align: 'center' });
        } else {
          // Regular cell
          doc.text(
            row[i], 
            xOffset + 5, 
            y + 7,  // Better vertical centering
            { width: column.width - 10, align: column.align as 'center' | 'justify' | 'left' | 'right' | undefined }
          );
        }
        
        xOffset += column.width;
      });
      
      y += rowHeight;
    });
    
    // Draw table border
    doc.lineWidth(0.5).strokeColor(colors.border);
    
    // Draw horizontal grid lines for the table
    let gridY = tableStartY + headerRowHeight;
    while (gridY <= y) {
      doc.moveTo(doc.page.margins.left, gridY)
         .lineTo(doc.page.margins.left + pageWidth, gridY)
         .stroke();
      gridY += rowHeight;
    }
    
    // Draw vertical grid lines
    let xOffset = doc.page.margins.left;
    for (let i = 0; i <= columns.length; i++) {
      doc.moveTo(xOffset, tableStartY)
         .lineTo(xOffset, y)
         .stroke();
      
      if (i < columns.length) {
        xOffset += columns[i].width;
      }
    }
    
    // Add page numbers and headers/footers after all pages have been generated
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      addPageHeaderAndFooter(i, pageCount);
    }
    
    doc.end();
  })
);

export default router;
