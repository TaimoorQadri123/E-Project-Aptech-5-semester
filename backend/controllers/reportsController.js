import PDFDocument from "pdfkit";
import WorkoutModel from "../models/WorkoutModel.js";
import MealModel from "../models/MealModel.js";
import ProgressEntryModel from "../models/ProgressEntryModel.js";
import UserModel from "../models/UserModel.js";

function escapeCsv(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function buildCsv(rows) {
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function validateDates(from, to) {
  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return { ok: false, message: "from and to must be YYYY-MM-DD" };
  }
  if (from > to) return { ok: false, message: "from must be before to" };
  return { ok: true };
}

async function getWorkoutRows(userId, from, to) {
  const items = await WorkoutModel.find({ user: userId, date: { $gte: from, $lte: to } }).sort({ date: 1 });
  const rows = [["Date", "Title", "Category", "DurationMin", "Intensity", "Exercises"]];
  let totalMin = 0;
  for (const w of items) {
    totalMin += w.durationMin || 0;
    const exStr = (w.exercises || []).map((e) => `${e.name} ${e.sets}x${e.reps}@${e.weightKg}kg`).join("; ");
    rows.push([w.date, w.title, w.category, w.durationMin, w.intensity, exStr]);
  }
  return { rows, summary: `Total workouts: ${items.length}. Total minutes: ${totalMin}.` };
}

async function getNutritionRows(userId, from, to) {
  const items = await MealModel.find({ user: userId, date: { $gte: from, $lte: to } }).sort({ date: 1 });
  const rows = [["Date", "MealType", "Foods", "Calories", "ProteinG", "CarbsG", "FatG"]];
  let totalCal = 0;
  for (const m of items) {
    totalCal += m.totals?.calories || 0;
    rows.push([
      m.date,
      m.mealType,
      m.items.map((i) => i.name).join("; "),
      m.totals?.calories,
      m.totals?.proteinG,
      m.totals?.carbsG,
      m.totals?.fatG,
    ]);
  }
  return { rows, summary: `Total meals: ${items.length}. Total calories: ${totalCal}.` };
}

async function getProgressRows(userId, from, to) {
  const items = await ProgressEntryModel.find({ user: userId, date: { $gte: from, $lte: to } }).sort({ date: 1 });
  const rows = [["Date", "Metric", "Value", "Note"]];
  for (const p of items) {
    rows.push([p.date, p.metric, p.value, p.note || ""]);
  }
  return { rows, summary: `Total entries: ${items.length}.` };
}

function sendPdf(res, filename, title, userName, from, to, rows, summary) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(18).text(title);
  doc.fontSize(11).text(`User: ${userName}`);
  doc.text(`Date range: ${from} to ${to}`);
  doc.moveDown();

  const colCount = rows[0]?.length || 1;
  const colWidth = 500 / colCount;

  rows.forEach((row, rowIndex) => {
    if (doc.y > 700) doc.addPage();
    row.forEach((cell, i) => {
      doc.fontSize(rowIndex === 0 ? 10 : 9).text(String(cell ?? ""), 40 + i * colWidth, doc.y, {
        width: colWidth - 4,
        continued: i < row.length - 1,
      });
    });
    doc.moveDown(0.6);
  });

  doc.moveDown();
  doc.fontSize(10).text(`Summary: ${summary}`);
  doc.end();
}

export async function getReport(req, res) {
  try {
    const type = req.params.type;
    const format = req.query.format || "csv";
    const { from, to } = req.query;

    const dateCheck = validateDates(from, to);
    if (!dateCheck.ok) return res.status(400).json({ status: "error", message: dateCheck.message });

    if (!["workouts", "nutrition", "progress"].includes(type)) {
      return res.status(400).json({ status: "error", message: "Invalid report type" });
    }
    if (!["csv", "pdf"].includes(format)) {
      return res.status(400).json({ status: "error", message: "format must be csv or pdf" });
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });

    let report;
    let title;
    if (type === "workouts") {
      report = await getWorkoutRows(req.user.id, from, to);
      title = "Workouts Report";
    } else if (type === "nutrition") {
      report = await getNutritionRows(req.user.id, from, to);
      title = "Nutrition Report";
    } else {
      report = await getProgressRows(req.user.id, from, to);
      title = "Progress Report";
    }

    const filename = `${type}-${from}-to-${to}.${format}`;

    if (format === "csv") {
      const csv = buildCsv(report.rows);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(csv);
    }

    sendPdf(res, filename, title, user.username, from, to, report.rows, report.summary);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}
