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
  ShadingType
} = require('docx');

const assetsDir = path.join(__dirname, '..', 'docs', 'assets');
const outputPath = path.join(__dirname, '..', 'docs', 'Swagger2API_AI_Agent_Solution_Document.docx');

// Image loaders with fallback
function loadImage(filename) {
  const filePath = path.join(assetsDir, filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath);
  }
  return null;
}

const strategyImg = loadImage('strategy_selector.png');
const allureImg = loadImage('allure_reporting.png');
const workbenchImg = loadImage('architecture_workbench.png');

// Border configuration for clean tables
const cleanBorder = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: 'CBD5E1'
};

const tableBorders = {
  top: cleanBorder,
  bottom: cleanBorder,
  left: cleanBorder,
  right: cleanBorder,
  insideHorizontal: cleanBorder,
  insideVertical: cleanBorder
};

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: 'Segoe UI',
          size: 21 // 10.5pt
        }
      }
    }
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: 1000,
          bottom: 1000,
          left: 1100,
          right: 1100
        }
      }
    },
    children: [
      // Document Header / Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: "Swagger2API AI Agent",
            bold: true,
            size: 38,
            color: "0F172A"
          })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: "Enterprise Autonomous Playwright TypeScript API Test Automation Accelerator",
            italics: true,
            size: 22,
            color: "0284C7"
          })
        ]
      }),

      // Metadata Bar Table
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Solution Category: ", bold: true, size: 19 }),
                      new TextRun({ text: "Autonomous API Quality Engineering", size: 19 })
                    ]
                  })
                ]
              }),
              new TableCell({
                shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Primary Technology: ", bold: true, size: 19 }),
                      new TextRun({ text: "Playwright, TypeScript, OpenAPI 3.x, Allure", size: 19 })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }),

      new Paragraph({ spacing: { before: 250, after: 150 } }),

      // ==========================================
      // SECTION 1: PROBLEM
      // ==========================================
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: "1. Problem – What Are You Solving?",
            bold: true,
            size: 28,
            color: "0F172A"
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: "In fast-paced software delivery cycles, backend APIs evolve rapidly, but API test automation remains a severe engineering bottleneck. Whenever backend squads release a Swagger or OpenAPI document, QA engineers and SDETs traditionally spend days or weeks writing repetitive automation boilerplate from scratch."
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: "Key Industry Pain Points:", bold: true, color: "0F172A" })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "High Time-to-Market Overhead: ", bold: true }),
          new TextRun({ text: "Setting up HTTP wrappers, TypeScript types, configs, and fixtures manually takes 3–5 days per service." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Shallow Test Coverage: ", bold: true }),
          new TextRun({ text: "Due to tight sprint deadlines, teams often test only the 200 OK happy path, completely neglecting negative boundaries (400, 404, 422) and security vulnerabilities." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Architectural Inconsistency: ", bold: true }),
          new TextRun({ text: "Tests frequently hardcode endpoints directly in test scripts, leading to brittle maintenance nightmares when schemas change." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 200 },
        children: [
          new TextRun({ text: "Redundant Auth Overhead: ", bold: true }),
          new TextRun({ text: "Without centralized token caching, test suites re-authenticate on every test step, slowing CI/CD runs and triggering API rate limits." })
        ]
      }),

      // ==========================================
      // SECTION 2: SOLUTION
      // ==========================================
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: "2. Solution – What Did You Build?",
            bold: true,
            size: 28,
            color: "0F172A"
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: "We engineered ",
          }),
          new TextRun({ text: "Swagger2API AI Agent", bold: true }),
          new TextRun({
            text: "—an enterprise-grade automation accelerator that ingests ANY Swagger 2.0 or OpenAPI 3.x specification and automatically synthesizes a production-ready, modular Playwright TypeScript API Automation Framework in under 2 seconds."
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: "Core Architectural Pillars Built:", bold: true, color: "0F172A" })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Universal Smart Schema Resolver: ", bold: true }),
          new TextRun({ text: "Automatically parses raw JSON/YAML, file uploads, and live Swagger UI HTML portals across ASP.NET, Spring Boot, FastAPI, Flask, NestJS, and Express." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "4-Tier Enterprise Architecture: ", bold: true }),
          new TextRun({ text: "Strict clean separation of BaseApiClient (HTTP engine), TokenManager (in-memory token caching), Domain Services, and custom Playwright Fixtures." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Dynamic Test Strategy Selector: ", bold: true }),
          new TextRun({ text: "Dynamically configures (1) Sequential E2E Business Workflows touching all endpoints in order, (2) Positive CRUD Happy Paths, (3) Boundary Error Matrices (400/404), and (4) OWASP Security tests (IDOR, SQLi, JWT bypass)." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 150 },
        children: [
          new TextRun({ text: "Deep Allure Diagnostics & Postman Sync: ", bold: true }),
          new TextRun({ text: "Multi-tab Allure reporting capturing exact payloads, consumed latency (ms), HTTP status messages, and auto-generated Postman v2.1 collections." })
        ]
      }),

      // Embedded Screenshot 1: Dynamic Strategy Selector
      ...(strategyImg ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 150, after: 80 },
          children: [
            new ImageRun({
              data: strategyImg,
              transformation: { width: 560, height: 165 }
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "Figure 1: Dynamic Test Generation Strategy Selector with Real-time Spec Synchronization",
              italics: true,
              size: 18,
              color: "64748B"
            })
          ]
        })
      ] : []),

      // ==========================================
      // SECTION 3: BENEFITS
      // ==========================================
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: "3. Benefits – What Value & Impact Does It Deliver?",
            bold: true,
            size: 28,
            color: "0F172A"
          })
        ]
      }),

      // Benefits Comparison Table
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: "0F172A", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Metric / Dimension", bold: true, color: "FFFFFF", size: 19 })] })]
              }),
              new TableCell({
                shading: { fill: "0F172A", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Manual / Traditional Approach", bold: true, color: "FFFFFF", size: 19 })] })]
              }),
              new TableCell({
                shading: { fill: "0284C7", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Swagger2API AI Agent", bold: true, color: "FFFFFF", size: 19 })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Setup Duration", bold: true, size: 19 })] })]
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "3 to 5 Days per service", size: 19 })] })]
              }),
              new TableCell({
                shading: { fill: "F0FDF4", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Under 2 Seconds (< 99% faster)", bold: true, color: "15803D", size: 19 })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Test Coverage Breadth", bold: true, size: 19 })] })]
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Primarily 200 OK Happy Paths", size: 19 })] })]
              }),
              new TableCell({
                shading: { fill: "F0FDF4", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "100% (E2E, Positive, Negative, Security)", bold: true, color: "15803D", size: 19 })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Code Quality & Patterns", bold: true, size: 19 })] })]
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Inconsistent scripting across squads", size: 19 })] })]
              }),
              new TableCell({
                shading: { fill: "F0FDF4", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Standardized 4-Tier Clean Architecture", bold: true, color: "15803D", size: 19 })] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "CI/CD & Postman Sync", bold: true, size: 19 })] })]
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Manual pipelines & manually synced Postman", size: 19 })] })]
              }),
              new TableCell({
                shading: { fill: "F0FDF4", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Bundled GitHub Actions & Postman v2.1", bold: true, color: "15803D", size: 19 })] })]
              })
            ]
          })
        ]
      }),

      new Paragraph({ spacing: { before: 150, after: 120 } }),

      // Embedded Screenshot 2: Allure Diagnostics
      ...(allureImg ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 150, after: 80 },
          children: [
            new ImageRun({
              data: allureImg,
              transformation: { width: 560, height: 180 }
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "Figure 2: Multi-Tab Allure Report with Consumed Response Latency, Payload Forensics & Assertions",
              italics: true,
              size: 18,
              color: "64748B"
            })
          ]
        })
      ] : []),

      // ==========================================
      // SECTION 4: ADDITIONAL INFO
      // ==========================================
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: "4. Any Additional Info – Deployment & Scalability",
            bold: true,
            size: 28,
            color: "0F172A"
          })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Universal Framework Compatibility: ", bold: true }),
          new TextRun({ text: "Supports OpenAPI 3.0, 3.1, and Swagger 2.0 specs generated by Springdoc, Swagger-Net, FastAPI, NestJS, Go-Swagger, Flask-RESTX, and AWS API Gateway." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Zero-Friction Team Onboarding: ", bold: true }),
          new TextRun({ text: "Colleagues can run the tool locally with 'npm install && npm start' or download the synthesized framework zip and execute 'npm test' with zero extra config." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "Autonomous Dependency Chaining: ", bold: true }),
          new TextRun({ text: "The Sequential E2E workflow automatically captures generated primary IDs from POST mutations and passes them seamlessly to downstream GET, PUT, and DELETE operations." })
        ]
      }),
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 200 },
        children: [
          new TextRun({ text: "Production-Ready Execution Commands: ", bold: true }),
          new TextRun({ text: "Execute full suite with 'npm test', run isolated E2E workflow with 'npx playwright test tests/e2e/e2e-workflow.spec.ts', or view reports with 'npx playwright show-report'." })
        ]
      }),

      // Sign-off footer
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [
          new TextRun({
            text: "Designed & Engineered for Enterprise Engineering Squads | Accelerating Quality Velocity",
            italics: true,
            size: 18,
            color: "94A3B8"
          })
        ]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Word Document successfully generated at:\n   ${outputPath}\n   File size: ${buffer.length} bytes`);
}).catch(err => {
  console.error("❌ Error generating Word document:", err);
});
