export type User = {
  id: string;
  name: string;
};

export type Answer = {
  id: string;
  questionId: string;
  author: User;
  body: string;
  upvotes: number;
};

export type Question = {
  id: string;
  title: string;
  author: User;
  topic: string;
  excerpt: string;
  upvotes: number;
  answersCount: number;
  following: boolean;
};

let users: User[] = [
  { id: 'u1', name: 'Dr. Smith' },
  { id: 'u2', name: 'Oncology Nurse' },
  { id: 'u3', name: 'Health Advocate' },
];

let questions: Question[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `q${i + 1}`,
  title: `What are early signs of cancer? #${i + 1}`,
  author: users[i % users.length],
  topic: ['General', 'Screening', 'Nutrition'][i % 3],
  excerpt:
    'Looking to understand common early warning signs and when to seek screening. Shortness of breath, lumps, persistent fatigue?',
  upvotes: Math.floor(Math.random() * 120),
  answersCount: Math.floor(Math.random() * 20),
  following: false,
}));

let answers: Answer[] = [
  {
    id: 'a1',
    questionId: 'q1',
    author: users[0],
    body:
      'Early signs can vary widely by cancer type. Watch for unexplained weight loss, persistent pain, unusual bleeding, or changes in moles. Always consult a professional for proper screening.',
    upvotes: 24,
  },
  {
    id: 'a2',
    questionId: 'q1',
    author: users[1],
    body:
      'Adding: persistent cough, difficulty swallowing, and non-healing sores can be red flags. Screening guidelines depend on age and risk factors.',
    upvotes: 11,
  },
];

export const getQuestions = () => [...questions];
export const getQuestionById = (id: string) => questions.find(q => q.id === id) || null;
export const getAnswersFor = (questionId: string) => answers.filter(a => a.questionId === questionId);

export const toggleFollow = (id: string) => {
  questions = questions.map(q => (q.id === id ? { ...q, following: !q.following } : q));
};

export const upvoteQuestion = (id: string) => {
  questions = questions.map(q => (q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q));
};

export const upvoteAnswer = (id: string) => {
  answers = answers.map(a => (a.id === id ? { ...a, upvotes: a.upvotes + 1 } : a));
};

export const addQuestion = (title: string) => {
  const q: Question = {
    id: `q${Date.now()}`,
    title: title.trim(),
    author: users[2],
    topic: 'General',
    excerpt: title.trim().slice(0, 120),
    upvotes: 0,
    answersCount: 0,
    following: true,
  };
  questions = [q, ...questions];
  return q;
};

export const addAnswer = (questionId: string, body: string) => {
  const a: Answer = {
    id: `a${Date.now()}`,
    questionId,
    author: users[1],
    body: body.trim(),
    upvotes: 0,
  };
  answers = [a, ...answers];
  questions = questions.map(q => (q.id === questionId ? { ...q, answersCount: q.answersCount + 1 } : q));
  return a;
};
