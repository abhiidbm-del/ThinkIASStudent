export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

export interface Test {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  duration: number;
  questions: Question[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Answer {
  questionIndex: number;
  selectedOption: number;
}

export interface TestSubmission {
  answers: Answer[];
  timeTaken: number;
}

export interface TestResult {
  message: string;
  score: number;
  totalMarks: number;
}