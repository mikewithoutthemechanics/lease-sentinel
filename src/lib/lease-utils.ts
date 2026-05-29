import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function generateLeasePDF(data: {
  tenantName: string;
  landlordName: string;
  propertyAddress: string;
  rentAmount: number;
  startDate: string;
  endDate: string;
  signatureDataUrl?: string;
  auditHash: string;
}) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage()
  const { width, height } = page.getSize()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  page.drawText('RESIDENTIAL LEASE AGREEMENT', {
    x: 50,
    y: height - 50,
    size: 20,
    font: boldFont,
  })

  const contentY = height - 100
  const lineSpacing = 25

  const textLines = [
    `Landlord: ${data.landlordName}`,
    `Tenant: ${data.tenantName}`,
    `Property: ${data.propertyAddress}`,
    `Rent Amount: R${data.rentAmount}`,
    `Start Date: ${data.startDate}`,
    `End Date: ${data.endDate}`,
  ]

  textLines.forEach((line, index) => {
    page.drawText(line, {
      x: 50,
      y: contentY - index * lineSpacing,
      size: 12,
      font: font,
    })
  })

  if (data.signatureDataUrl) {
    const signatureImage = await pdfDoc.embedPng(data.signatureDataUrl)
    const sigDims = signatureImage.scale(0.5)
    page.drawText('Signature:', { x: 50, y: 150, size: 12, font: boldFont })
    page.drawImage(signatureImage, {
      x: 50,
      y: 70,
      width: sigDims.width,
      height: sigDims.height,
    })
  }

  page.drawText(`Audit Hash: ${data.auditHash}`, {
    x: 50,
    y: 30,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  })

  return await pdfDoc.save()
}
