import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber
} from 'docx';
import fs from 'fs';
import path from 'path';
import { ProjectContext, ChapterContent } from '../src/types';
import { AcademicEngine } from './academicEngine';
import { STORAGE_DIR } from './db';

export class DocxGenerator {
  /**
   * Generates a genuine Microsoft Word (.docx) project file
   */
  static async generateProjectDocx(
    context: ProjectContext,
    chapters: ChapterContent[]
  ): Promise<{ filePath: string; relativeUrl: string }> {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }

    const filename = `IGNOU_Project_${context.courseCode}_${context.enrollmentNumber}_${context.projectId.slice(0, 8)}.docx`;
    const filePath = path.join(STORAGE_DIR, filename);

    const docChildren: any[] = [];

    // Title Section
    docChildren.push(
      new Paragraph({
        text: 'INDIRA GANDHI NATIONAL OPEN UNIVERSITY',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `School of Management Studies / Computer & Social Sciences`,
            italics: true
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `A DISSERTATION / MAJOR PROJECT SUBMITTED IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR ${context.program} (${context.courseCode})`,
            bold: true
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `TOPIC: "${context.topicTitle}"`,
            bold: true,
            size: 28,
            color: '1E3A8A'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Submitted by: ${context.studentName} | Enrollment No: ${context.enrollmentNumber}\nProgram: ${context.program} | Course Code: ${context.courseCode}\nApproved Project Guide: Dr. S. K. Verma, Ph.D.`,
            bold: true
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'ACADEMIC INTEGRITY NOTICE:\nAll generated projects and synopses are provided as personalized academic project drafts and reference research material to assist students in understanding methodology and structuring. Students should review, verify, understand, edit and personalize the material before official university evaluation.\nIGNOU Project Hub is an independent platform and is not affiliated with IGNOU.',
            italics: true,
            color: 'DC2626'
          })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 800 }
      })
    );

    // Render Chapters
    for (const chapter of chapters) {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `CHAPTER ${chapter.chapterNumber}: ${chapter.title.toUpperCase()}`,
              bold: true,
              size: 26,
              color: '1E3A8A'
            })
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );

      for (const sub of chapter.subsections) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sub.heading,
                bold: true,
                size: 22,
                color: '2563EB'
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 }
          })
        );

        const paragraphs = sub.content.split('\n\n');
        for (const p of paragraphs) {
          if (!p.trim()) continue;
          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: p.trim(), size: 22 })],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { line: 360, after: 160 }
            })
          );
        }

        // Tables in docx
        if (sub.tables) {
          for (const tbl of sub.tables) {
            docChildren.push(
              new Paragraph({
                children: [
                  new TextRun({ text: tbl.title, bold: true, italics: true })
                ],
                spacing: { before: 180, after: 100 }
              })
            );

            const tableRows = [
              new TableRow({
                children: tbl.headers.map(
                  (h) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: h, bold: true, color: 'FFFFFF' })],
                          alignment: AlignmentType.CENTER
                        })
                      ],
                      shading: { fill: '1E3A8A' }
                    })
                )
              }),
              ...tbl.rows.map(
                (row) =>
                  new TableRow({
                    children: row.map(
                      (cell) =>
                        new TableCell({
                          children: [new Paragraph({ text: cell })]
                        })
                    )
                  })
              )
            ];

            docChildren.push(
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE }
              }),
              new Paragraph({ text: '', spacing: { after: 200 } })
            );
          }
        }
      }
    }

    // References
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'REFERENCES & ACADEMIC BIBLIOGRAPHY',
            bold: true,
            size: 26,
            color: '1E3A8A'
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    const refs = AcademicEngine.generateReferences(context);
    refs.forEach((ref, idx) => {
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: `[${idx + 1}] ${ref}`, size: 20 })],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100 }
        })
      );
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `IGNOU ${context.program} (${context.courseCode}) | Major Project Dissertation`,
                      italics: true,
                      size: 18
                    })
                  ],
                  alignment: AlignmentType.RIGHT
                })
              ]
            })
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'IGNOU Project Hub — Academic Reference Draft | Page ',
                      size: 18
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT]
                    })
                  ],
                  alignment: AlignmentType.CENTER
                })
              ]
            })
          },
          children: docChildren
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    return {
      filePath,
      relativeUrl: `/api/projects/${context.projectId}/download/docx`
    };
  }
}
