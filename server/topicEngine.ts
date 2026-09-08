import { db } from './db';
import { Topic, Subject } from '../src/types';
import crypto from 'crypto';

// Mutex lock for atomic allocation
let isAllocating = false;

// Specialized academic topic title generators per program / discipline
const DISCIPLINE_TOPIC_TEMPLATES: Record<string, Array<{ title: string; description: string; focusAreas: string[] }>> = {
  MBA: [
    {
      title: 'A Critical Study on the Impact of Digital Banking Transformation & FinTech Adoption on Customer Retention in Tier-1 & Tier-2 Indian Cities',
      description: 'An empirical investigation examining digital transaction velocity, omnichannel banking experiences, customer trust metrics, and churn reduction strategies in leading commercial banking institutions.',
      focusAreas: ['Digital Banking', 'FinTech Adoption', 'Customer Retention', 'Structural Equation Modeling']
    },
    {
      title: 'Strategic Human Resource Management and Employee Engagement in Post-Pandemic Hybrid Work Environments: A Comparative Study of IT & BFSI Sectors',
      description: 'An in-depth empirical assessment of organizational culture, psychological safety, talent attrition, performance appraisal frameworks, and remote productivity across multinational corporations.',
      focusAreas: ['Strategic HRM', 'Employee Engagement', 'Hybrid Workplace Dynamics', 'Talent Retention']
    },
    {
      title: 'Supply Chain Resilience and Risk Mitigation Strategies in FMCG Sector: An Empirical Analysis of Post-Disruption Operations in India',
      description: 'Quantitative and qualitative evaluation of vendor diversification, predictive inventory modeling, cold-chain logistics efficiency, and dynamic demand forecasting.',
      focusAreas: ['Supply Chain Resilience', 'Logistics Optimization', 'FMCG Distribution', 'Risk Assessment']
    },
    {
      title: 'Impact of Environmental, Social, and Governance (ESG) Disclosures on Corporate Financial Performance & Valuation of NSE-Listed Firms',
      description: 'Econometric analysis of ESG scores, cost of capital, Tobin’s Q, and investor sentiment across blue-chip manufacturing and services corporations.',
      focusAreas: ['ESG Governance', 'Corporate Finance', 'Valuation Modeling', 'Panel Regression']
    },
    {
      title: 'Omnichannel Marketing Strategies and Consumer Purchase Intention in the Organized Retail Sector: An Empirical Investigation',
      description: 'Analysis of digital touchpoints, BOPIS (Buy Online Pick Up In Store) consumer behavior, brand perception, and conversion optimization.',
      focusAreas: ['Omnichannel Marketing', 'Consumer Behavior', 'Retail Analytics', 'Brand Equity']
    },
    {
      title: 'Effectiveness of Microfinance Institutions (MFIs) in Fostering Financial Inclusion & Women Entrepreneurship in Rural Maharashtra & Uttar Pradesh',
      description: 'Empirical socio-economic field assessment of self-help group lending models, credit repayment cycles, and grassroots enterprise sustainability.',
      focusAreas: ['Financial Inclusion', 'Microfinance', 'Women Entrepreneurship', 'Socio-Economic Development']
    }
  ],
  'M.Com': [
    {
      title: 'A Comparative Financial Health and Profitability Analysis of Public Sector vs. Private Sector Commercial Banks in India Using CAMEL Framework',
      description: 'Exhaustive 10-year longitudinal evaluation of Capital Adequacy, Asset Quality, Management Efficiency, Earnings Quality, and Liquidity ratios.',
      focusAreas: ['CAMEL Analysis', 'Financial Statement Analysis', 'Banking Performance', 'Ratio Modeling']
    },
    {
      title: 'Working Capital Management Efficiency and Its Impact on Corporate Profitability: An Empirical Study of BSE 500 Manufacturing Enterprises',
      description: 'Statistical analysis of Cash Conversion Cycle (CCC), inventory turnover, debtor management, and net operating profit margins across capital-intensive industries.',
      focusAreas: ['Working Capital Optimization', 'Corporate Liquidity', 'Profitability Metrics', 'Regression Analysis']
    },
    {
      title: 'Impact of Goods and Services Tax (GST) Compliance and Input Tax Credit (ITC) Mechanisms on SME Sector Operations in India',
      description: 'Structured survey and financial review of micro, small, and medium enterprise tax compliance burdens, cash flow timing, and supply chain adjustments.',
      focusAreas: ['GST Compliance', 'Taxation Reforms', 'SME Financial Health', 'Fiscal Policy']
    },
    {
      title: 'A Critical Appraisal of Non-Performing Assets (NPAs) Resolution Through IBC 2016: Recovery Performance and Stressed Asset Trends',
      description: 'Detailed analysis of corporate insolvency resolution processes, hair-cuts, asset recovery timeframes, and institutional asset restructuring.',
      focusAreas: ['Insolvency and Bankruptcy Code', 'NPA Recovery', 'Stressed Assets', 'Banking Regulations']
    }
  ],
  'B.Com': [
    {
      title: 'A Study on Consumer Awareness and Adoption of UPI & Digital Payment Gateways Among Small Retail Vendors and Consumers',
      description: 'Field survey assessing transactional security perceptions, daily merchant volume growth, merchant discount rates, and digital financial literacy.',
      focusAreas: ['Digital Payments', 'UPI Ecosystem', 'Small Retail Commerce', 'Consumer Literacy']
    },
    {
      title: 'Evaluating the Growth, Performance, and Retail Investor Participation in Systematic Investment Plans (SIPs) of Mutual Funds in India',
      description: 'Study of demographic investment preferences, asset allocation behavior, risk-return profiles, and retail wealth creation trends.',
      focusAreas: ['Mutual Funds', 'SIP Investment Trends', 'Retail Wealth Creation', 'Personal Finance']
    },
    {
      title: 'Financial Literacy and Investment Behavior of Salaried Class Employees in Urban Metros: An Empirical Survey',
      description: 'Assessment of budgeting habits, tax saving strategies under Old vs New Tax Regimes, retirement planning, and equity market exposure.',
      focusAreas: ['Financial Literacy', 'Personal Investment Portfolio', 'Tax Planning', 'Survey Research']
    }
  ],
  MCA: [
    {
      title: 'Enterprise AI-Driven Anomaly Detection and Predictive Cyber Threat Intelligence Platform Using Deep Autoencoders & Kubernetes Microservices',
      description: 'Architecture, design, empirical benchmarking, and deployment of distributed security event monitoring, packet classification, and real-time mitigation.',
      focusAreas: ['Cyber Threat Intelligence', 'Deep Learning Autoencoders', 'Microservices Architecture', 'Kubernetes Deployment']
    },
    {
      title: 'Decentralized Electronic Health Records (EHR) Auditing and Patient Consent Management System Built on Permissioned Blockchain with Zero-Knowledge Proofs',
      description: 'Implementation and stress-testing of tamper-evident health data exchange, granular role-based cryptographic access control, and FHIR interoperability.',
      focusAreas: ['Blockchain Architecture', 'Zero-Knowledge Proofs', 'EHR Security', 'Smart Contracts']
    },
    {
      title: 'Automated Microservice Observability and Distributed Tracing Framework with AI-Driven Anomaly Localization for High-Throughput E-Commerce',
      description: 'Designing high-throughput telemetry pipelines, OpenTelemetry instrumentation, tail-sampling tracing engines, and root cause diagnosis algorithms.',
      focusAreas: ['Cloud Observability', 'OpenTelemetry', 'Distributed Systems', 'Root Cause AI']
    }
  ],
  BCA: [
    {
      title: 'Design and Implementation of an Intelligent Web-Based Campus Academic Management & Examination Portal with Automated Grade Analytics',
      description: 'Full-stack software engineering project with role-based access control, relational database schema normalization, PDF report generation, and student dashboards.',
      focusAreas: ['Full-Stack Web Engineering', 'Database Normalization', 'Academic Portals', 'Automated Grading']
    },
    {
      title: 'Cloud-Connected Smart Healthcare Appointment Booking & Electronic Medical Prescription Management System',
      description: 'Interactive web platform featuring automated SMS/Email reminders, doctor roster scheduling, secure patient diagnostic records, and telemetry logs.',
      focusAreas: ['Healthcare Informatics', 'RESTful API Services', 'Relational Schemas', 'Web Security']
    },
    {
      title: 'Real-Time Inventory Management, Barcode Auditing, and Automated Invoicing Portal for Multi-Branch Retail Outlets',
      description: 'Comprehensive software solution with inventory reorder triggers, supplier management, POS billing integration, and graphical sales reports.',
      focusAreas: ['Inventory Systems', 'Point-of-Sale Integration', 'Database Management', 'Data Visualization']
    }
  ],
  PGDCA: [
    {
      title: 'Design and Development of an Automated Library Management and Digital Book Repository System with Fine Tracking & Search Indexing',
      description: 'Modular desktop/web information system with Dewey Decimal classification, member circulation tracking, barcode scanning, and fine computation.',
      focusAreas: ['Information Systems', 'Software Engineering', 'Database Queries', 'Search Indexing']
    },
    {
      title: 'Employee Payroll, Attendance, and Leave Management Information System Using Secure Relational Database Architecture',
      description: 'Automated wage calculation, tax deductions, statutory PF/ESI compliance generator, monthly pay-slip generation, and manager approval workflows.',
      focusAreas: ['Payroll Systems', 'Relational Database Design', 'HR Information Systems', 'Data Security']
    }
  ],
  'BA/BAG': [
    {
      title: 'Socio-Economic Impact of Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA) on Rural Household Livelihoods & Migration Patterns',
      description: 'Empirical field investigation evaluating household income stability, local asset creation, women labor participation rates, and distress migration reduction.',
      focusAreas: ['Rural Development', 'Socio-Economic Survey', 'MGNREGA Evaluation', 'Public Policy']
    },
    {
      title: 'A Critical Study on the Efficacy of Digital Public Services and E-Governance Delivery in Gram Panchayats: Citizen Satisfaction and Access Barriers',
      description: 'Field survey measuring Common Service Center (CSC) penetration, internet connectivity bottlenecks, citizen grievance redressal, and governance transparency.',
      focusAreas: ['E-Governance', 'Public Administration', 'Citizen Satisfaction', 'Rural Digitization']
    }
  ]
};

export class TopicEngine {
  /**
   * Generates a batch of unique academic project topics for a subject
   */
  static generateTopicsForSubject(subject: Subject, count: number = 6): Topic[] {
    const programKey = Object.keys(DISCIPLINE_TOPIC_TEMPLATES).find(
      (k) => k.toLowerCase() === subject.program.toLowerCase()
    ) || 'MBA';

    const templates = DISCIPLINE_TOPIC_TEMPLATES[programKey] || DISCIPLINE_TOPIC_TEMPLATES['MBA'];
    const nowIso = new Date().toISOString();
    const createdTopics: Topic[] = [];

    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      const uniqueSuffix = `[Cohort ${new Date().getFullYear()} - Empirical Study ${i + 1}]`;
      const topicId = `top_${subject.courseCode.toLowerCase().replace(/[^a-z0-9]/g, '')}_${crypto.randomBytes(4).toString('hex')}`;

      const newTopic: Topic = {
        id: topicId,
        subjectId: subject.id,
        courseCode: subject.courseCode,
        program: subject.program,
        title: `${template.title} ${i >= templates.length ? uniqueSuffix : ''}`.trim(),
        description: template.description,
        focusAreas: [...template.focusAreas],
        status: 'AVAILABLE',
        createdAt: nowIso,
        updatedAt: nowIso
      };

      db.saveTopic(newTopic);
      createdTopics.push(newTopic);
    }

    return createdTopics;
  }

  /**
   * Ensures that a subject has an active pool of available topics
   */
  static ensureTopicPool(courseCodeOrSubjectId: string, program: string): { subject: Subject; availableTopics: Topic[] } {
    let subject =
      db.getSubject(courseCodeOrSubjectId) ||
      db.getSubjects(program).find((s) => s.courseCode.toLowerCase() === courseCodeOrSubjectId.toLowerCase());

    const nowIso = new Date().toISOString();

    // Auto-create Subject if it does not exist
    if (!subject) {
      const cleanCode = courseCodeOrSubjectId.trim().toUpperCase();
      subject = {
        id: `subj_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        program: program || 'MBA',
        courseCode: cleanCode,
        subjectName: `${cleanCode} Project Dissertation & Research Work`,
        description: `Comprehensive research and academic project work for ${cleanCode} under ${program || 'IGNOU'}.`,
        creditCount: 6,
        hasProjectComponent: true,
        activeStatus: true,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      db.saveSubject(subject);
    }

    // Check available topics
    let availableTopics = db.getTopics({
      subjectId: subject.id,
      status: 'AVAILABLE'
    });

    // Also match by courseCode if subjectId mapping was loose
    if (availableTopics.length === 0) {
      availableTopics = db.getTopics({
        courseCode: subject.courseCode,
        status: 'AVAILABLE'
      });
    }

    // If pool is empty or exhausted, dynamically replenish with fresh unique topics
    if (availableTopics.length === 0) {
      availableTopics = this.generateTopicsForSubject(subject, 6);
    }

    return { subject, availableTopics };
  }

  /**
   * Atomically reserves an available topic for a student & subject.
   * Auto-replenishes if no topics are currently in the pool so that allocation never fails.
   */
  static async allocateTopic(
    studentId: string,
    courseCodeOrSubjectId: string,
    program: string
  ): Promise<{ success: boolean; topic?: Topic; message?: string }> {
    // Wait if another allocation is in flight
    while (isAllocating) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    isAllocating = true;
    try {
      const { subject, availableTopics } = this.ensureTopicPool(courseCodeOrSubjectId, program);

      if (!availableTopics || availableTopics.length === 0) {
        // Fallback emergency generation
        const freshTopic: Topic = {
          id: `top_gen_${crypto.randomBytes(6).toString('hex')}`,
          subjectId: subject.id,
          courseCode: subject.courseCode,
          program: subject.program,
          title: `Comprehensive Empirical Research and Investigation on ${subject.subjectName} Strategies in Modern Indian Industry`,
          description: `An in-depth academic study examining operational models, empirical survey data, statistical hypothesis testing, and strategic frameworks for ${subject.courseCode}.`,
          focusAreas: ['Empirical Analysis', 'Methodology', 'Statistical Modeling', 'Strategic Implementation'],
          status: 'RESERVED',
          allocatedToStudentId: studentId,
          reservedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        db.saveTopic(freshTopic);
        return { success: true, topic: freshTopic };
      }

      // Select first available topic
      const selectedTopic = availableTopics[0];

      // Mark as RESERVED atomically
      selectedTopic.status = 'RESERVED';
      selectedTopic.allocatedToStudentId = studentId;
      selectedTopic.reservedAt = new Date().toISOString();
      selectedTopic.updatedAt = new Date().toISOString();

      db.saveTopic(selectedTopic);

      return {
        success: true,
        topic: selectedTopic
      };
    } finally {
      isAllocating = false;
    }
  }

  /**
   * Finalizes a topic to USED after successful generation & 150+ page validation
   */
  static markTopicUsed(topicId: string, projectId: string) {
    const topic = db.getTopic(topicId);
    if (topic) {
      topic.status = 'USED';
      topic.allocatedToProjectId = projectId;
      topic.usedAt = new Date().toISOString();
      topic.updatedAt = new Date().toISOString();
      db.saveTopic(topic);
    }
  }

  /**
   * Releases a RESERVED topic back to AVAILABLE if generation failed or aborted
   */
  static releaseTopic(topicId: string) {
    const topic = db.getTopic(topicId);
    if (topic && topic.status === 'RESERVED') {
      topic.status = 'AVAILABLE';
      topic.allocatedToStudentId = undefined;
      topic.reservedAt = undefined;
      topic.updatedAt = new Date().toISOString();
      db.saveTopic(topic);
    }
  }
}

