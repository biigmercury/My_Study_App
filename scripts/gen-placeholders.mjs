import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const ROOT = join(process.cwd(), 'content')

const courses = [
  { code: 'ges103', topics: [
    { slug: 'forms-of-government', title: 'Forms of Government', duration: '25 min', difficulty: 'beginner' },
    { slug: 'nigerian-constitution', title: 'The Nigerian Constitution', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'federalism-in-nigeria', title: 'Federalism in Nigeria', duration: '20 min', difficulty: 'intermediate' },
    { slug: 'economic-systems', title: 'Economic Systems', duration: '25 min', difficulty: 'beginner' },
    { slug: 'democracy-and-governance', title: 'Democracy and Governance', duration: '20 min', difficulty: 'beginner' },
    { slug: 'human-rights', title: 'Human Rights and Fundamental Freedoms', duration: '25 min', difficulty: 'intermediate' },
    { slug: 'civil-society', title: 'Civil Society and NGOs', duration: '20 min', difficulty: 'intermediate' },
    { slug: 'public-policy', title: 'Public Policy Making Process', duration: '30 min', difficulty: 'advanced' },
  ]},
  { code: 'gst212', topics: [
    { slug: 'nature-of-philosophy', title: 'The Nature of Philosophy', duration: '20 min', difficulty: 'beginner' },
    { slug: 'logic-and-arguments', title: 'Logic and Arguments', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'human-existence-and-meaning', title: 'Human Existence and Meaning', duration: '25 min', difficulty: 'intermediate' },
    { slug: 'epistemology', title: 'Epistemology: Knowledge and Truth', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'ethics-and-morality', title: 'Ethics and Morality', duration: '25 min', difficulty: 'intermediate' },
    { slug: 'political-philosophy', title: 'Political Philosophy', duration: '25 min', difficulty: 'advanced' },
    { slug: 'african-philosophy', title: 'African Philosophy', duration: '20 min', difficulty: 'intermediate' },
    { slug: 'philosophy-of-mind', title: 'Philosophy of Mind', duration: '30 min', difficulty: 'advanced' },
  ]},
  { code: 'uiges201', topics: [
    { slug: 'communication-skills', title: 'Communication Skills', duration: '20 min', difficulty: 'beginner' },
    { slug: 'academic-writing', title: 'Academic Writing', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'critical-thinking', title: 'Critical Thinking', duration: '25 min', difficulty: 'intermediate' },
    { slug: 'library-research-skills', title: 'Library and Research Skills', duration: '20 min', difficulty: 'beginner' },
    { slug: 'nigerian-history-and-culture', title: 'Nigerian History and Culture', duration: '30 min', difficulty: 'beginner' },
    { slug: 'use-of-english', title: 'Use of English', duration: '25 min', difficulty: 'beginner' },
    { slug: 'study-skills', title: 'Study Skills and Learning Strategies', duration: '20 min', difficulty: 'beginner' },
    { slug: 'time-management', title: 'Time Management for Academic Success', duration: '15 min', difficulty: 'beginner' },
  ]},
  { code: 'ent211', topics: [
    { slug: 'entrepreneurship-fundamentals', title: 'Entrepreneurship Fundamentals', duration: '25 min', difficulty: 'beginner' },
    { slug: 'business-plan-development', title: 'Business Plan Development', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'innovation-and-creativity', title: 'Innovation and Creativity', duration: '25 min', difficulty: 'intermediate' },
    { slug: 'market-research', title: 'Market Research and Validation', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'funding-and-finance', title: 'Funding and Finance for Startups', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'lean-startup-methodology', title: 'Lean Startup Methodology', duration: '25 min', difficulty: 'intermediate' },
    { slug: 'intellectual-property', title: 'Intellectual Property', duration: '20 min', difficulty: 'intermediate' },
    { slug: 'scaling-a-business', title: 'Scaling a Business', duration: '25 min', difficulty: 'advanced' },
  ]},
  { code: 'ift211', topics: [
    { slug: 'binary-number-systems', title: 'Binary Number Systems', duration: '25 min', difficulty: 'beginner' },
    { slug: 'logic-gates-and-boolean-algebra', title: 'Logic Gates and Boolean Algebra', duration: '35 min', difficulty: 'beginner' },
    { slug: 'combinational-circuits', title: 'Combinational Circuits', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'sequential-circuits', title: 'Sequential Circuits', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'flip-flops-and-latches', title: 'Flip-Flops and Latches', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'karnaugh-maps', title: 'Karnaugh Maps (K-Maps)', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'arithmetic-circuits', title: 'Arithmetic Circuits', duration: '35 min', difficulty: 'advanced' },
    { slug: 'memory-and-registers', title: 'Memory and Registers', duration: '30 min', difficulty: 'advanced' },
  ]},
  { code: 'ift302', topics: [
    { slug: 'html5-fundamentals', title: 'HTML5 Fundamentals', duration: '30 min', difficulty: 'beginner' },
    { slug: 'css3-and-responsive-design', title: 'CSS3 and Responsive Design', duration: '40 min', difficulty: 'beginner' },
    { slug: 'javascript-essentials', title: 'JavaScript Essentials', duration: '45 min', difficulty: 'intermediate' },
    { slug: 'dom-manipulation', title: 'DOM Manipulation', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'nodejs-and-express', title: 'Node.js and Express', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'rest-apis', title: 'REST APIs', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'databases-for-web', title: 'Databases for Web Apps', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'deployment-and-devops', title: 'Deployment and DevOps Basics', duration: '30 min', difficulty: 'advanced' },
  ]},
  { code: 'cos201', topics: [
    { slug: 'introduction-to-c-programming', title: 'Introduction to C Programming', duration: '30 min', difficulty: 'beginner' },
    { slug: 'variables-data-types-operators', title: 'Variables, Data Types and Operators', duration: '35 min', difficulty: 'beginner' },
    { slug: 'control-flow-structures', title: 'Control Flow Structures', duration: '40 min', difficulty: 'beginner' },
    { slug: 'functions-in-c', title: 'Functions in C', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'arrays-and-strings', title: 'Arrays and Strings', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'pointers-fundamentals', title: 'Pointers — The Fundamentals', duration: '45 min', difficulty: 'intermediate' },
    { slug: 'file-io-in-c', title: 'File I/O in C', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'structs-and-unions', title: 'Structs and Unions', duration: '30 min', difficulty: 'advanced' },
  ]},
  { code: 'cos202', topics: [
    { slug: 'oop-with-cpp', title: 'OOP with C++ — Introduction', duration: '30 min', difficulty: 'beginner' },
    { slug: 'classes-and-objects', title: 'Classes and Objects', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'inheritance-and-polymorphism', title: 'Inheritance and Polymorphism', duration: '45 min', difficulty: 'intermediate' },
    { slug: 'templates-and-stl', title: 'Templates and the STL', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'exception-handling', title: 'Exception Handling', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'operator-overloading', title: 'Operator Overloading', duration: '35 min', difficulty: 'advanced' },
    { slug: 'file-handling-cpp', title: 'File Handling in C++', duration: '25 min', difficulty: 'intermediate' },
    { slug: 'design-patterns-intro', title: 'Introduction to Design Patterns', duration: '40 min', difficulty: 'advanced' },
  ]},
  { code: 'mth201', topics: [
    { slug: 'complex-numbers', title: 'Complex Numbers', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'vectors-and-vector-algebra', title: 'Vectors and Vector Algebra', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'partial-derivatives', title: 'Partial Derivatives', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'multiple-integrals', title: 'Multiple Integrals', duration: '45 min', difficulty: 'advanced' },
    { slug: 'line-and-surface-integrals', title: 'Line and Surface Integrals', duration: '45 min', difficulty: 'advanced' },
    { slug: 'fourier-series', title: 'Fourier Series', duration: '40 min', difficulty: 'advanced' },
    { slug: 'laplace-transforms', title: 'Laplace Transforms', duration: '40 min', difficulty: 'advanced' },
    { slug: 'matrix-algebra', title: 'Matrix Algebra', duration: '35 min', difficulty: 'intermediate' },
  ]},
  { code: 'mth202', topics: [
    { slug: 'first-order-odes', title: 'First-Order ODEs', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'second-order-linear-odes', title: 'Second-Order Linear ODEs', duration: '45 min', difficulty: 'intermediate' },
    { slug: 'laplace-transform-method', title: 'Laplace Transform Method', duration: '45 min', difficulty: 'advanced' },
    { slug: 'systems-of-odes', title: 'Systems of ODEs', duration: '40 min', difficulty: 'advanced' },
    { slug: 'power-series-solutions', title: 'Power Series Solutions', duration: '40 min', difficulty: 'advanced' },
    { slug: 'partial-differential-equations-intro', title: 'Introduction to PDEs', duration: '35 min', difficulty: 'advanced' },
    { slug: 'boundary-value-problems', title: 'Boundary Value Problems', duration: '40 min', difficulty: 'advanced' },
    { slug: 'numerical-methods-for-odes', title: 'Numerical Methods for ODEs', duration: '35 min', difficulty: 'advanced' },
  ]},
  { code: 'csc203', topics: [
    { slug: 'sets-and-set-operations', title: 'Sets and Set Operations', duration: '30 min', difficulty: 'beginner' },
    { slug: 'propositional-logic', title: 'Propositional Logic', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'graph-theory-fundamentals', title: 'Graph Theory Fundamentals', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'relations-and-functions', title: 'Relations and Functions', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'mathematical-induction', title: 'Mathematical Induction', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'combinatorics', title: 'Combinatorics and Counting', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'trees-and-spanning-trees', title: 'Trees and Spanning Trees', duration: '35 min', difficulty: 'advanced' },
    { slug: 'boolean-algebra', title: 'Boolean Algebra', duration: '30 min', difficulty: 'intermediate' },
  ]},
  { code: 'sen201', topics: [
    { slug: 'software-development-lifecycle', title: 'Software Development Lifecycle (SDLC)', duration: '35 min', difficulty: 'beginner' },
    { slug: 'requirements-engineering', title: 'Requirements Engineering', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'software-design-principles', title: 'Software Design Principles', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'uml-diagrams', title: 'UML Diagrams', duration: '45 min', difficulty: 'intermediate' },
    { slug: 'agile-and-scrum', title: 'Agile and Scrum', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'software-testing', title: 'Software Testing', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'version-control-with-git', title: 'Version Control with Git', duration: '30 min', difficulty: 'beginner' },
    { slug: 'software-project-management', title: 'Software Project Management', duration: '35 min', difficulty: 'advanced' },
  ]},
  { code: 'csc299', topics: [
    { slug: 'siwes-overview-and-objectives', title: 'SIWES Overview and Objectives', duration: '20 min', difficulty: 'beginner' },
    { slug: 'writing-a-technical-report', title: 'Writing a Technical Report', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'workplace-professional-conduct', title: 'Workplace and Professional Conduct', duration: '20 min', difficulty: 'beginner' },
    { slug: 'it-in-the-nigerian-industry', title: 'IT in the Nigerian Industry', duration: '25 min', difficulty: 'intermediate' },
    { slug: 'log-book-documentation', title: 'Log Book Documentation', duration: '20 min', difficulty: 'beginner' },
    { slug: 'networking-basics-in-industry', title: 'Networking Basics in Industry', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'database-systems-in-practice', title: 'Database Systems in Practice', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'software-tools-in-industry', title: 'Common Software Tools in Industry', duration: '25 min', difficulty: 'intermediate' },
  ]},
  { code: 'ins202', topics: [
    { slug: 'hci-principles-and-history', title: 'HCI Principles and History', duration: '25 min', difficulty: 'beginner' },
    { slug: 'user-centered-design', title: 'User-Centered Design', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'usability-evaluation-methods', title: 'Usability Evaluation Methods', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'mental-models-and-affordances', title: 'Mental Models and Affordances', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'gestalt-principles-in-ui', title: 'Gestalt Principles in UI', duration: '25 min', difficulty: 'intermediate' },
    { slug: 'accessibility-and-inclusive-design', title: 'Accessibility and Inclusive Design', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'interaction-design-patterns', title: 'Interaction Design Patterns', duration: '35 min', difficulty: 'advanced' },
    { slug: 'prototyping-and-wireframing', title: 'Prototyping and Wireframing', duration: '30 min', difficulty: 'intermediate' },
  ]},
  { code: 'ins204', topics: [
    { slug: 'systems-thinking', title: 'Systems Thinking', duration: '25 min', difficulty: 'beginner' },
    { slug: 'requirements-gathering-techniques', title: 'Requirements Gathering Techniques', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'data-flow-diagrams', title: 'Data Flow Diagrams (DFDs)', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'entity-relationship-diagrams', title: 'Entity-Relationship Diagrams', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'structured-analysis', title: 'Structured Analysis', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'system-design-strategies', title: 'System Design Strategies', duration: '35 min', difficulty: 'advanced' },
    { slug: 'feasibility-study', title: 'Feasibility Study', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'implementation-and-maintenance', title: 'Implementation and Maintenance', duration: '30 min', difficulty: 'advanced' },
  ]},
  { code: 'cyb201', topics: [
    { slug: 'cybersecurity-fundamentals', title: 'Cybersecurity Fundamentals', duration: '30 min', difficulty: 'beginner' },
    { slug: 'threat-landscape-and-attack-vectors', title: 'Threat Landscape and Attack Vectors', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'cryptography-basics', title: 'Cryptography Basics', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'network-security', title: 'Network Security', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'authentication-and-access-control', title: 'Authentication and Access Control', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'security-policies-and-frameworks', title: 'Security Policies and Frameworks', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'ethical-hacking-overview', title: 'Ethical Hacking Overview', duration: '35 min', difficulty: 'advanced' },
    { slug: 'incident-response', title: 'Incident Response', duration: '30 min', difficulty: 'advanced' },
  ]},
  { code: 'sta202', topics: [
    { slug: 'descriptive-statistics', title: 'Descriptive Statistics', duration: '35 min', difficulty: 'beginner' },
    { slug: 'probability-theory', title: 'Probability Theory', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'probability-distributions', title: 'Probability Distributions', duration: '45 min', difficulty: 'intermediate' },
    { slug: 'hypothesis-testing', title: 'Hypothesis Testing', duration: '45 min', difficulty: 'advanced' },
    { slug: 'regression-analysis', title: 'Regression Analysis', duration: '40 min', difficulty: 'advanced' },
    { slug: 'sampling-methods', title: 'Sampling Methods', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'statistical-inference', title: 'Statistical Inference', duration: '40 min', difficulty: 'advanced' },
    { slug: 'data-visualization', title: 'Data Visualization', duration: '30 min', difficulty: 'intermediate' },
  ]},
  { code: 'csc234', topics: [
    { slug: 'computer-architecture-review', title: 'Computer Architecture Review', duration: '30 min', difficulty: 'beginner' },
    { slug: 'x86-assembly-basics', title: 'x86 Assembly Basics', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'registers-and-memory-addressing', title: 'Registers and Memory Addressing', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'arithmetic-and-logical-instructions', title: 'Arithmetic and Logical Instructions', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'control-flow-in-assembly', title: 'Control Flow in Assembly', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'procedures-and-the-stack', title: 'Procedures and the Stack', duration: '40 min', difficulty: 'advanced' },
    { slug: 'io-and-interrupts', title: 'I/O and Interrupts', duration: '35 min', difficulty: 'advanced' },
    { slug: 'linking-and-debugging', title: 'Linking and Debugging', duration: '30 min', difficulty: 'advanced' },
  ]},
  { code: 'csc236', topics: [
    { slug: 'algorithm-analysis-and-big-o', title: 'Algorithm Analysis and Big-O Notation', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'sorting-algorithms', title: 'Sorting Algorithms', duration: '50 min', difficulty: 'intermediate' },
    { slug: 'searching-algorithms', title: 'Searching Algorithms', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'divide-and-conquer', title: 'Divide and Conquer', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'dynamic-programming', title: 'Dynamic Programming', duration: '50 min', difficulty: 'advanced' },
    { slug: 'greedy-algorithms', title: 'Greedy Algorithms', duration: '35 min', difficulty: 'advanced' },
    { slug: 'graph-algorithms', title: 'Graph Algorithms', duration: '45 min', difficulty: 'advanced' },
    { slug: 'np-completeness-intro', title: 'Introduction to NP-Completeness', duration: '35 min', difficulty: 'advanced' },
  ]},
  { code: 'cos203', topics: [
    { slug: 'lab-safety-and-environment-setup', title: 'Lab Safety and Environment Setup', duration: '20 min', difficulty: 'beginner' },
    { slug: 'linux-command-line-basics', title: 'Linux Command Line Basics', duration: '40 min', difficulty: 'beginner' },
    { slug: 'network-configuration-lab', title: 'Network Configuration Lab', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'database-lab-mysql', title: 'Database Lab: MySQL', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'web-server-setup', title: 'Web Server Setup (Apache/Nginx)', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'scripting-with-bash', title: 'Scripting with Bash', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'virtualization-basics', title: 'Virtualization Basics', duration: '30 min', difficulty: 'intermediate' },
    { slug: 'capstone-lab-project', title: 'Capstone Lab Project', duration: '60 min', difficulty: 'advanced' },
  ]},
  { code: 'csc272', topics: [
    { slug: 'database-design-fundamentals', title: 'Database Design Fundamentals', duration: '35 min', difficulty: 'beginner' },
    { slug: 'sql-fundamentals', title: 'SQL Fundamentals', duration: '45 min', difficulty: 'intermediate' },
    { slug: 'normalization', title: 'Normalization (1NF to BCNF)', duration: '40 min', difficulty: 'intermediate' },
    { slug: 'transaction-management', title: 'Transaction Management', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'indexing-and-query-optimization', title: 'Indexing and Query Optimization', duration: '35 min', difficulty: 'advanced' },
    { slug: 'nosql-databases', title: 'NoSQL Databases', duration: '35 min', difficulty: 'intermediate' },
    { slug: 'data-warehousing', title: 'Data Warehousing and OLAP', duration: '35 min', difficulty: 'advanced' },
    { slug: 'information-systems-strategy', title: 'Information Systems Strategy', duration: '30 min', difficulty: 'advanced' },
  ]},
]

let total = 0

for (const course of courses) {
  const dir = join(ROOT, course.code)
  mkdirSync(dir, { recursive: true })

  for (const topic of course.topics) {
    const content = `---
title: "${topic.title}"
description: "Content coming soon"
duration: "${topic.duration}"
difficulty: "${topic.difficulty}"
---

Content for this topic hasn't been added yet. Drop your course materials and this page will be updated with full study notes, worked examples, and exam tips.
`
    writeFileSync(join(dir, `${topic.slug}.mdx`), content)
    total++
  }
}

console.log(`Generated ${total} placeholder files across ${courses.length} courses.`)
