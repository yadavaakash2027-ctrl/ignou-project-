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

    const getSchoolName = (prog?: string): string => {
      const p = (prog || '').toUpperCase();
      if (p.includes('BCA') || p.includes('MCA') || p.includes('PGDCA') || p.includes('CIT') || p.includes('COMPUTER') || p.includes('CS') || p.includes('IT')) {
        return 'Computer and Information Sciences (SOCIS)';
      }
      if (p.includes('MBA') || p.includes('B.COM') || p.includes('M.COM') || p.includes('MANAGEMENT') || p.includes('BBA')) {
        return 'Management Studies (SOMS)';
      }
      if (p.includes('BED') || p.includes('MED') || p.includes('MAEDU') || p.includes('EDUCATION')) {
        return 'Education (SOE)';
      }
      if (p.includes('MAPC') || p.includes('BAPCH') || p.includes('PSYCHOLOGY') || p.includes('MSW') || p.includes('BSW') || p.includes('ECONOMICS') || p.includes('POLITICAL') || p.includes('HISTORY') || p.includes('SOCIOLOGY')) {
        return 'Social Sciences (SOSS)';
      }
      if (p.includes('TOURISM') || p.includes('BTS') || p.includes('MTM')) {
        return 'Tourism and Hospitality Service Sector (SOTHSM)';
      }
      if (p.includes('HEALTH') || p.includes('NURSING') || p.includes('DNA')) {
        return 'Health Sciences (SOHS)';
      }
      if (p.includes('SCIENCE') || p.includes('BSC') || p.includes('MSC')) {
        return 'Pure and Applied Sciences (SOS)';
      }
      return 'Computer and Information Sciences (SOCIS)';
    };

    const hasValidStudentName = context.studentName && context.studentName.trim() !== '' && context.studentName !== 'IGNOU Student' && context.studentName !== 'undefined' && context.studentName !== 'null';
    const studentNameVal = hasValidStudentName ? context.studentName.trim() : '___________________________';

    const hasValidEnrollment = context.enrollmentNumber && context.enrollmentNumber.trim() !== '' && context.enrollmentNumber !== 'IGNOU-2025-XXXX' && context.enrollmentNumber !== 'undefined' && context.enrollmentNumber !== 'null';
    const enrollmentVal = hasValidEnrollment ? context.enrollmentNumber.trim() : '__________________';

    const progVal = context.program && context.program !== 'undefined' && context.program !== 'null' ? context.program : '_________________________';
    const rcVal = context.regionalCenter || 'RC Delhi-II (07)';
    const scVal = context.studyCenter || 'SC-0713';
    const schoolName = getSchoolName(context.program);
    const cleanTitle = (context.topicTitle || 'Project Title').trim().replace(/^"+|"+$/g, '');

    // Title Section (PAGE 1)
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'INDIRA GANDHI NATIONAL OPEN UNIVERSITY',
            bold: true,
            size: 32, // 16pt
            font: 'Times New Roman',
            color: '000000'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 60 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `School of ${schoolName}`,
            size: 21, // 10.5pt
            font: 'Times New Roman',
            color: '000000'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Maidan Garhi, New Delhi – 110068',
            size: 19, // 9.5pt
            font: 'Times New Roman',
            color: '334155'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'A DISSERTATION / PROJECT REPORT SUBMITTED IN PARTIAL FULFILLMENT OF\nTHE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF',
            bold: true,
            size: 21, // 10.5pt
            font: 'Times New Roman',
            color: '000000'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: (context.program || 'BACHELOR OF COMPUTER APPLICATIONS (BCA)').toUpperCase(),
            bold: true,
            size: 32, // 16pt
            font: 'Times New Roman',
            color: '000000'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `COURSE CODE: ${(context.courseCode || 'BCSP-064').toUpperCase()}`,
            bold: true,
            size: 23, // 11.5pt
            font: 'Times New Roman',
            color: '000000'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 220 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'ON THE TOPIC:',
            italics: true,
            size: 21, // 10.5pt
            font: 'Times New Roman',
            color: '000000'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 }
      }),
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `"${cleanTitle}"`,
                        bold: true,
                        size: 25, // 12.5pt
                        font: 'Times New Roman',
                        color: '000000'
                      })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 140, after: 140 }
                  })
                ],
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 8, color: '475569' },
                  bottom: { style: BorderStyle.SINGLE, size: 8, color: '475569' },
                  left: { style: BorderStyle.SINGLE, size: 8, color: '475569' },
                  right: { style: BorderStyle.SINGLE, size: 8, color: '475569' }
                }
              })
            ]
          })
        ],
        width: { size: 92, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        text: '',
        spacing: { after: 260 }
      }),
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'SUBMITTED BY:', bold: true, size: 21, font: 'Times New Roman', color: '000000' })
                    ],
                    spacing: { after: 100 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Name: ', bold: true, size: 19, font: 'Times New Roman', color: '000000' }),
                      new TextRun({ text: studentNameVal, size: 19, font: 'Times New Roman', color: '1E293B' })
                    ],
                    spacing: { after: 60 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Enrollment No.: ', bold: true, size: 19, font: 'Times New Roman', color: '000000' }),
                      new TextRun({ text: enrollmentVal, size: 19, font: 'Times New Roman', color: '1E293B' })
                    ],
                    spacing: { after: 60 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Program: ', bold: true, size: 19, font: 'Times New Roman', color: '000000' }),
                      new TextRun({ text: progVal, size: 19, font: 'Times New Roman', color: '1E293B' })
                    ],
                    spacing: { after: 60 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Regional Centre: ', bold: true, size: 19, font: 'Times New Roman', color: '000000' }),
                      new TextRun({ text: rcVal, size: 19, font: 'Times New Roman', color: '1E293B' })
                    ],
                    spacing: { after: 60 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Study Centre Code: ', bold: true, size: 19, font: 'Times New Roman', color: '000000' }),
                      new TextRun({ text: scVal, size: 19, font: 'Times New Roman', color: '1E293B' })
                    ],
                    spacing: { after: 60 }
                  })
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE }
                }
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'UNDER THE SUPERVISION OF:', bold: true, size: 21, font: 'Times New Roman', color: '000000' })
                    ],
                    spacing: { after: 100 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Dr. S. K. Verma', bold: true, size: 19, font: 'Times New Roman', color: '000000' })
                    ],
                    spacing: { after: 40 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Ph.D., Associate Professor', size: 18, font: 'Times New Roman', color: '334155' })
                    ],
                    spacing: { after: 40 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: `School of ${schoolName}`, size: 18, font: 'Times New Roman', color: '334155' })
                    ],
                    spacing: { after: 40 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Approved IGNOU Project Guide', size: 18, font: 'Times New Roman', color: '334155' })
                    ],
                    spacing: { after: 40 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: `Academic Session: ${context.academicSession || '2025–2026'}`, size: 18, font: 'Times New Roman', color: '334155' })
                    ],
                    spacing: { after: 40 }
                  })
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE }
                }
              })
            ]
          })
        ],
        width: { size: 92, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER
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
