import { collection, addDoc, doc, getDoc, getDocs, increment, limit, orderBy, query, serverTimestamp, updateDoc, where, runTransaction, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/app';

export type UserRef = { id: string; name: string; photoURL?: string; cancerType?: string; stage?: string; age?: number };
export type Question = {
  id: string;
  title: string;
  author: UserRef;
  topic: string;
  excerpt: string;
  upvotes: number;
  answersCount: number;
  createdAt?: any;
  following?: boolean;
};
export type Answer = {
  id: string;
  questionId: string;
  author: UserRef;
  body: string;
  upvotes: number;
  createdAt?: any;
};

const followingLocal = new Set<string>();
export const isFollowingLocal = (qid: string) => followingLocal.has(qid);
export const toggleFollow = (qid: string) => {
  if (followingLocal.has(qid)) followingLocal.delete(qid);
  else followingLocal.add(qid);
};

const qCol = () => collection(db!, 'questions');
const aCol = () => collection(db!, 'answers');

const currentUser = (): UserRef => {
  const u = auth?.currentUser;
  const name = u?.displayName || u?.email || 'User';
  const photoURL = u?.photoURL || undefined;
  return { id: u?.uid || 'anon', name, photoURL };
};

export const getQuestions = async (): Promise<Question[]> => {
  const q = query(qCol(), orderBy('createdAt', 'desc'), limit(25));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ following: isFollowingLocal(d.id), ...({ id: d.id, ...(d.data() as any) }) }));
};

export const getQuestionById = async (id: string): Promise<Question | null> => {
  const ref = doc(db!, 'questions', id);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Question) : null;
};

export const getAnswersFor = async (questionId: string): Promise<Answer[]> => {
  const q2 = query(aCol(), where('questionId', '==', questionId), limit(50));
  const snap2 = await getDocs(q2);
  const arr = snap2.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Answer[];
  // best-effort sort by createdAt if present
  return arr.sort((a, b) => {
    const ta = (a as any).createdAt?.toMillis?.() ?? 0;
    const tb = (b as any).createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });
};

export const addQuestion = async (title: string): Promise<Question> => {
  const author = currentUser();
  // Enrich with public illness profile if available
  try {
    if (author.id !== 'anon') {
      const prof = await getDoc(doc(db!, 'users', author.id));
      const d = prof.exists() ? (prof.data() as any) : null;
      if (d) {
        // Only add fields if they have actual values (not undefined)
        if (d.cancerType) (author as any).cancerType = d.cancerType;
        if (d.stage) (author as any).stage = d.stage;
        if (typeof d.age === 'number') (author as any).age = d.age;
      }
    }
  } catch {}
  const data = {
    title,
    author,
    topic: 'General',
    excerpt: title.slice(0, 140),
    upvotes: 0,
    answersCount: 0,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(qCol(), data as any);
  return { id: ref.id, ...(data as any) } as Question;
};

export const addAnswer = async (questionId: string, body: string): Promise<Answer> => {
  console.log('addAnswer called:', { questionId, bodyLength: body.length });
  
  if (!db) {
    throw new Error('Firebase not initialized');
  }
  
  const author = currentUser();
  console.log('Current user:', { id: author.id, name: author.name });
  
  // Enrich with public illness profile if available
  try {
    if (author.id !== 'anon') {
      const prof = await getDoc(doc(db!, 'users', author.id));
      const d = prof.exists() ? (prof.data() as any) : null;
      if (d) {
        // Only add fields if they have actual values (not undefined)
        if (d.cancerType) (author as any).cancerType = d.cancerType;
        if (d.stage) (author as any).stage = d.stage;
        if (typeof d.age === 'number') (author as any).age = d.age;
      }
    }
  } catch (profileError) {
    console.warn('Could not fetch user profile:', profileError);
  }
  
  const data = {
    questionId,
    author,
    body,
    upvotes: 0,
    createdAt: serverTimestamp(),
  };
  
  console.log('Adding answer to Firestore:', data);
  const ref = await addDoc(aCol(), data as any);
  console.log('Answer added with ID:', ref.id);
  
  // increment answersCount on question
  await updateDoc(doc(db!, 'questions', questionId), { answersCount: increment(1) });
  console.log('Question answer count incremented');
  
  return { id: ref.id, ...(data as any) } as Answer;
};

export const upvoteQuestion = async (id: string) => {
  await updateDoc(doc(db!, 'questions', id), { upvotes: increment(1) });
};

export const upvoteAnswer = async (id: string) => {
  await updateDoc(doc(db!, 'answers', id), { upvotes: increment(1) });
};

// Enforce one vote per user using a dedicated votes document
type TargetType = 'question' | 'answer';
const voteKey = (type: TargetType, targetId: string, userId: string) => `${type}_${targetId}_${userId}`;

export const upvoteOnce = async (type: TargetType, targetId: string): Promise<{ changed: boolean }> => {
  const u = auth?.currentUser;
  if (!u) throw new Error('Must be signed in to vote');
  const key = voteKey(type, targetId, u.uid);
  const voteRef = doc(db!, 'votes', key);
  const targetRef = doc(db!, type === 'question' ? 'questions' : 'answers', targetId);
  let didIncrement = false;
  try {
    await runTransaction(db!, async (trx) => {
      const existing = await trx.get(voteRef);
      if (existing.exists()) {
        // already voted; no change
        return;
      }
      trx.set(voteRef, {
        userId: u.uid,
        targetId,
        targetType: type,
        createdAt: serverTimestamp(),
      });
      trx.update(targetRef, { upvotes: increment(1) });
      didIncrement = true;
    });
    return { changed: didIncrement };
  } catch (e) {
    // surface error to UI, but do not double-increment
    throw e;
  }
};

export const upvoteQuestionOnce = (id: string) => upvoteOnce('question', id);
export const upvoteAnswerOnce = (id: string) => upvoteOnce('answer', id);

export const seedSampleData = async () => {
  // Create a few questions
  const samples = [
    'What are early signs of cancer and when should I get screened?',
    'How does nutrition impact cancer risk over time?',
    'Are there recommended screening schedules by age group?',
  ];
  const qs: Question[] = [];
  for (const title of samples) {
    const q = await addQuestion(title);
    qs.push(q);
  }
  // Add answers to the first question
  if (qs[0]) {
    await addAnswer(qs[0].id, 'Unexplained weight loss, persistent pain, unusual bleeding, and non-healing sores can be red flags. Consult a healthcare professional for guidance.');
    await addAnswer(qs[0].id, 'Screening depends on your age and risk factors. Discuss with your doctor to determine an appropriate schedule.');
  }
  // Slightly upvote some items
  if (qs[1]) await upvoteQuestion(qs[1].id);
  if (qs[2]) await upvoteQuestion(qs[2].id);
};
