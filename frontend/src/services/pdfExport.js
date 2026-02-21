import { jsPDF } from 'jspdf'

// ─── Color helpers ────────────────────────────────────────────
const HEX = {
    bg: [8, 8, 15],
    surface: [20, 20, 38],
    card: [24, 24, 42],
    border: [45, 44, 72],
    accent: [124, 58, 237],
    accentLt: [167, 139, 250],
    teal: [20, 184, 166],
    green: [34, 197, 94],
    amber: [245, 158, 11],
    red: [239, 68, 68],
    white: [241, 240, 255],
    muted: [139, 138, 171],
    dim: [78, 77, 106],
}

function scoreColor(s) {
    return s >= 75 ? HEX.green : s >= 50 ? HEX.accentLt : s >= 30 ? HEX.amber : HEX.red
}

const SEV_COLOR = { high: HEX.red, medium: HEX.amber, low: HEX.green }
const CAT_COLOR = {
    clarity: HEX.accentLt,
    layout: HEX.teal,
    navigation: HEX.amber,
    accessibility: [236, 72, 153],
    trust: HEX.green,
}

// ─── PDF class ────────────────────────────────────────────────
class PDFBuilder {
    constructor() {
        this.doc = new jsPDF({ unit: 'pt', format: 'a4' })
        this.W = this.doc.internal.pageSize.getWidth()
        this.H = this.doc.internal.pageSize.getHeight()
        this.margin = 36
        this.y = 0
        this.page = 1
    }

    // Fill entire background of current page
    fillBg() {
        this.doc.setFillColor(...HEX.bg)
        this.doc.rect(0, 0, this.W, this.H, 'F')
    }

    newPage() {
        this.doc.addPage()
        this.page++
        this.fillBg()
        this.y = this.margin
    }

    checkY(needed = 40) {
        if (this.y + needed > this.H - this.margin) this.newPage()
    }

    // ── Text helpers ─────────────────────────────────────────
    text(txt, x, y, { size = 10, color = HEX.white, bold = false, align = 'left' } = {}) {
        this.doc.setFontSize(size)
        this.doc.setFont('helvetica', bold ? 'bold' : 'normal')
        this.doc.setTextColor(...color)
        this.doc.text(String(txt), x, y, { align })
    }

    wrap(txt, x, y, maxW, { size = 9, color = HEX.muted, lineH = 14 } = {}) {
        this.doc.setFontSize(size)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(...color)
        const lines = this.doc.splitTextToSize(String(txt), maxW)
        lines.forEach((ln, i) => this.doc.text(ln, x, y + i * lineH))
        return lines.length * lineH
    }

    // ── Shapes ───────────────────────────────────────────────
    hline(y, { color = HEX.border } = {}) {
        this.doc.setDrawColor(...color)
        this.doc.setLineWidth(0.5)
        this.doc.line(this.margin, y, this.W - this.margin, y)
    }

    pill(label, x, y, color = HEX.accentLt) {
        const w = this.doc.getTextWidth(label) + 14
        this.doc.setFillColor(color[0], color[1], color[2], 0.14)
        this.doc.roundedRect(x, y - 9, w, 13, 3, 3, 'F')
        this.doc.setDrawColor(color[0], color[1], color[2], 0.3)
        this.doc.setLineWidth(0.4)
        this.doc.roundedRect(x, y - 9, w, 13, 3, 3, 'S')
        this.text(label.toUpperCase(), x + 7, y, { size: 6.5, color, bold: true })
        return w + 6
    }

    scoreCircle(score, cx, cy, r = 28) {
        const col = scoreColor(score)
        // Track (dim)
        this.doc.setDrawColor(...HEX.border)
        this.doc.setLineWidth(4)
        this.doc.circle(cx, cy, r, 'S')
        // Arc via lines approximation (jsPDF doesn't do arc natively)
        const frac = score / 100
        const steps = Math.round(frac * 60)
        this.doc.setDrawColor(...col)
        this.doc.setLineWidth(4)
        for (let i = 0; i < steps; i++) {
            const a1 = (-Math.PI / 2) + (i / 60) * 2 * Math.PI
            const a2 = (-Math.PI / 2) + ((i + 1) / 60) * 2 * Math.PI
            this.doc.line(cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2))
        }
        // Score text
        this.text(String(score), cx, cy + 4, { size: 16, color: col, bold: true, align: 'center' })
        this.text('/100', cx, cy + 14, { size: 7, color: HEX.dim, align: 'center' })
    }

    // ── Report header ─────────────────────────────────────────
    drawHeader(label = 'UX LENS') {
        this.fillBg()
        // Top accent bar
        this.doc.setFillColor(...HEX.accent)
        this.doc.rect(0, 0, this.W, 4, 'F')

        // Logo + brand
        this.doc.setFillColor(...HEX.accent)
        this.doc.roundedRect(this.margin, 18, 22, 22, 4, 4, 'F')
        this.text('🔍', this.margin + 5, 33, { size: 11 })
        this.text('UXLens', this.margin + 28, 33, { size: 14, bold: true })
        this.text('AI-Powered UX Audit', this.margin + 28, 44, { size: 7.5, color: HEX.dim })

        // Date
        this.text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            this.W - this.margin, 33, { size: 8, color: HEX.dim, align: 'right' })

        this.hline(56, { color: HEX.border })
        this.y = 70

        // Section label
        this.text(label, this.margin, this.y, { size: 7, color: HEX.dim, bold: true })
        this.y += 4
    }

    // ── Single review content ─────────────────────────────────
    drawReview(review, accentColor = HEX.accentLt) {
        const m = this.margin
        const iW = this.W - m * 2

        /* Title */
        this.checkY(60)
        this.y += 10
        const titleLines = this.doc.splitTextToSize(review.title || review.url, iW - 80)
        this.text(titleLines.join(' '), m, this.y, { size: 16, bold: true })
        this.y += 22

        // URL
        this.text(review.url, m, this.y, { size: 8, color: accentColor })
        this.y += 18

        /* Score circle + summary */
        const cx = m + 38, cy = this.y + 36
        this.scoreCircle(review.score, cx, cy)

        const sumX = cx + 58
        const sumW = iW - 60
        this.text('UX SUMMARY', sumX, this.y + 4, { size: 6.5, color: HEX.dim, bold: true })
        this.y += 10 + this.wrap(review.summary || '', sumX, this.y + 8, sumW, { size: 9, color: HEX.muted, lineH: 14 })
        this.y = Math.max(this.y, cy + 46)

        this.hline(this.y)
        this.y += 14

        /* Issues */
        this.text(`UX ISSUES (${review.issues.length})`, m, this.y, { size: 7, color: HEX.dim, bold: true })
        this.y += 14

        review.issues.forEach((issue, i) => {
            this.checkY(70)

            // Issue card bg
            const lineCount = this.doc.splitTextToSize(issue.why || '', iW - 20).length
            const proofCount = issue.proof ? this.doc.splitTextToSize(issue.proof, iW - 24).length : 0
            const cardH = 16 + 16 + lineCount * 13 + (proofCount ? proofCount * 12 + 24 : 0) + 12
            this.doc.setFillColor(...HEX.card)
            this.doc.roundedRect(m, this.y, iW, cardH, 4, 4, 'F')
            this.doc.setDrawColor(...HEX.border)
            this.doc.setLineWidth(0.4)
            this.doc.roundedRect(m, this.y, iW, cardH, 4, 4, 'S')

            // Left accent line by severity
            const sevCol = SEV_COLOR[issue.severity] || HEX.dim
            this.doc.setFillColor(...sevCol)
            this.doc.roundedRect(m, this.y, 3, cardH, 2, 2, 'F')

            const cx2 = m + 12
            let iy = this.y + 14

            // Badges
            let bx = cx2
            const catCol = CAT_COLOR[issue.category] || HEX.accentLt
            bx += this.pill(issue.category, bx, iy, catCol)
            this.pill(issue.severity, bx, iy, sevCol)

            iy += 14
            // Title
            this.text(`${i + 1}. ${issue.title}`, cx2, iy, { size: 9.5, bold: true })
            iy += 14

            // Why
            const wh = this.wrap(issue.why || '', cx2, iy, iW - 24, { size: 8.5, color: HEX.muted, lineH: 13 })
            iy += wh + 6

            // Proof
            if (issue.proof) {
                this.doc.setFillColor(0, 0, 0, 0.3)
                const ph = proofCount * 12 + 10
                this.doc.roundedRect(cx2, iy, iW - 24, ph, 3, 3, 'F')
                this.doc.setFillColor(...HEX.accent)
                this.doc.roundedRect(cx2, iy, 2, ph, 1, 1, 'F')
                this.text('PROOF', cx2 + 8, iy + 8, { size: 6, color: HEX.dim, bold: true })
                this.wrap(issue.proof, cx2 + 8, iy + 16, iW - 36, { size: 7.5, color: HEX.accentLt, lineH: 12 })
                iy += ph + 6
            }

            this.y += cardH + 8
        })

        /* Before/After */
        if (review.beforeAfter?.length) {
            this.checkY(20)
            this.hline(this.y)
            this.y += 14
            this.text('TOP IMPROVEMENTS — BEFORE & AFTER', m, this.y, { size: 7, color: HEX.dim, bold: true })
            this.y += 14

            review.beforeAfter.forEach((ba, i) => {
                this.checkY(100)
                const halfW = (iW - 10) / 2

                this.text(`${i + 1}. ${ba.issueTitle}`, m, this.y, { size: 9.5, bold: true })
                this.y += 12

                const cat = ba.category
                this.pill(cat, m, this.y, CAT_COLOR[cat] || HEX.accentLt)
                this.y += 16

                // Before box
                const bfLines = this.doc.splitTextToSize(ba.before || '', halfW - 16)
                const afLines = this.doc.splitTextToSize(ba.after || '', halfW - 16)
                const bh = Math.max(bfLines.length, afLines.length) * 12 + 28

                this.doc.setFillColor(...HEX.card)
                this.doc.roundedRect(m, this.y, halfW, bh, 3, 3, 'F')
                this.doc.setDrawColor(...HEX.border)
                this.doc.setLineWidth(0.3)
                this.doc.roundedRect(m, this.y, halfW, bh, 3, 3, 'S')
                this.text('⚠ BEFORE', m + 10, this.y + 12, { size: 6.5, color: HEX.red, bold: true })
                this.wrap(ba.before || '', m + 10, this.y + 22, halfW - 16, { size: 8, color: HEX.muted, lineH: 12 })

                // After box
                const ax = m + halfW + 10
                this.doc.setFillColor(...HEX.card)
                this.doc.roundedRect(ax, this.y, halfW, bh, 3, 3, 'F')
                this.doc.roundedRect(ax, this.y, halfW, bh, 3, 3, 'S')
                this.text('✓ AFTER', ax + 10, this.y + 12, { size: 6.5, color: HEX.green, bold: true })
                this.wrap(ba.after || '', ax + 10, this.y + 22, halfW - 16, { size: 8, color: HEX.muted, lineH: 12 })

                this.y += bh + 8

                if (ba.explanation) {
                    this.y += this.wrap(`💡 ${ba.explanation}`, m, this.y, iW, { size: 8, color: HEX.dim, lineH: 13 }) + 6
                }
                this.y += 6
            })
        }
    }
}

// ─── Public API ───────────────────────────────────────────────

/** Download a single review as PDF */
export function downloadReviewPDF(review) {
    try {
        const b = new PDFBuilder()
        b.drawHeader('UX AUDIT REPORT')
        b.drawReview(review)

        // Footer on each page
        const totalPages = b.doc.internal.pages.length - 1
        for (let p = 1; p <= totalPages; p++) {
            b.doc.setPage(p)
            b.text(`UXLens  ·  Page ${p} of ${totalPages}`, b.W / 2, b.H - 18, { size: 7, color: HEX.dim, align: 'center' })
        }

        const slug = new URL(review.url).hostname.replace(/[^a-z0-9]/gi, '-')
        b.doc.save(`ux-report-${slug}.pdf`)
    } catch (err) {
        console.error('[UXLens] PDF generation failed:', err)
    }
}

/** Download a comparison report as PDF */
export function downloadComparisonPDF(reviewA, reviewB, urlA, urlB) {
    try {
        const b = new PDFBuilder()
        b.drawHeader('UX COMPARISON REPORT')

        // Comparison score banner
        b.y += 20
        b.text('SITE A', b.margin, b.y, { size: 7, color: HEX.accentLt, bold: true })
        b.y += 6
        b.scoreCircle(reviewA.score, b.margin + 38, b.y + 36)
        b.text(urlA, b.margin + 80, b.y + 36, { size: 7.5, color: HEX.accentLt })
        b.y += 82

        b.hline(b.y, { color: HEX.accent })
        b.y += 14
        b.text('SITE A — FULL REPORT', b.margin, b.y, { size: 7, color: HEX.dim, bold: true })
        b.y += 12
        b.drawReview(reviewA, HEX.accentLt)

        b.newPage()
        b.drawHeader('UX COMPARISON REPORT')
        b.y += 20
        b.text('SITE B', b.margin, b.y, { size: 7, color: HEX.teal, bold: true })
        b.y += 6
        b.scoreCircle(reviewB.score, b.margin + 38, b.y + 36)
        b.text(urlB, b.margin + 80, b.y + 36, { size: 7.5, color: HEX.teal })
        b.y += 82

        b.hline(b.y, { color: HEX.teal })
        b.y += 14
        b.text('SITE B — FULL REPORT', b.margin, b.y, { size: 7, color: HEX.dim, bold: true })
        b.y += 12
        b.drawReview(reviewB, HEX.teal)

        const totalPages = b.doc.internal.pages.length - 1
        for (let p = 1; p <= totalPages; p++) {
            b.doc.setPage(p)
            b.text(`UXLens Comparison  ·  Page ${p} of ${totalPages}`, b.W / 2, b.H - 18, { size: 7, color: HEX.dim, align: 'center' })
        }

        const sA = new URL(urlA).hostname.replace(/[^a-z0-9]/gi, '-')
        const sB = new URL(urlB).hostname.replace(/[^a-z0-9]/gi, '-')
        b.doc.save(`ux-compare-${sA}-vs-${sB}.pdf`)
    } catch (err) {
        console.error('[UXLens] PDF comparison generation failed:', err)
    }
}
