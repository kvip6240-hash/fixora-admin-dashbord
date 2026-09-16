import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import type { AdminRfqDetails } from "@/lib/api";
import { downloadBlob } from "@/lib/download";

export type RfqDownloadFormat = "invoice-pdf" | "rfq-pdf" | "excel" | "csv";

const missing = "Not provided";

function text(value?: string | number | null) {
  return value === undefined || value === null || value === "" ? missing : String(value);
}

function dateText(value?: string | null) {
  if (!value) return missing;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? missing
    : date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function money(value?: number | null, currency?: string | null) {
  if (value === undefined || value === null) return missing;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
    }).format(value);
  } catch {
    return `${currency || ""} ${value}`.trim();
  }
}

function identifier(rfq: AdminRfqDetails) {
  return (rfq.rfqNumber || rfq.projectRequestId?.requestNumber || "RFQ").replace(
    /[^a-zA-Z0-9_-]/g,
    "-",
  );
}

function record(rfq: AdminRfqDetails) {
  const project = rfq.projectRequestId;
  const requester = rfq.requesterId;
  const provider = project?.assignedProvider;
  return {
    "RFQ Number": text(rfq.rfqNumber),
    "Request Number": text(project?.requestNumber),
    Status: text(rfq.status),
    Requester: text(requester?.companyName),
    "Company Name": text(requester?.companyName),
    Email: text(requester?.email),
    Phone: text(requester?.phone),
    Category: text(project?.categoryId?.name),
    "Project Title": text(project?.title),
    Description: text(project?.description),
    "Assigned Provider": text(provider?.companyName || provider?.name),
    Amount: rfq.amount ?? missing,
    Currency: text(rfq.currency),
    "Hourly Rate": rfq.hourlyRate ?? missing,
    "Labour Cost": rfq.labourCost ?? missing,
    "Material Cost": rfq.materialCost ?? missing,
    "Service Charge": rfq.serviceCharge ?? missing,
    Tax: rfq.tax ?? missing,
    Discount: rfq.discount ?? missing,
    "Estimated Duration": text(rfq.estimatedDuration),
    "Created Date": dateText(rfq.createdAt),
    "Sent Date": dateText(rfq.sentAt),
    Remarks: text(rfq.remarks),
  };
}

function csvValue(value: unknown) {
  const plain = String(value ?? "");
  const safe = /^[=+\-@]/.test(plain) ? `'${plain}` : plain;
  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadPdf(rfq: AdminRfqDetails, invoice: boolean) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const project = rfq.projectRequestId;
  const requester = rfq.requesterId;
  const provider = project?.assignedProvider;
  const file = `Versal-Axis-${invoice ? "Invoice" : "RFQ"}-${identifier(rfq)}.pdf`;
  let y = 43;
  const space = (height: number) => {
    if (y + height > 275) {
      doc.addPage();
      y = 20;
    }
  };
  const section = (heading: string) => {
    space(12);
    y += 4;
    doc.setFillColor(240, 253, 250);
    doc.rect(15, y - 5, 180, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 118, 110);
    doc.text(heading, 18, y);
    y += 9;
  };
  const line = (label: string, content: string) => {
    space(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85);
    doc.text(`${label}:`, 18, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(content, 120);
    doc.text(lines, 58, y);
    y += Math.max(7, lines.length * 5) + 1;
  };

  doc.setFillColor(13, 34, 64);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("VERSAL AXIS", 16, 18);
  doc.setFontSize(11);
  doc.text(invoice ? "INVOICE" : "REQUEST FOR QUOTATION", 16, 25);
  doc.setFontSize(10);
  doc.text(`RFQ: ${text(rfq.rfqNumber)}`, 145, 18);
  doc.text(`Request: ${text(project?.requestNumber)}`, 145, 25);

  section("RFQ Summary");
  line("RFQ Status", text(rfq.status));
  line("Created Date", dateText(rfq.createdAt));
  line("Sent Date", dateText(rfq.sentAt));
  section("Requester Information");
  line("Company Name", text(requester?.companyName));
  line("Email", text(requester?.email));
  line("Phone", text(requester?.phone));
  section("Service and Project Information");
  line("Service Category", text(project?.categoryId?.name));
  line("Project Title", text(project?.title));
  line("Description", text(project?.description));
  line("Assigned Provider", text(provider?.companyName || provider?.name));
  section("Quotation Information");
  line("Amount", money(rfq.amount, rfq.currency));
  line("Currency", text(rfq.currency));
  line("Hourly Rate", money(rfq.hourlyRate, rfq.currency));
  line("Labour Cost", money(rfq.labourCost, rfq.currency));
  line("Material Cost", money(rfq.materialCost, rfq.currency));
  line("Service Charge", money(rfq.serviceCharge, rfq.currency));
  line("Tax", money(rfq.tax, rfq.currency));
  line("Discount", money(rfq.discount, rfq.currency));
  line("Final Total", money(rfq.amount, rfq.currency));
  line("Estimated Duration", text(rfq.estimatedDuration));
  line("Remarks", text(rfq.remarks));
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Generated by Versal Axis Admin Dashboard", 15, 288);
  downloadBlob(doc.output("blob"), file);
}

export function downloadRfqData(rfq: AdminRfqDetails, format: RfqDownloadFormat) {
  if (format === "invoice-pdf") return downloadPdf(rfq, true);
  if (format === "rfq-pdf") return downloadPdf(rfq, false);
  const data = record(rfq);
  const id = identifier(rfq);
  if (format === "excel") {
    const worksheet = XLSX.utils.json_to_sheet([data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RFQ Data");
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    downloadBlob(
      new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `Versal-Axis-RFQ-${id}.xlsx`,
    );
    return;
  }
  const headers = Object.keys(data);
  const csv = `\uFEFF${headers.map(csvValue).join(",")}\r\n${headers.map((key) => csvValue(data[key as keyof typeof data])).join(",")}\r\n`;
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `Versal-Axis-RFQ-${id}.csv`);
}
