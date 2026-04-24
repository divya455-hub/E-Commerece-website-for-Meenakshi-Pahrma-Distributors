const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoice = async (order, invoiceNumber) => {
    return new Promise((resolve, reject) => {
        try {
            const invoicesDir = path.join(__dirname, '..', 'uploads', 'invoices');
            if (!fs.existsSync(invoicesDir)) {
                fs.mkdirSync(invoicesDir, { recursive: true });
            }

            const filePath = path.join(invoicesDir, `${invoiceNumber}.pdf`);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // Header
            doc.fontSize(20).text('MEENAKSHI PHARMA DISTRIBUTORS', { align: 'center' });
            doc.fontSize(10).text('Online Pharmacy Management System', { align: 'center' });
            doc.moveDown();
            doc.text('-----------------------------------------------------------', { align: 'center' });
            doc.moveDown();

            // Invoice details
            doc.fontSize(14).text(`Invoice: ${invoiceNumber}`);
            doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`);
            doc.text(`Order Number: ${order.orderNumber}`);
            doc.text(`Status: ${order.status}`);
            doc.moveDown();

            // Shipping address
            if (order.shippingAddress) {
                doc.fontSize(12).text('Shipping Address:');
                doc.fontSize(10);
                doc.text(`${order.shippingAddress.addressLine1}`);
                if (order.shippingAddress.addressLine2) {
                    doc.text(`${order.shippingAddress.addressLine2}`);
                }
                doc.text(
                    `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`
                );
                doc.text(`${order.shippingAddress.country}`);
                doc.moveDown();
            }

            // Items table header
            doc.fontSize(12).text('Order Items:');
            doc.moveDown(0.5);
            doc.fontSize(9);

            const tableTop = doc.y;
            doc.text('Item', 50, tableTop);
            doc.text('Qty', 280, tableTop);
            doc.text('Unit Price', 330, tableTop);
            doc.text('Subtotal', 420, tableTop);
            doc.moveDown();

            doc.text('-----------------------------------------------------------', 50);
            doc.moveDown(0.5);

            // Items
            if (order.items && order.items.length > 0) {
                order.items.forEach((item) => {
                    const y = doc.y;
                    doc.text(item.productName || 'Product', 50, y, { width: 220 });
                    doc.text(String(item.quantity), 280, y);
                    doc.text(`₹${item.unitPrice.toFixed(2)}`, 330, y);
                    doc.text(`₹${item.subtotal.toFixed(2)}`, 420, y);
                    doc.moveDown();
                });
            }

            doc.moveDown();
            doc.text('-----------------------------------------------------------', 50);
            doc.moveDown();

            // Totals
            doc.fontSize(10);
            doc.text(`Subtotal: ₹${order.totalAmount.toFixed(2)}`, 330);
            doc.text(`Tax: ₹${order.taxAmount.toFixed(2)}`, 330);
            doc.text(`Shipping: ₹${order.shippingCharges.toFixed(2)}`, 330);
            if (order.discountAmount > 0) {
                doc.text(`Discount: -₹${order.discountAmount.toFixed(2)}`, 330);
            }
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Total: ₹${order.finalAmount.toFixed(2)}`, 330);
            doc.moveDown(2);

            // Footer
            doc.fontSize(8).text('Thank you for shopping with Meenakshi Pharma Distributors!', {
                align: 'center',
            });
            doc.text('Contact: mpdsalem@gmail.com', { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = generateInvoice;
