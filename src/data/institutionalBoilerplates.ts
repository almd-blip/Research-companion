/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InstitutionalBoilerplate {
  id: string;
  title: string;
  category: 'Facilities & Environment' | 'Data Management (DMP)' | 'Ethics & Governance' | 'DEIA & Mentorship' | 'Impact & Dissemination' | 'Project Administration';
  iconName: string;
  summary: string;
  tags: string[];
  content: string;
}

export const INSTITUTIONAL_BOILERPLATES: InstitutionalBoilerplate[] = [
  {
    id: 'hpc-computational-facilities',
    title: 'HPC & Computational Infrastructure',
    category: 'Facilities & Environment',
    iconName: 'Cpu',
    summary: 'High-performance computing clusters, GPU nodes, secure virtualization, and dedicated sysadmin support.',
    tags: ['Computing', 'Facilities', 'GPU/AI', 'Storage', 'Infrastructure'],
    content: `INSTITUTIONAL COMPUTING & CYBERINFRASTRUCTURE:

1. High-Performance Computing (HPC) Resources:
The research team will leverage the [Institution Name] High-Performance Computing Center ([HPC Center Name]), which provides over [X,XXX] CPU cores, [XXX] NVIDIA [A100/H100] Tensor Core GPUs, and [X.X] PFLOPS of aggregate compute capacity. The cluster operates a Slurm-managed batch queue supporting both multi-node MPI and distributed deep learning workloads.

2. High-Throughput Storage Architecture:
Primary storage is backed by a redundant GPFS/Lustre parallel filesystem providing [XX] PB of scratch storage with sustained throughput exceeding [XX] GB/s, alongside an encrypted Tier-1 research data storage repository offering automated off-site snapshots, ZFS checksumming, and 99.999% data durability.

3. Virtualization & Containerization:
The institution supports Singularity/Apptainer and Docker-based containerized environments, ensuring exact runtime reproducibility, software dependency lockdown, and hardware acceleration pass-through.

4. Technical Support & System Administration:
The facility is maintained 24/7 by [X] full-time PhD-level research software engineers and systems administrators providing dedicated assistance with workflow parallelization, code profiling, and automated pipeline deployment.`,
  },
  {
    id: 'core-lab-instrumentation',
    title: 'Core Laboratory & Analytical Instrumentation',
    category: 'Facilities & Environment',
    iconName: 'Building2',
    summary: 'Shared core analytical facilities, spectrometry, imaging suites, cleanrooms, and maintenance protocols.',
    tags: ['Laboratory', 'Instrumentation', 'Imaging', 'Shared Core'],
    content: `RESEARCH ENVIRONMENT & CORE LABORATORY FACILITIES:

1. Dedicated Laboratory Space:
The Principal Investigator's laboratory at [Institution Name] occupies [XXX] sq ft of modern, climate-controlled research space in the [Department/Building Name], fully equipped with fume hoods, biosafety cabinets (BSL-2 certified), vibration-isolated optical tables, and regulated gas/cryogenic lines.

2. Shared Core Research Facilities:
The project will access [Institution Name]'s Central Research Facility suites, including:
- Advanced Microscopy & Imaging Suite: Confocal laser scanning, SEM/TEM electron microscopy, and super-resolution STED imaging.
- Analytical Spectroscopy & Chromatography: High-resolution LC-MS/MS, 600 MHz NMR spectrometer, ICP-OES, and HPLC systems.
- Prototyping & Fabrication: ISO Class 5/6 cleanroom suites, laser micro-machining, and high-precision additive manufacturing.

3. Equipment Maintenance & Calibration:
All instruments operate under certified preventive maintenance contracts with scheduled daily calibration against NIST-traceable standards. Access is managed through an electronic reservation and logging system with automated QC audit logs.`,
  },
  {
    id: 'fair-data-management-plan',
    title: 'FAIR Data Management & Archiving (DMP)',
    category: 'Data Management (DMP)',
    iconName: 'Database',
    summary: 'Comprehensive FAIR-compliant research data lifecycle, metadata schemas, open repository deposit, and preservation.',
    tags: ['DMP', 'FAIR Data', 'Open Access', 'Repositories', 'Metadata'],
    content: `DATA MANAGEMENT PLAN (FAIR COMPLIANCE):

1. Data Generation & Formats (Findable & Interoperable):
All primary data generated under this project will be recorded in standardized, non-proprietary formats (e.g., CSV, JSON-LD, HDF5, OME-TIFF) accompanied by rich metadata conforming to Dublin Core and domain-specific ontologies. Each dataset will be indexed with a persistent Digital Object Identifier (DOI).

2. Data Storage, Backup & Security (Accessible):
Active research data will reside on [Institution Name]'s enterprise storage system with AES-256 encryption at rest and TLS 1.3 encryption in transit. Automated daily incremental backups and weekly off-site geographically redundant mirrors will prevent data loss. Access is restricted via role-based Multi-Factor Authentication (MFA).

3. Long-Term Preservation & Open Dissemination (Reusable):
Upon publication or project completion (whichever is earlier), curated datasets, analysis scripts, and workflow descriptions will be deposited into the institutional repository ([Institutional Dataverse/Zenodo]) under an open Creative Commons (CC-BY 4.0 / CC0) license. Data will be preserved for a minimum of 10 years in compliance with funder and institutional mandates.

4. Roles & Responsibilities:
The Principal Investigator ([PI Name]) will oversee the execution of this DMP, ensuring annual data integrity audits and compliance with institutional research data stewardship policies.`,
  },
  {
    id: 'data-privacy-gdpr-security',
    title: 'Data Privacy, Security & GDPR/HIPAA Compliance',
    category: 'Data Management (DMP)',
    iconName: 'ShieldCheck',
    summary: 'Pseudonymization protocols, encrypted enclave storage, access control, GDPR/HIPAA compliance, and participant confidentiality.',
    tags: ['Privacy', 'GDPR', 'Security', 'Confidentiality', 'Human Data'],
    content: `DATA PRIVACY, INFORMATION SECURITY & COMPLIANCE STATEMENT:

1. Regulatory Framework:
All research data handling protocols comply strictly with institutional information security policies, the European General Data Protection Regulation (GDPR / UK GDPR), and relevant national data protection acts.

2. De-Identification & Pseudonymization:
Direct personal identifiers will be decoupled from research measurements immediately upon collection and replaced with cryptographic master linkage keys stored in a separate, air-gapped, access-restricted master lookup table.

3. Secure Research Enclave:
Sensitive data will be analyzed exclusively within a secure, ISO 27001-certified virtual research environment (VRE). Data egress controls prevent unvetted export of raw participant metrics. All endpoints require hardware-backed FIDO2 multi-factor authentication.

4. Data Retention & Destruction:
De-identified research outputs will be retained according to institutional policy for [X] years post-project, after which digital media will undergo cryptographic erasure compliant with NIST SP 800-88 standards.`,
  },
  {
    id: 'irb-human-subjects-ethics',
    title: 'Human Subjects & IRB Ethics Protocol',
    category: 'Ethics & Governance',
    iconName: 'ShieldCheck',
    summary: 'Institutional Review Board approval pipeline, informed consent protocols, risk mitigation, and participant safeguarding.',
    tags: ['IRB', 'Ethics', 'Human Subjects', 'Consent', 'Safety'],
    content: `HUMAN SUBJECTS RESEARCH & ETHICS GOVERNANCE:

1. Institutional Review Board (IRB / Ethics Committee) Oversight:
All study protocols, recruitment materials, and survey instruments will be submitted to the [Institution Name] Institutional Review Board (IRB # [IRB Number/Pending]) prior to participant recruitment. No empirical work involving human participants will proceed without formal unconditional ethics clearance.

2. Informed Consent Procedures:
Informed consent will be collected electronically or in writing using plain-language information sheets detailing study objectives, procedural time commitments, voluntary participation, and the right to withdraw at any stage without prejudice or penalty.

3. Risk Assessment & Vulnerable Population Safeguards:
The physical and psychological risks associated with this protocol are classified as [Minimal Risk / Low Risk]. Safeguards include debriefing sessions, anonymized response collectors, and dedicated contact channels with the institutional research integrity officer.

4. Incident Reporting:
Any unanticipated adverse event or protocol deviation will be formally reported to the IRB chair within 48 hours in accordance with institutional standard operating procedures.`,
  },
  {
    id: 'deia-broadening-participation',
    title: 'Diversity, Equity, Inclusion & Accessibility (DEIA)',
    category: 'DEIA & Mentorship',
    iconName: 'Users',
    summary: 'Institutional DEIA commitments, inclusive recruitment pipelines, mentorship for underrepresented groups, and accessible lab spaces.',
    tags: ['DEIA', 'Inclusion', 'Broadening Participation', 'Mentorship', 'Equity'],
    content: `DIVERSITY, EQUITY, INCLUSION & ACCESSIBILITY (DEIA) PLAN:

1. Institutional Commitment & Policy:
[Institution Name] holds an active [Athena SWAN Gold/Silver / Race Equality Charter / NSF ADVANCE] award and enforces comprehensive non-discrimination, anti-harassment, and equal-opportunity employment policies across all research faculties.

2. Broadening Participation & Recruitment:
The project will actively recruit graduate researchers and postdoctoral scholars through targeted outreach partnerships with historically underrepresented academic networks, regional minority-serving programs, and affinity groups (e.g., Women in Science, SACNAS, NSBE).

3. Inclusive Mentorship & Retention:
All lab personnel will participate in annual unconscious bias and inclusive leadership workshops. Research mentees will receive structured Individual Development Plans (IDPs) and direct sponsorship to attend premier international conferences and networking symposia.

4. Physical & Digital Accessibility:
All digital tools, experimental software, and published materials developed during this grant will conform to WCAG 2.1 AA accessibility standards, supporting screen readers, keyboard-only navigation, and high-contrast visual modes.`,
  },
  {
    id: 'postdoc-graduate-mentoring',
    title: 'Postdoctoral & Early-Career Mentoring Plan',
    category: 'DEIA & Mentorship',
    iconName: 'Users',
    summary: 'Individual development plans (IDP), career milestones, grant writing guidance, teaching opportunities, and scholarly independence.',
    tags: ['Postdoc', 'Mentoring', 'Career Development', 'IDP', 'Training'],
    content: `POSTDOCTORAL RESEARCHER & GRADUATE MENTORING PLAN:

1. Structured Individual Development Plans (IDPs):
Within the first 30 days of appointment, the Postdoctoral Scholar and Principal Investigator will co-author a tailored IDP based on the FASEB/myIDP framework, identifying technical research objectives, grant writing targets, and pedagogical goals. Progress will be reviewed quarterly.

2. Professional Development & Grant Writing:
The mentee will receive dedicated instruction in grant writing, peer review mechanics, and laboratory budget management. They will be encouraged and mentored to submit independent fellowship applications (e.g., ERC Starting Grant, NIH K99/R00, NSF Postdoctoral Fellowship).

3. Scholarly Authorship & Presentation:
The postdoctoral researcher will receive primary first-author attribution on projects they lead and will represent the laboratory at at least [X] international conferences annually with institutional travel support.

4. Research Integrity & Responsible Conduct:
The mentee will complete the institutional Responsible Conduct of Research (RCR) curriculum covering data stewardship, authorship ethics, reproducible analysis workflows, and conflict of interest management.`,
  },
  {
    id: 'dissemination-knowledge-exchange',
    title: 'Knowledge Exchange, Dissemination & Outreach',
    category: 'Impact & Dissemination',
    iconName: 'Globe',
    summary: 'Open-access publishing, policy engagement briefs, industrial translation, public science outreach, and media channels.',
    tags: ['Impact', 'Dissemination', 'Policy', 'Open Access', 'Outreach'],
    content: `DISSEMINATION, KNOWLEDGE EXCHANGE & SOCIETAL IMPACT:

1. Diamond / Gold Open Access Publishing:
All scholarly publications resulting from this award will be made immediately accessible upon acceptance under Gold or Diamond Open Access (CC-BY) licenses, supported by [Institution Name]'s Open Access Block Grant and institutional repository archiving.

2. Policy Engagement & Policy Briefs:
In partnership with the [Institution Policy Institute / Knowledge Exchange Office], the project will translate empirical findings into digestible 2-page Policy Briefs and executive summaries targeted at government agencies, regulatory bodies, and non-governmental stakeholders.

3. Industry Partnerships & Technology Transfer:
Project IP will be managed in collaboration with the [Institution Name] Technology Transfer Office (TTO) to facilitate patent filings, open-source permissive licensing, and industry demonstration workshops.

4. Public Outreach & Science Communication:
The research team will host annual community open labs, author accessible blog articles, and publish interactive data visualizations to communicate the societal value of the research to the broader public.`,
  },
  {
    id: 'institutional-governance-administration',
    title: 'Project Governance & Sponsored Programs Administration',
    category: 'Project Administration',
    iconName: 'Building2',
    summary: 'Institutional Office of Sponsored Projects oversight, financial audit readiness, milestone tracking, and risk management.',
    tags: ['Governance', 'Administration', 'Audit', 'OSP', 'Milestones'],
    content: `PROJECT GOVERNANCE & INSTITUTIONAL ADMINISTRATIVE CAPACITY:

1. Office of Sponsored Projects (OSP) Oversight:
[Institution Name]'s Office of Sponsored Programs manages over $[XXX]M in active competitive research awards, providing dedicated pre-award and post-award administrative teams, automated cost-tracking dashboards, and full compliance with federal/international grant conditions.

2. Financial Accountability & Audit Readiness:
Grant expenditures are governed by automated ERP financial controls with mandatory double-sign-off protocols. The institution undergoes annual independent Single Audits (Uniform Guidance / A-133 equivalent) with clean unqualified audit opinions.

3. Advisory Steering Committee:
A project Advisory Steering Committee comprising the PI, [Co-PIs], and [X] independent external domain experts will convene biannually to evaluate project progress against stated Gantt milestones, deliverables, and budget burn rates.

4. Risk Mitigation & Contingency Protocols:
Key operational risks (technical hurdles, staffing transitions, supply chain delays) are tracked in a living Risk Matrix with predefined alternate methodology pathways to ensure timely completion of all proposed work packages.`,
  },
];
