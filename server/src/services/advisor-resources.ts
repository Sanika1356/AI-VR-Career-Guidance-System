export interface AdvisorResourceLink {
  title: string;
  url: string;
  reason: string;
}

const RESOURCE_CATALOG: Record<string, AdvisorResourceLink[]> = {
  data: [
    {
      title: "pandas getting started",
      url: "https://pandas.pydata.org/docs/getting_started/index.html",
      reason: "learn to clean, transform, join, and summarize tabular data",
    },
    {
      title: "PostgreSQL SQL tutorial",
      url: "https://www.postgresql.org/docs/current/tutorial.html",
      reason:
        "strengthen relational SQL fundamentals with an authoritative reference",
    },
    {
      title: "Kaggle Learn",
      url: "https://www.kaggle.com/learn",
      reason: "practise short, hands-on lessons with datasets and notebooks",
    },
    {
      title: "Power BI learning",
      url: "https://learn.microsoft.com/en-us/training/powerplatform/power-bi/",
      reason: "learn dashboard design and stakeholder-facing reporting",
    },
  ],
  machineLearning: [
    {
      title: "Google Machine Learning Crash Course",
      url: "https://developers.google.com/machine-learning/crash-course",
      reason:
        "build foundations in models, evaluation, data, and production ML",
    },
    {
      title: "scikit-learn user guide",
      url: "https://scikit-learn.org/stable/user_guide.html",
      reason: "apply classical machine-learning workflows in Python",
    },
  ],
  programming: [
    {
      title: "Python tutorial",
      url: "https://docs.python.org/3/tutorial/",
      reason: "review core Python concepts and standard-library practice",
    },
  ],
  algorithms: [
    {
      title: "LeetCode problem set",
      url: "https://leetcode.com/problemset/",
      reason: "build a consistent DSA and coding-interview practice habit",
    },
    {
      title: "NeetCode roadmap",
      url: "https://neetcode.io/roadmap",
      reason:
        "follow a structured progression through common interview patterns",
    },
  ],
  projects: [
    {
      title: "Kaggle datasets",
      url: "https://www.kaggle.com/datasets",
      reason:
        "find public datasets for portfolio projects and reproducible analysis",
    },
    {
      title: "GitHub documentation",
      url: "https://docs.github.com/en/get-started",
      reason: "organize, document, and publish projects professionally",
    },
  ],
};

function hasAnyTerm(question: string, terms: string[]): boolean {
  return terms.some((term) => {
    if (term.length <= 3)
      return new RegExp(`\\b${term}\\b`, "i").test(question);
    return question.includes(term);
  });
}

export function selectAdvisorResources(message: string): AdvisorResourceLink[] {
  const question = message.trim().toLocaleLowerCase();
  const selected: AdvisorResourceLink[] = [];
  const add = (resources: AdvisorResourceLink[]) => {
    for (const resource of resources) {
      if (!selected.some((existing) => existing.url === resource.url)) {
        selected.push(resource);
      }
    }
  };

  if (
    hasAnyTerm(question, [
      "dsa",
      "data structure",
      "algorithm",
      "coding interview",
      "placement",
      "placements",
      "leetcode",
    ])
  ) {
    add(RESOURCE_CATALOG.algorithms.slice(0, 2));
  }
  if (
    hasAnyTerm(question, [
      "machine learning",
      "ml engineer",
      "model",
      "deep learning",
      "artificial intelligence",
      " ai ",
    ])
  ) {
    add(RESOURCE_CATALOG.machineLearning.slice(0, 2));
  }
  if (
    hasAnyTerm(question, [
      "data analyst",
      "data analysis",
      "data analytics",
      "sql",
      "pandas",
      "visualization",
      "power bi",
      "tableau",
      "dashboard",
    ])
  ) {
    add(RESOURCE_CATALOG.data.slice(0, 4));
  }
  if (
    hasAnyTerm(question, [
      "project",
      "portfolio",
      "capstone",
      "practice",
      "practise",
    ])
  ) {
    add(RESOURCE_CATALOG.projects.slice(0, 2));
  }
  if (hasAnyTerm(question, ["python", "programming", "java"])) {
    add(RESOURCE_CATALOG.programming);
  }

  if (selected.length === 0)
    add([...RESOURCE_CATALOG.programming, ...RESOURCE_CATALOG.projects]);
  return selected.slice(0, 8);
}

export function appendAdvisorResources(
  answer: string,
  message: string,
  maxChars = Number.POSITIVE_INFINITY,
): string {
  const resources = selectAdvisorResources(message).filter(
    (resource) => !answer.includes(resource.url),
  );
  if (resources.length === 0) return answer;

  const resourceLines = resources.map(
    (resource) =>
      `- [${resource.title}](${resource.url}) — ${resource.reason}.`,
  );
  const appendix = `## Recommended resources\n\n${resourceLines.join("\n")}\n\nUse one or two resources at a time, and verify course availability, pricing, and prerequisites on the linked site.`;
  const separator = "\n\n";
  const answerBudget = Math.max(
    0,
    maxChars - separator.length - appendix.length,
  );
  const trimmedAnswer = answer.trim();
  const answerWasTrimmed = trimmedAnswer.length > answerBudget;
  const contentBudget = answerWasTrimmed
    ? Math.max(0, answerBudget - 1)
    : answerBudget;
  const boundedAnswer = trimmedAnswer.slice(0, contentBudget).trimEnd();
  const boundedAnswerWithMarker = answerWasTrimmed
    ? `${boundedAnswer}…`
    : boundedAnswer;
  return `${boundedAnswerWithMarker}${boundedAnswerWithMarker ? separator : ""}${appendix}`;
}
