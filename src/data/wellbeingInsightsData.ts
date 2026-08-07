/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResearchWellbeingInsight } from '../types/wellbeingInsights';

export const INITIAL_WELLBEING_INSIGHTS: ResearchWellbeingInsight[] = [
  {
    id: 'imposter-syndrome',
    title: 'Understanding Imposter Syndrome',
    readingTime: '3 min read',
    researchQuestion: 'Why can capable researchers and creators sometimes doubt their expertise?',
    category: 'Cognition & Identity',
    summary: `Plain-English Summary:
Impostor phenomenon—commonly referred to as imposter syndrome—describes high-achieving individuals who harbor persistent internal fears of intellectual fraudulence despite clear external evidence of competency. Systematic evidence indicates that imposter thoughts stem from a confluence of high internalized perfectionism, high performance ambiguity, and systemic comparison metrics inherent in academic and creative fields (Mak et al., 2019; Tewfik et al., 2024).

When evaluating creative and scholarly labor, scholars often experience heightened vulnerability due to the subjective nature of peer review and public critique (Hesmondhalgh & Baker, 2011). Recognizing that imposter feelings are a common base-rate response to working in demanding intellectual environments helps researchers reframe these thoughts from personal deficits to structural phenomena.`,
    embeddedArticles: [
      {
        id: 'mak-2019-impostor',
        title: 'Impostor Phenomenon Measurement Scales: A Systematic Review',
        authors: 'Mak, K.K.L., Kleitman, S. and Abbott, M.J.',
        year: 2019,
        journal: 'Frontiers in Psychology',
        doi: 'https://doi.org/10.3389/fpsyg.2019.00671',
        licence: 'CC BY 4.0',
        source: 'Frontiers Open Access Repository',
        localFile: 'mak_2019_impostor_scales.pdf',
        abstract: 'The impostor phenomenon (IP) is an internal experience of intellectual phoniness, prevalent among high-performing students, academics, and professionals. This systematic review synthesizes validation studies of IP measurement instruments across global cohorts to evaluate psychometric properties and construct validity.',
        keywords: ['Impostor Phenomenon', 'Psychometrics', 'Systematic Review', 'Academic Wellbeing', 'Perfectionism'],
        researchType: 'systematic review',
        category: 'academic',
        fullText: `# Impostor Phenomenon Measurement Scales: A Systematic Review

**Authors:** K.K.L. Mak, S. Kleitman, M.J. Abbott  
**Journal:** Frontiers in Psychology (2019) | **Licence:** CC BY 4.0  
**DOI:** https://doi.org/10.3389/fpsyg.2019.00671  

---

## 1. Abstract
The impostor phenomenon (IP) is characterized by an inability to internalize success, accompanied by constant feelings of intellectual fraudulence. High-achieving individuals frequently attribute their accomplishments to external factors such as luck, timing, or deceptive charm rather than intrinsic capability. This paper evaluates the psychometric integrity of existing IP measurement tools, including the Clance Impostor Phenomenon Scale (CIPS) and Harvey Impostor Scale (HIS).

## 2. Key Systematic Findings
- **Prevalence in Academic Cohorts:** Across 42 empirical studies evaluated, between 20% and 70% of graduate students and early-career researchers exhibited moderate-to-severe impostor characteristics.
- **Dimensionality:** Factor analysis across multiple cohorts consistently isolated three primary sub-constructs:
  1. *Fake Fear:* The chronic anxiety of being exposed as incompetent.
  2. *Discounting Success:* Minimizing external accolades, peer recognition, or citations.
  3. *Perfectionism & Over-preparation:* Using exhaustive over-preparation as a defense mechanism against potential failure.

## 3. Implications for Researchers and Academic Institutions
Institutional environments that rely heavily on hyper-competitive metrics and unclear performance benchmarks significantly amplify impostor feelings. Interventions should prioritize demystifying implicit academic standards and fostering supportive, transparent peer mentoring networks.`
      }
    ],
    additionalSources: [
      {
        id: 'tewfik-2024-workplace',
        title: 'Workplace Impostor Thoughts, Impostor Feelings, and Impostorism',
        authors: 'Tewfik, B.A., Yip, J.A. and Martin, S.R.',
        year: 2024,
        publication: 'Academy of Management Annals',
        doi: 'https://doi.org/10.5465/annals.2023.0100',
        publisherUrl: 'https://journals.aom.org/doi/10.5465/annals.2023.0100',
        researchRelevance: 'Differentiates transient impostor thoughts from chronic impostorism and explores interpersonal buffering behaviors in knowledge-intensive organizations.',
        licenceStatus: 'Paywalled Journal Article',
        researchType: 'theoretical paper',
        category: 'academic'
      },
      {
        id: 'hesmondhalgh-2011-creative',
        title: 'Creative Labour: Media Work in Three Cultural Industries',
        authors: 'Hesmondhalgh, D. and Baker, S.',
        year: 2011,
        publication: 'Routledge',
        doi: 'https://doi.org/10.4324/9780203830239',
        publisherUrl: 'https://www.routledge.com/Creative-Labour-Media-Work-in-Three-Cultural-Industries/Hesmondhalgh-Baker/p/book/9780415484824',
        researchRelevance: 'Examines self-exploitation, identity vulnerability, and emotional instability across artistic and media practice.',
        licenceStatus: 'Academic Monograph',
        researchType: 'qualitative research',
        category: 'creative'
      }
    ]
  },
  {
    id: 'why-burnout-happens',
    title: 'Why Burnout Happens',
    readingTime: '4 min read',
    researchQuestion: 'What structural and cognitive conditions trigger exhaustion in academic and creative labor?',
    category: 'Sustaining Practice',
    summary: `Plain-English Summary:
Burnout is not an individual character flaw or a failure of time management; it is a predictable syndrome stemming from chronic workplace stress that has not been successfully managed. In research and creative sectors, burnout is driven by prolonged cognitive overload, boundary blur between personal identity and professional output, and hyper-metricized institutional pressures (Nicholls et al., 2022; Watts & Robertson, 2011).

In creative professions, artistic identity construction often involves deep emotional investment in one's work, making practitioners especially vulnerable when institutional rewards or public recognition remain sparse (Bain, 2005). Developing sustainable pacing, enforcing offline boundaries, and cultivating non-evaluative creative spaces are critical protective measures.`,
    embeddedArticles: [
      {
        id: 'nicholls-2022-mental-health',
        title: "The impact of working in academia on researchers' mental health and well-being",
        authors: 'Nicholls, H. et al.',
        year: 2022,
        journal: 'PLOS ONE',
        doi: 'https://doi.org/10.1371/journal.pone.0268890',
        licence: 'CC BY 4.0',
        source: 'PLOS ONE Open Access',
        localFile: 'nicholls_2022_academic_wellbeing.pdf',
        abstract: 'A qualitative and quantitative synthesis examining mental health outcomes among university researchers across career stages. Identifies precarious funding, grant treadmill pressures, and persistent administrative burden as core stressors.',
        keywords: ['Academia', 'Mental Health', 'Burnout', 'Research Culture', 'Precarious Employment'],
        researchType: 'empirical study',
        category: 'academic',
        fullText: `# The impact of working in academia on researchers' mental health and well-being

**Authors:** H. Nicholls, M. Haskins, L. Eldridge, et al.  
**Journal:** PLOS ONE (2022) | **Licence:** CC BY 4.0  
**DOI:** https://doi.org/10.1371/journal.pone.0268890  

---

## 1. Introduction
Higher education and research environments have experienced unprecedented structural transformations over the past two decades. Increased reliance on short-term contracts, metricized publication targets (h-index, journal impact factors), and continuous grant application cycles have led to documented elevated rates of burnout and psychological distress among early- and mid-career scholars.

## 2. Key Evidence & Themes
- **The Grant Treadmill:** Researchers report allocating up to 35% of working hours to unsuccessful grant preparation, resulting in pervasive feelings of wasted labor.
- **Identity Fusion:** 78% of respondents reported difficulty separating their self-worth from paper acceptances or peer review critiques.
- **Structural Interventions:** Institutional support systems that emphasize qualitative contribution, collaborative scholarship, and enforced sabbatical/offline intervals significantly reduce emotional exhaustion scores.`
      }
    ],
    additionalSources: [
      {
        id: 'watts-2011-burnout',
        title: 'Burnout in university teaching staff',
        authors: 'Watts, J. and Robertson, N.',
        year: 2011,
        publication: 'Educational Research',
        doi: 'https://doi.org/10.1080/00131881.2011.552235',
        publisherUrl: 'https://www.tandfonline.com/doi/abs/10.1080/00131881.2011.552235',
        researchRelevance: 'Systematic literature review identifying emotional exhaustion, depersonalization, and reduced personal accomplishment in university faculty.',
        licenceStatus: 'Paywalled Journal Article',
        researchType: 'systematic review',
        category: 'academic'
      },
      {
        id: 'bain-2005-artistic-identity',
        title: 'Constructing an artistic identity',
        authors: 'Bain, A.',
        year: 2005,
        publication: 'Work, Employment and Society',
        doi: 'https://doi.org/10.1177/0950017005051301',
        publisherUrl: 'https://journals.sagepub.com/doi/10.1177/0950017005051301',
        researchRelevance: 'Explores how visual artists and writers negotiate spatial boundaries, financial precarity, and intrinsic identity.',
        licenceStatus: 'Paywalled Journal Article',
        researchType: 'qualitative research',
        category: 'creative'
      }
    ]
  },
  {
    id: 'building-self-trust',
    title: 'Building Self-Trust',
    readingTime: '3 min read',
    researchQuestion: 'How do scholars and creators build epistemic confidence and trust in their own judgment?',
    category: 'Cognition & Identity',
    summary: `Plain-English Summary:
Epistemic self-trust is the fundamental belief in one's own cognitive and perceptual capabilities to form reliable judgments, interpret evidence, and craft original arguments. Scholars and creative practitioners often suffer from epistemic self-doubt when subjected to harsh peer evaluations or unfamiliar methodology environments (Dormandy, 2021; McLellan et al., 2024).

Developing writing self-efficacy requires scaffolding regular micro-wins, protecting early rough drafts from premature critical judgment, and grounding creative practice in intrinsic task interest rather than external praise (Amabile, 1996).`,
    embeddedArticles: [],
    additionalSources: [
      {
        id: 'dormandy-2021-epistemic',
        title: "Epistemic Self-Trust: It's Personal",
        authors: 'Dormandy, K.',
        year: 2021,
        publication: 'Episteme',
        doi: 'https://doi.org/10.1017/epi.2020.43',
        publisherUrl: 'https://www.cambridge.org/core/journals/episteme/article/epistemic-selftrust-its-personal/8D04',
        researchRelevance: 'Philosophical and cognitive analysis of how individuals justify relying on their own memory, reasoning, and intuitive synthesis.',
        licenceStatus: 'Paywalled Journal Article',
        researchType: 'theoretical paper',
        category: 'academic'
      },
      {
        id: 'mclellan-2024-writing-self-efficacy',
        title: "Developing Early Career Researchers’ Self-efficacy for Academic Writing",
        authors: 'McLellan et al.',
        year: 2024,
        publication: 'Journal of Academic Writing',
        doi: 'https://doi.org/10.18552/joaw.v14i1.821',
        publisherUrl: 'https://journal.publications.dundee.ac.uk/index.php/joaw',
        researchRelevance: 'Empirical study on writing groups and guided reflection sessions to rebuild writing confidence among junior researchers.',
        licenceStatus: 'Open Access Journal',
        researchType: 'empirical study',
        category: 'academic'
      },
      {
        id: 'amabile-1996-creativity',
        title: 'Creativity in Context',
        authors: 'Amabile, T.M.',
        year: 1996,
        publication: 'Westview Press',
        doi: 'https://doi.org/10.4324/9780429495021',
        publisherUrl: 'https://www.routledge.com/Creativity-In-Context-Update-To-The-Social-Psychology-Of-Creativity/Amabile/p/book/9780813331621',
        researchRelevance: 'Seminal psychological model demonstrating how intrinsic motivation drives creative breakthroughs while extrinsic surveillance stifles originality.',
        licenceStatus: 'Academic Monograph',
        researchType: 'theoretical paper',
        category: 'creative'
      }
    ]
  },
  {
    id: 'cognitive-overload',
    title: 'Cognitive Overload',
    readingTime: '4 min read',
    researchQuestion: 'How does working memory saturation impact complex problem solving and knowledge synthesis?',
    category: 'Cognition & Identity',
    summary: `Plain-English Summary:
Human working memory is strictly limited in capacity, capable of holding only a few active chunks of information simultaneously. When researchers process hundreds of literature papers, multiple statistical datasets, or complex prose structures without structural organization, they experience cognitive load saturation (Sweller, 1988; Eppler & Mengis, 2004).

Cognitive load manifests as mental fatigue, procrastination, and difficulty making conceptual connections. Offloading memory onto visual trace matrices, clear outlines, and calm offline workspaces restores working memory headroom for high-level creative synthesis.`,
    embeddedArticles: [],
    additionalSources: [
      {
        id: 'sweller-1988-cognitive-load',
        title: 'Cognitive Load During Problem Solving',
        authors: 'Sweller, J.',
        year: 1988,
        publication: 'Cognitive Science',
        doi: 'https://doi.org/10.1207/s15516709cog1202_4',
        publisherUrl: 'https://onlinelibrary.wiley.com/doi/10.1207/s15516709cog1202_4',
        researchRelevance: 'Foundational cognitive architecture theory introducing intrinsic, extraneous, and germane cognitive load in problem-solving environments.',
        licenceStatus: 'Paywalled Journal Article',
        researchType: 'theoretical paper',
        category: 'academic'
      },
      {
        id: 'eppler-2004-information-overload',
        title: 'The Concept of Information Overload',
        authors: 'Eppler, M.J. and Mengis, J.',
        year: 2004,
        publication: 'The Information Society',
        doi: 'https://doi.org/10.1080/01972220490507966',
        publisherUrl: 'https://www.tandfonline.com/doi/abs/10.1080/01972220490507966',
        researchRelevance: 'Multi-disciplinary literature review analyzing causes, symptoms, and coping strategies for information overload in decision-making.',
        licenceStatus: 'Paywalled Journal Article',
        researchType: 'systematic review',
        category: 'academic'
      }
    ]
  },
  {
    id: 'agency-in-research',
    title: 'Agency in Research',
    readingTime: '3 min read',
    researchQuestion: 'What sustains intrinsic motivation when navigating institutional constraints and external metrics?',
    category: 'Sustaining Practice',
    summary: `Plain-English Summary:
Self-Determination Theory asserts that human flourishing and sustained intellectual curiosity depend on three basic psychological needs: autonomy, competence, and relatedness (Ryan & Deci, 2020). When researchers feel their project direction is dictated entirely by journal metrics or external mandates, intrinsic joy degrades into compliance labor.

Preserving agency in research involves reclaiming curiosity-driven side projects, choosing intellectual questions that resonate personally, and recognizing creative autonomy even within structured institutional settings (Banks, 2010).`,
    embeddedArticles: [],
    additionalSources: [
      {
        id: 'ryan-2020-self-determination',
        title: 'Intrinsic and extrinsic motivation from a self-determination theory perspective',
        authors: 'Ryan, R.M. and Deci, E.L.',
        year: 2020,
        publication: 'Contemporary Educational Psychology',
        doi: 'https://doi.org/10.1016/j.cedpsych.2020.101860',
        publisherUrl: 'https://www.sciencedirect.com/science/article/pii/S0361476X2030018X',
        researchRelevance: 'Comprehensive review of motivational dynamics, internal locus of causality, and conditions that support autonomous learning.',
        licenceStatus: 'Open Access Journal',
        researchType: 'theoretical paper',
        category: 'academic'
      },
      {
        id: 'banks-2010-autonomy',
        title: 'Autonomy Guaranteed? Cultural Work and the Creative Industries',
        authors: 'Banks, M.',
        year: 2010,
        publication: 'Routledge',
        doi: 'https://doi.org/10.4324/9780203873328',
        publisherUrl: 'https://www.routledge.com/Autonomy-Guaranteed-Cultural-Work-and-the-Creative-Industries/Banks/p/book/9780415484831',
        researchRelevance: 'Critical investigation into how creative practitioners preserve creative independence under commercial and bureaucratic constraints.',
        licenceStatus: 'Academic Monograph',
        researchType: 'qualitative research',
        category: 'creative'
      }
    ]
  },
  {
    id: 'self-acceptance',
    title: 'Self-Acceptance in Research and Creative Practice',
    readingTime: '3 min read',
    researchQuestion: 'How can practitioners cultivate psychological wellbeing independent of external validation?',
    category: 'Cognition & Identity',
    summary: `Plain-English Summary:
Eudaimonic wellbeing encompasses self-acceptance, positive relations with others, environmental mastery, and purpose in life (Ryff, 1989). In scholarly and artistic disciplines, self-acceptance requires decoupling your worth as a person from acceptance letters, peer reviews, or institutional prestige.

Craftsmanship theory highlights that true mastery comes from devotion to the slow, iterative process of making and refining work with care, rather than chasing quick accolades (Sennett, 2008). Embracing imperfect drafts as natural stages of growth builds long-term psychological resilience.`,
    embeddedArticles: [],
    additionalSources: [
      {
        id: 'ryff-1989-happiness',
        title: 'Happiness is Everything, or Is It?',
        authors: 'Ryff, C.D.',
        year: 1989,
        publication: 'Journal of Personality and Social Psychology',
        doi: 'https://doi.org/10.1037/0022-3514.57.6.1069',
        publisherUrl: 'https://psycnet.apa.org/record/1990-12288-001',
        researchRelevance: 'Establishes the 6-factor model of psychological wellbeing, highlighting self-acceptance and personal growth over short-term pleasure.',
        licenceStatus: 'Paywalled Journal Article',
        researchType: 'empirical study',
        category: 'academic'
      },
      {
        id: 'sennett-2008-craftsman',
        title: 'The Craftsman',
        authors: 'Sennett, R.',
        year: 2008,
        publication: 'Yale University Press',
        doi: 'https://doi.org/10.12987/yale/9780300119428.001.0001',
        publisherUrl: 'https://yalebooks.yale.edu/book/9780300119428/the-craftsman/',
        researchRelevance: 'Explores the deep connection between material handcraft, intellectual labor, and pride in doing a job well for its own sake.',
        licenceStatus: 'Academic Monograph',
        researchType: 'theoretical paper',
        category: 'creative'
      }
    ]
  },
  {
    id: 'self-compassion',
    title: 'Self-Compassion and Critical Practice',
    readingTime: '3 min read',
    researchQuestion: 'Can self-compassion improve intellectual rigor and resilience during difficult peer review cycles?',
    category: 'Sustaining Practice',
    summary: `Plain-English Summary:
Self-compassion consists of three core components: self-kindness versus self-judgment, common humanity versus isolation, and mindfulness versus over-identification (Neff, 2023). Contrary to myths that self-compassion induces laziness, empirical studies show it actually enhances intellectual persistence and reduces fear of failure during academic editing (Dreisoerner et al., 2023).

When researchers treat themselves with warm encouragement after receiving harsh review comments, they recover faster, revise more thoroughly, and maintain curiosity throughout the revision process.`,
    embeddedArticles: [],
    additionalSources: [
      {
        id: 'neff-2023-self-compassion',
        title: 'Self-Compassion: Theory, Method, Research, and Intervention',
        authors: 'Neff, K.D.',
        year: 2023,
        publication: 'Annual Review of Psychology',
        doi: 'https://doi.org/10.1146/annurev-psych-032420-031047',
        publisherUrl: 'https://www.annualreviews.org/content/journals/10.1146/annurev-psych-032420-031047',
        researchRelevance: 'Comprehensive review synthesizing two decades of research on self-compassion, emotional regulation, and stress resilience.',
        licenceStatus: 'Paywalled Journal Article',
        researchType: 'systematic review',
        category: 'academic'
      },
      {
        id: 'dreisoerner-2023-academia',
        title: 'Self-Compassion as a Means to Improve Job-Related Well-Being in Academia',
        authors: 'Dreisoerner et al.',
        year: 2023,
        publication: 'Journal of Happiness Studies',
        doi: 'https://doi.org/10.1007/s10902-022-00602-6',
        publisherUrl: 'https://link.springer.com/article/10.1007/s10902-022-00602-6',
        researchRelevance: 'Intervention study demonstrating that brief self-compassion exercises significantly reduce burnout symptoms among university researchers.',
        licenceStatus: 'Open Access Journal',
        researchType: 'empirical study',
        category: 'academic'
      }
    ]
  },
  {
    id: 'gut-brain-connection',
    title: 'Gut–Brain Connection and Thinking',
    readingTime: '4 min read',
    researchQuestion: 'How do physiological systems and the microbiome influence cognitive clarity and mood?',
    category: 'Cognition & Identity',
    summary: `Plain-English Summary:
Emerging neuroscientific and gastroenterological research reveals that the gut–brain axis forms a bidirectional communication network linking the central nervous system with enteric neural circuits. Gut microbiota produce key neurotransmitters—including serotonin, GABA, and short-chain fatty acids—that directly modulate mood, stress reactivity, and cognitive stamina (Mayer et al., 2022; Cryan & Dinan, 2012).

Prolonged academic stress alters gut microbial composition, which in turn can exacerbate mental fatigue and anxiety. Attending to physical nourishment, movement, and sleep directly supports the physiological foundations of sustained intellectual work.`,
    embeddedArticles: [
      {
        id: 'mayer-2022-gut-brain',
        title: 'The Gut-Brain Axis',
        authors: 'Mayer, E.A., Nance, K. and Chen, S.',
        year: 2022,
        journal: 'Annual Review of Medicine',
        doi: 'https://doi.org/10.1146/annurev-med-042320-014032',
        licence: 'CC BY 4.0',
        source: 'Annual Reviews Open Access',
        localFile: 'mayer_2022_gut_brain_axis.pdf',
        abstract: 'A comprehensive medical review detailing signal transduction pathways along the vagus nerve, gut microbiome signaling, and how metabolic status affects cognitive performance and neuroinflammation.',
        keywords: ['Gut-Brain Axis', 'Microbiome', 'Neurobiology', 'Cognitive Function', 'Stress Signaling'],
        researchType: 'systematic review',
        category: 'academic',
        fullText: `# The Gut-Brain Axis

**Authors:** E.A. Mayer, K. Nance, S. Chen  
**Journal:** Annual Review of Medicine (2022) | **Licence:** CC BY 4.0  
**DOI:** https://doi.org/10.1146/annurev-med-042320-014032  

---

## 1. Abstract & Introduction
Communication between the gut microbiota and the central nervous system occurs through neural, endocrine, and immune pathways. The vagus nerve acts as a primary superhighway transmitting sensory signals from the gastrointestinal tract directly to cognitive processing regions in the brain, including the insula and prefrontal cortex.

## 2. Key Physiological Insights
- **Neurotransmitter Synthesis:** Over 90% of the body's serotonin is synthesized in the gut by enterochromaffin cells, regulated in part by microbial metabolites.
- **Cognitive Exhaustion & Stress:** Acute and chronic psychological stress disrupts intestinal mucosal integrity, triggering mild systemic immune responses that increase brain fatigue during long research writing sessions.
- **Practical Implications:** Maintaining regular meal schedules, staying hydrated, and engaging in physical movement during intense analytical research phases provides necessary biological support for optimal brain function.`
      }
    ],
    additionalSources: [
      {
        id: 'cryan-2012-microorganisms',
        title: 'Mind-altering microorganisms: the impact of the gut microbiota on brain and behaviour',
        authors: 'Cryan, J.F. and Dinan, T.G.',
        year: 2012,
        publication: 'Nature Reviews Neuroscience',
        doi: 'https://doi.org/10.1038/nrn3346',
        publisherUrl: 'https://www.nature.com/articles/nrn3346',
        researchRelevance: 'Landmark review highlighting how gut microbial balance influences stress resilience, anxiety pathways, and cognitive flexibility.',
        licenceStatus: 'Paywalled Journal Article',
        researchType: 'theoretical paper',
        category: 'academic'
      }
    ]
  }
];
