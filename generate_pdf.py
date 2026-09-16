import sys
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages after page 1)
        if self._pageNumber > 1:
            self.drawString(36, 11 * inch - 26, "AI-FORECAST — Team Study & Onboarding Guide")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(36, 11 * inch - 30, 8.5 * inch - 36, 11 * inch - 30)
        
        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(36, 32, 8.5 * inch - 36, 32)
        
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 36, 20, footer_text)
        self.drawString(36, 20, "Confidential • Academic & Project Defense Reference")
        self.restoreState()

def generate_pdf(output_filename="AI_FORECAST_STUDY_GUIDE.pdf"):
    pdf_path = os.path.abspath(output_filename)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=38,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#1e3a8a"),
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1e3a8a"),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1e293b"),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'CodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#0f172a"),
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1e3a8a"),
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#0f172a")
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#334155")
    )

    story = []

    # Title Banner Table
    banner_data = [
        [
            Paragraph("<b>AI-FORECAST</b>", title_style),
        ],
        [
            Paragraph("<b>Complete Team Study &amp; Viva Defense Guide</b> • Full-Stack Time-Series Analytics", subtitle_style),
        ],
        [
            Paragraph("<b>Tech Stack:</b> React 18 + Vite • Tailwind CSS • Recharts • FastAPI (Python 3.10+) • Scikit-learn • Joblib", ParagraphStyle('Tech', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#2563eb"))),
        ]
    ]
    banner_table = Table(banner_data, colWidths=[7.5 * inch])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 10),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 10))

    # SECTION 1: Project in 60 Seconds
    story.append(Paragraph("1. Project in 60 Seconds", h1_style))
    story.append(Paragraph("<b>AI-FORECAST</b> is an end-to-end full-stack web application designed for historical time-series forecasting. It eliminates the fatal flaw of <i>temporal data leakage</i> seen in toy projects by enforcing strict chronological validation splitting (<code>shuffle=False</code>) across all feature engineering, model training, and recursive inference operations.", body_style))
    
    # 4 Pillars Callout Box
    pillars = [
        [
            Paragraph("<b>1. Data Ingestion &amp; Imputation:</b> Handles raw CSV time-series, detects timestamp &amp; numeric target columns, and applies automated imputation (ffill / mean).", callout_style),
            Paragraph("<b>2. Temporal Feature Engineering:</b> Constructs autoregressive lags (<code>lag_1</code>, <code>lag_7</code>), rolling trend averages (7-day), and calendar attributes.", callout_style),
        ],
        [
            Paragraph("<b>3. Baseline &amp; Ensemble Regressors:</b> Trains Linear Regression baseline (interpretable OLS) alongside Random Forest (100 decision trees for non-linear seasonality).", callout_style),
            Paragraph("<b>4. Out-of-Sample Leaderboard &amp; Future Forecast:</b> Benchmarks models on a 20% holdout set with MAE/RMSE/R², then recursively projects 7–30 days with 95% confidence bands.", callout_style),
        ]
    ]
    pillars_table = Table(pillars, colWidths=[3.7 * inch, 3.8 * inch])
    pillars_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#93c5fd")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#bfdbfe")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(pillars_table)
    story.append(Spacer(1, 10))

    # SECTION 2: System Architecture
    story.append(Paragraph("2. High-Level System Architecture", h1_style))
    story.append(Paragraph("The system is organized into a clean decoupled client-server architecture:", body_style))
    
    arch_data = [
        [
            Paragraph("<b>Frontend (React 18 + Vite)</b><br/>• Port: <code>http://localhost:5173</code><br/>• Tailwind CSS Light Neutral Design System<br/>• Recharts interactive data visualization<br/>• Modular page-by-page state management", table_cell_style),
            Paragraph("<b>API Layer (FastAPI REST)</b><br/>• Port: <code>http://127.0.0.1:8000</code><br/>• OpenAPI interactive docs at <code>/docs</code><br/>• Pydantic input/output schemas<br/>• Modular router endpoints", table_cell_style),
            Paragraph("<b>ML Engine (Scikit-learn)</b><br/>• Chronological train/test partitions<br/>• Recursive multi-step forecaster<br/>• Error propagation confidence bands<br/>• Joblib serialization registry", table_cell_style)
        ]
    ]
    arch_table = Table(arch_data, colWidths=[2.5 * inch, 2.5 * inch, 2.5 * inch])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 10))

    # SECTION 3: Folder Structure & Code Map
    story.append(Paragraph("3. Folder Structure &amp; Key Code Locations", h1_style))
    folder_data = [
        [Paragraph("<b>Directory / File</b>", table_header_style), Paragraph("<b>Key Responsibilities &amp; Contents</b>", table_header_style)],
        [Paragraph("<code>backend/app/main.py</code>", table_cell_style), Paragraph("FastAPI app instance, CORS middleware, routing registration.", table_cell_style)],
        [Paragraph("<code>backend/app/api/</code>", table_cell_style), Paragraph("Endpoints for datasets, preprocessing, analytics, models, evaluation, forecasts.", table_cell_style)],
        [Paragraph("<code>backend/app/ml/training_service.py</code>", table_cell_style), Paragraph("Chronological 80/20 train/validation split logic and Scikit-learn estimator training.", table_cell_style)],
        [Paragraph("<code>backend/app/ml/forecaster.py</code>", table_cell_style), Paragraph("Multi-step recursive autoregressive forecast generator with expanding uncertainty.", table_cell_style)],
        [Paragraph("<code>backend/app/ml/evaluation.py</code>", table_cell_style), Paragraph("Mathematical loss functions: MAE, MSE, RMSE, and R² calculation.", table_cell_style)],
        [Paragraph("<code>frontend/src/App.jsx</code>", table_cell_style), Paragraph("Main application layout, global dataset/model state, navigation, error boundary.", table_cell_style)],
        [Paragraph("<code>frontend/src/pages/</code>", table_cell_style), Paragraph("The 7 core pages: Dashboard, Datasets, Preprocessing, Analytics, Models, Evaluation, Forecasts, Viva.", table_cell_style)],
        [Paragraph("<code>frontend/src/charts/</code>", table_cell_style), Paragraph("Light-themed Recharts: TimeSeriesChart, ActualVsPredictedChart, ForecastChart.", table_cell_style)],
    ]
    folder_table = Table(folder_data, colWidths=[2.6 * inch, 4.9 * inch])
    folder_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(folder_table)
    story.append(Spacer(1, 10))

    # SECTION 4: End-to-End Pipeline
    story.append(Paragraph("4. End-to-End Data Pipeline (Step-by-Step)", h1_style))
    pipeline_steps = [
        "<b>Step 1 — Raw Ingestion:</b> CSV uploaded or sample loaded (120 daily records). Timestamp & numeric targets identified.",
        "<b>Step 2 — Feature Engineering:</b> Calendar features (<code>dayofweek</code>, <code>month</code>), autoregressive lags (<code>lag_1</code>, <code>lag_7</code>), and 7-day rolling average.",
        "<b>Step 3 — Chronological Partition:</b> Earliest 80% (Days 1–96) assigned to Training; subsequent 20% (Days 97–120) assigned to Test.",
        "<b>Step 4 — Dual Training:</b> Fits Linear Regression (intercept calculation) & Random Forest (100 trees, max_depth=10, random_state=42).",
        "<b>Step 5 — Holdout Validation:</b> Evaluates both models on unseen 20% test partition. Lowest RMSE model flagged as 'Recommended'.",
        "<b>Step 6 — Recursive Future Forecasting:</b> Projects future dates by iteratively substituting predicted values back into lag inputs. Uncertainty bounds expand dynamically: σ(h) = RMSE × √(1 + 0.10(h-1))."
    ]
    for ps in pipeline_steps:
        story.append(Paragraph(f"• {ps}", bullet_style))
    story.append(Spacer(1, 10))

    # SECTION 5: Pages Walkthrough Table
    story.append(Paragraph("5. Application Pages &amp; Features Walkthrough", h1_style))
    pages_data = [
        [Paragraph("<b>Page Name</b>", table_header_style), Paragraph("<b>User Action / Interface</b>", table_header_style), Paragraph("<b>Behind-the-Scenes Engineering</b>", table_header_style)],
        [Paragraph("<b>1. Dashboard</b>", table_cell_style), Paragraph("Status overview, 1-click sample load, 5-step workflow overview.", table_cell_style), Paragraph("Health-check ping to <code>/health</code>, checks dataset & model registries.", table_cell_style)],
        [Paragraph("<b>2. Datasets</b>", table_cell_style), Paragraph("Upload custom CSV or inspect loaded rows and target columns.", table_cell_style), Paragraph("Pandas schema inference, date parsing, missing value identification.", table_cell_style)],
        [Paragraph("<b>3. Preprocessing</b>", table_cell_style), Paragraph("Select imputation strategy (ffill, mean), toggle lag & rolling features.", table_cell_style), Paragraph("Computes <code>lag_1</code>, <code>lag_7</code>, <code>rolling_mean_7</code>, outputs audit log.", table_cell_style)],
        [Paragraph("<b>4. Analytics</b>", table_cell_style), Paragraph("Interactive time-series line chart, 7/14/30-day moving average windows.", table_cell_style), Paragraph("Calculates Min, Max, Mean, Latest metrics and rolling time-series.", table_cell_style)],
        [Paragraph("<b>5. Models</b>", table_cell_style), Paragraph("Select Linear Regression or Random Forest; adjust sliders and train.", table_cell_style), Paragraph("Strict 80/20 chronological split, trains Scikit-learn estimator, serializes.", table_cell_style)],
        [Paragraph("<b>6. Evaluation</b>", table_cell_style), Paragraph("Comparison leaderboard (MAE, RMSE, R²), actual vs predicted chart.", table_cell_style), Paragraph("Predicts holdout test set, measures residual errors, recommends lowest RMSE.", table_cell_style)],
        [Paragraph("<b>7. Forecasts</b>", table_cell_style), Paragraph("Pick horizon (7, 14, 30d), confidence level (80/95/99%), export CSV.", table_cell_style), Paragraph("Recursive multi-step forecasting loop, error propagation confidence bands.", table_cell_style)],
        [Paragraph("<b>8. Viva &amp; Docs</b>", table_cell_style), Paragraph("Examiner Q&A accordions, formula reference cards, 5-min demo script.", table_cell_style), Paragraph("Self-contained project defense hub for college viva presentation.", table_cell_style)],
    ]
    pages_table = Table(pages_data, colWidths=[1.3 * inch, 2.9 * inch, 3.3 * inch])
    pages_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(pages_table)
    story.append(Spacer(1, 10))

    # SECTION 6: Core Machine Learning Concepts (Viva Essentials)
    story.append(Paragraph("6. Core Machine Learning Concepts (Viva Essentials)", h1_style))
    
    viva_qa = [
        ("Q1: Why must we use chronological splitting instead of random K-Fold CV?",
         "In time series, data points have temporal auto-correlation. If you randomly shuffle observations, future points (t+5) leak into the training set while past points (t+1) end up in the test set. This creates <b>look-ahead bias (data leakage)</b>, giving fake high accuracy during development but total failure in production. We strictly enforce <code>shuffle=False</code> (earliest 80% train, latest 20% test)."),
        
        ("Q2: Why compare Linear Regression against Random Forest?",
         "<b>Linear Regression</b> provides an instant (&lt;20ms), perfectly interpretable statistical baseline with zero risk of tree overfitting. <b>Random Forest</b> uses an ensemble of 100 decision trees to capture non-linear seasonal cycles, weekend multipliers, and holiday demand spikes without requiring data stationarity."),
        
        ("Q3: What is the mathematical difference between MAE and RMSE? Why prioritize RMSE?",
         "<b>MAE</b> = (1/n) Σ |y - ŷ|. Measures average error magnitude linearly. <b>RMSE</b> = √[(1/n) Σ (y - ŷ)²]. By squaring errors before taking the square root, RMSE heavily penalizes large blunders. In supply chain and demand planning, missing a huge demand spike causes severe stockouts; hence RMSE is our primary ranking metric."),
        
        ("Q4: Can the R² score be negative on the holdout test set?",
         "Yes. R² = 1 - (SS_res / SS_tot). On unseen test data, if an overfitted model's residual sum of squares exceeds the total variance of the actual ground truth, R² becomes negative. This proves the model performs worse than simply predicting the historical mean (ȳ) for every future point."),
        
        ("Q5: How does the recursive forecasting engine work for future dates?",
         "Because future ground truth is unavailable, at step t+1 the model predicts ŷ_{t+1}. It then recursively injects ŷ_{t+1} back into the buffer as the <code>lag_1</code> input for step t+2, repeating iteratively across the entire forecast horizon H."),
        
        ("Q6: Why do confidence intervals widen over time?",
         "Because predictions are recursively recycled as inputs, forecasting uncertainty compounds at every step. We model standard error dynamically as: <b>σ(h) = RMSE_val × √(1 + 0.10 × (h - 1))</b>. As horizon step h increases, the uncertainty cone realistically expands.")
    ]
    
    for q, a in viva_qa:
        q_p = Paragraph(f"<b>{q}</b>", h2_style)
        a_p = Paragraph(a, body_style)
        item_table = Table([[q_p], [a_p]], colWidths=[7.5 * inch])
        item_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 2),
            ('TOPPADDING', (0, 1), (-1, 1), 2),
        ]))
        story.append(item_table)
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 6))

    # SECTION 7: How to Run Locally
    story.append(Paragraph("7. How to Run &amp; Develop Locally", h1_style))
    commands_text = (
        "<b>Terminal 1 — Backend (FastAPI):</b><br/>"
        "<code>cd backend &amp;&amp; .\\.venv\\Scripts\\Activate.ps1</code><br/>"
        "<code>python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload</code><br/>"
        "<i>(API live at http://127.0.0.1:8000 • Interactive docs at /docs)</i><br/><br/>"
        "<b>Terminal 2 — Frontend (Vite):</b><br/>"
        "<code>cd frontend &amp;&amp; npm run dev</code><br/>"
        "<i>(Frontend live at http://localhost:5173)</i><br/><br/>"
        "<b>Terminal 3 — Run Automated Tests:</b><br/>"
        "<code>cd backend &amp;&amp; .\\.venv\\Scripts\\python -m pytest</code><br/>"
        "<i>(All 26 unit and integration tests pass with 100% success rate)</i>"
    )
    cmd_table = Table([[Paragraph(commands_text, code_style)]], colWidths=[7.5 * inch])
    cmd_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(cmd_table)
    story.append(Spacer(1, 10))

    # SECTION 8: Team Member Roles
    story.append(Paragraph("8. Team Member Presentation / Viva Defense Roles", h1_style))
    roles_data = [
        [Paragraph("<b>Team Member</b>", table_header_style), Paragraph("<b>Assigned Topics &amp; Presentation Sequence</b>", table_header_style)],
        [
            Paragraph("<b>Member 1<br/>(Architecture &amp; Data)</b>", table_cell_style),
            Paragraph("• Explains the problem statement and the dangers of temporal data leakage.<br/>• Demonstrates the <b>Dashboard</b> and <b>Datasets</b> page.<br/>• Explains how FastAPI REST backend and React frontend communicate asynchronously.", table_cell_style)
        ],
        [
            Paragraph("<b>Member 2<br/>(Preprocessing &amp; ML)</b>", table_cell_style),
            Paragraph("• Demonstrates <b>Preprocessing</b>: explains why we engineer <code>lag_1</code>, <code>lag_7</code>, and <code>rolling_mean_7</code>.<br/>• Demonstrates <b>Models</b>: explains the 80/20 chronological split with <code>shuffle=False</code>.<br/>• Compares Linear Regression vs. Random Forest hyperparameters and execution time.", table_cell_style)
        ],
        [
            Paragraph("<b>Member 3<br/>(Evaluation &amp; Forecasts)</b>", table_cell_style),
            Paragraph("• Demonstrates <b>Evaluation</b>: explains MAE, RMSE, and R², and why the lowest RMSE model wins.<br/>• Demonstrates <b>Forecasts</b>: generates 14-day projection, explains recursive forecasting and confidence intervals, and exports the CSV.<br/>• Answers theoretical examiner questions using the built-in <b>Viva &amp; Docs</b> tab.", table_cell_style)
        ],
    ]
    roles_table = Table(roles_data, colWidths=[2.2 * inch, 5.3 * inch])
    roles_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(roles_table)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generated successfully at: {pdf_path}")
    return pdf_path

if __name__ == "__main__":
    generate_pdf()
