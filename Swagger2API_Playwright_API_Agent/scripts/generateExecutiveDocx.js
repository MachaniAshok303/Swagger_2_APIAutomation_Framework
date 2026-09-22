const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber
} = require('docx');

const assetsDir = path.join(__dirname, '..', 'docs', 'assets');
const outputPath = path.join(__dirname, '..', 'docs', 'Swagger2API_Executive_OnePager.docx');

function getImageBuffer(filename) {
  const p = path.join(assetsDir, filename);
  return fs.existsSync(p) ? fs.readFileSync(p) : null;
}

const aiInfographic = getImageBuffer('ai_architecture_infographic.jpg');
const strategyImg = getImageBuffer('strategy_selector.png');

// Subtle clean borders
const borderLight = { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' };
const cellBorders = {
  top: borderLight,
  bottom: borderLight,
  left: borderLight,
  right: borderLight,
  insideHorizontal: borderLight,
  insideVertical: borderLight
};

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: 'Segoe UI',
          size: 20 // 10pt
        }
      }
    }
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 900, bottom: 900, left: 1000, right: 1000 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "Swagger2API AI Agent | Enterprise Solution Overview", size: 16, color: "64748B", italics: true })
            ]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.SPACE_BETWEEN,
            children: [
              new TextRun({ text: "Confidential - For Internal Review & Evaluation", size: 16, color: "94A3B8" }),
              new TextRun({ text: "\tPage ", size: 16, color: "94A3B8" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "94A3B8" })
            ]
          })
        ]
      })
    },
    children: [
      // Title Header Banner
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({ text: "Swagger2API AI Agent", bold: true, size: 36, color: "0F172A" })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: "Autonomous Playwright TypeScript API Automation in Seconds", bold: true, size: 22, color: "0284C7" })
        ]
      }),

      // AI Generated Infographic
      ...(aiInfographic ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new ImageRun({
              data: aiInfographic,
              transformation: { width: 580, height: 260 }
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 220 },
          children: [
            new TextRun({ text: "Figure 1: End-to-End AI-Driven Architecture — From Raw Swagger/OpenAPI to Production Playwright Suite", italics: true, size: 17, color: "64748B" })
          ]
        })
      ] : []),

      // ==========================================
      // SECTION 1: PROBLEM
      // ==========================================
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 140, after: 100 },
        children: [
          new TextRun({ text: "1. Problem – What Are We Solving?", bold: true, size: 24, color: "0F172A" })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: "In fast sprints, developers release new APIs constantly. But " }),
          new TextRun({ text: "writing automation tests manually is painful and slow", bold: true }),
          new TextRun({ text: ". Teams face three everyday hurdles:" })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Takes Days to Set Up: ", bold: true, color: "0F172A" }),
          new TextRun({ text: "Setting up HTTP helpers, configs, auth tokens, and test folders takes " }),
          new TextRun({ text: "3 to 5 valuable days", bold: true, color: "DC2626" }),
          new TextRun({ text: " per microservice." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Shallow \"Happy Path Only\" Tests: ", bold: true, color: "0F172A" }),
          new TextRun({ text: "Under deadline pressure, engineers usually test only " }),
          new TextRun({ text: "status 200 OK", bold: true }),
          new TextRun({ text: ", leaving error boundaries (400, 404) and security flaws completely untested." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Brittle, Hardcoded Scripts: ", bold: true, color: "0F172A" }),
          new TextRun({ text: "API URLs are hardcoded directly into test steps. Whenever backend fields change, " }),
          new TextRun({ text: "tests break instantly", bold: true }),
          new TextRun({ text: " and require hours of refactoring." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 180 },
        children: [
          new TextRun({ text: "Repeated Login Overhead: ", bold: true, color: "0F172A" }),
          new TextRun({ text: "Tests log in again and again on every step, making runs sluggish and triggering server " }),
          new TextRun({ text: "rate-limiting errors", bold: true }),
          new TextRun({ text: "." })
        ]
      }),

      // ==========================================
      // SECTION 2: SOLUTION
      // ==========================================
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 140, after: 100 },
        children: [
          new TextRun({ text: "2. Solution – What Did We Build?", bold: true, size: 24, color: "0F172A" })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: "We built " }),
          new TextRun({ text: "Swagger2API AI Agent", bold: true, color: "0284C7" }),
          new TextRun({ text: "—a 1-click tool where you paste any Swagger link or upload an API file, and it instantly builds an " }),
          new TextRun({ text: "enterprise-ready Playwright TypeScript framework", bold: true }),
          new TextRun({ text: " in " }),
          new TextRun({ text: "under 2 seconds", bold: true, color: "16A34A" }),
          new TextRun({ text: "." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Smart Auto-Discovery: ", bold: true, color: "0F172A" }),
          new TextRun({ text: "Paste a Swagger UI web link or a raw JSON/YAML file. The tool automatically detects endpoints, parameters, and models from " }),
          new TextRun({ text: "Spring Boot, ASP.NET, FastAPI, NestJS, and Express", bold: true }),
          new TextRun({ text: "." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Clean 4-Tier Architecture: ", bold: true, color: "0F172A" }),
          new TextRun({ text: "Organizes code neatly into " }),
          new TextRun({ text: "BaseApiClient", bold: true }),
          new TextRun({ text: " (handles HTTP calls), " }),
          new TextRun({ text: "TokenManager", bold: true }),
          new TextRun({ text: " (caches login tokens in memory), " }),
          new TextRun({ text: "Domain Services", bold: true }),
          new TextRun({ text: ", and " }),
          new TextRun({ text: "Playwright Fixtures", bold: true }),
          new TextRun({ text: " for zero code duplication." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "4-in-1 Test Strategy Selector: ", bold: true, color: "0F172A" }),
          new TextRun({ text: "Choose the exact test combinations you need: " }),
          new TextRun({ text: "1. Sequential E2E Journey", bold: true }),
          new TextRun({ text: " (creates data, passes ID downstream, cleans up), " }),
          new TextRun({ text: "2. Positive CRUD", bold: true }),
          new TextRun({ text: ", " }),
          new TextRun({ text: "3. Negative Boundaries (400/404/422)", bold: true }),
          new TextRun({ text: ", and " }),
          new TextRun({ text: "4. Security Fuzzing (IDOR, SQLi, JWT)", bold: true }),
          new TextRun({ text: "." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 140 },
        children: [
          new TextRun({ text: "Deep Allure Forensics: ", bold: true, color: "0F172A" }),
          new TextRun({ text: "Built-in interactive reporting showing the " }),
          new TextRun({ text: "exact request payload sent, response latency (ms), HTTP status, and step assertions", bold: true }),
          new TextRun({ text: "." })
        ]
      }),

      // Strategy Selector Graphic
      ...(strategyImg ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new ImageRun({
              data: strategyImg,
              transformation: { width: 560, height: 160 }
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "Figure 2: Real-time Strategy Configuration — Dynamically Adapts to Any Uploaded Swagger Document", italics: true, size: 17, color: "64748B" })
          ]
        })
      ] : []),

      // ==========================================
      // SECTION 3: BENEFITS
      // ==========================================
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 140, after: 100 },
        children: [
          new TextRun({ text: "3. Benefits – What Value & Impact Does It Deliver?", bold: true, size: 24, color: "0F172A" })
        ]
      }),

      // Comparison Table
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: "0F172A", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "What You Care About", bold: true, color: "FFFFFF", size: 18 })] })]
              }),
              new TableCell({
                shading: { fill: "475569", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Old Manual Way", bold: true, color: "FFFFFF", size: 18 })] })]
              }),
              new TableCell({
                shading: { fill: "0284C7", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "With Swagger2API AI Agent", bold: true, color: "FFFFFF", size: 18 })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Setup Time", bold: true, size: 18 })] })]
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "3 to 5 days per service", size: 18 })] })]
              }),
              new TableCell({
                shading: { fill: "F0FDF4", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Under 2 seconds (< 99% faster)", bold: true, color: "15803D", size: 18 })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Test Quality", bold: true, size: 18 })] })]
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Happy paths only; errors skipped", size: 18 })] })]
              }),
              new TableCell({
                shading: { fill: "F0FDF4", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "100% full coverage (E2E + Error + Security)", bold: true, color: "15803D", size: 18 })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Framework Quality", bold: true, size: 18 })] })]
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Ad-hoc scripts; hard to maintain", size: 18 })] })]
              }),
              new TableCell({
                shading: { fill: "F0FDF4", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Strict enterprise 4-tier Page/Service pattern", bold: true, color: "15803D", size: 18 })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "CI/CD & Postman", bold: true, size: 18 })] })]
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Manually written from scratch", size: 18 })] })]
              }),
              new TableCell({
                shading: { fill: "F0FDF4", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Instant GitHub Actions workflow + Postman v2.1", bold: true, color: "15803D", size: 18 })] })]
              })
            ]
          })
        ]
      }),

      new Paragraph({ spacing: { before: 180, after: 100 } }),

      // ==========================================
      // SECTION 4: ADDITIONAL INFO
      // ==========================================
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 140, after: 100 },
        children: [
          new TextRun({ text: "4. Any Additional Info – How Teams Use It", bold: true, size: 24, color: "0F172A" })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Universal Backend Compatibility: ", bold: true, color: "0F172A" }),
          new TextRun({ text: "Tested and verified across " }),
          new TextRun({ text: "Spring Boot, ASP.NET Core, FastAPI, NestJS, and Express", bold: true }),
          new TextRun({ text: ". It handles any valid Swagger 2.0 or OpenAPI 3.x spec." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Ready to Run Locally: ", bold: true, color: "0F172A" }),
          new TextRun({ text: "Anyone can clone the folder, run " }),
          new TextRun({ text: "npm install && npm start", bold: true }),
          new TextRun({ text: ", and open " }),
          new TextRun({ text: "http://localhost:3000", bold: true }),
          new TextRun({ text: " with zero configuration." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Autonomous ID Chaining: ", bold: true, color: "0F172A" }),
          new TextRun({ text: "The Sequential E2E test creates an entity (e.g. User), catches the generated ID, checks it, updates it, and deletes it at the end automatically." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 180 },
        children: [
          new TextRun({ text: "Run Tests with Standard Commands: ", bold: true, color: "0F172A" }),
          new TextRun({ text: "Run " }),
          new TextRun({ text: "npm test", bold: true }),
          new TextRun({ text: " to run all suites, or " }),
          new TextRun({ text: "npx playwright show-report", bold: true }),
          new TextRun({ text: " to view the HTML report." })
        ]
      }),

      // Footer notice
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 180 },
        children: [
          new TextRun({ text: "★ Built for Agile Squads | Zero Boilerplate, 100% Quality Velocity ★", bold: true, size: 18, color: "0284C7" })
        ]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Executive One-Pager successfully generated at:\n   ${outputPath}\n   File size: ${buffer.length} bytes`);
}).catch(err => {
  console.error("❌ Error generating Executive One-Pager:", err);
});
