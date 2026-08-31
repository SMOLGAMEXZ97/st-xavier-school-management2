import { ExamSubjectConfig, SubjectMarks, ExamResultStatus } from '../types';

export interface GradeInfo {
  grade: string;
  gradePoint: number;
  description: string;
  colorClass: string;
  bgClass: string;
}

export const GRADING_SCALE: GradeInfo[] = [
  { grade: 'A1', gradePoint: 10.0, description: 'Outstanding (91% - 100%)', colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50 border-emerald-200' },
  { grade: 'A2', gradePoint: 9.0, description: 'Excellent (81% - 90%)', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50/70 border-emerald-100' },
  { grade: 'B1', gradePoint: 8.0, description: 'Very Good (71% - 80%)', colorClass: 'text-blue-700', bgClass: 'bg-blue-50 border-blue-200' },
  { grade: 'B2', gradePoint: 7.0, description: 'Good (61% - 70%)', colorClass: 'text-blue-600', bgClass: 'bg-blue-50/70 border-blue-100' },
  { grade: 'C1', gradePoint: 6.0, description: 'Satisfactory (51% - 60%)', colorClass: 'text-amber-700', bgClass: 'bg-amber-50 border-amber-200' },
  { grade: 'C2', gradePoint: 5.0, description: 'Average (41% - 50%)', colorClass: 'text-amber-600', bgClass: 'bg-amber-50/70 border-amber-100' },
  { grade: 'D', gradePoint: 4.0, description: 'Pass / Fair (33% - 40%)', colorClass: 'text-orange-700', bgClass: 'bg-orange-50 border-orange-200' },
  { grade: 'E', gradePoint: 0.0, description: 'Needs Improvement (Below 33%)', colorClass: 'text-rose-700', bgClass: 'bg-rose-50 border-rose-200' },
];

export function calculateGrade(percentage: number): GradeInfo {
  const rounded = Math.round(percentage * 10) / 10;
  if (rounded >= 91) return GRADING_SCALE[0];
  if (rounded >= 81) return GRADING_SCALE[1];
  if (rounded >= 71) return GRADING_SCALE[2];
  if (rounded >= 61) return GRADING_SCALE[3];
  if (rounded >= 51) return GRADING_SCALE[4];
  if (rounded >= 41) return GRADING_SCALE[5];
  if (rounded >= 33) return GRADING_SCALE[6];
  return GRADING_SCALE[7];
}

export function calculateSubjectGrade(marksObtained: number, maxMarks: number, isAbsent?: boolean): { grade: string; remarks: string } {
  if (isAbsent) {
    return { grade: 'AB', remarks: 'Absent' };
  }
  if (!maxMarks || maxMarks <= 0) {
    return { grade: 'N/A', remarks: '-' };
  }
  const pct = (marksObtained / maxMarks) * 100;
  const gradeInfo = calculateGrade(pct);
  return { grade: gradeInfo.grade, remarks: gradeInfo.description.split(' (')[0] };
}

export function evaluateResultStatus(
  subjectMarksList: SubjectMarks[],
  overallPercentage: number
): ExamResultStatus {
  if (subjectMarksList.length === 0) return 'passed';
  
  const allAbsent = subjectMarksList.every((s) => s.isAbsent);
  if (allAbsent) return 'absent';

  let failedSubjectsCount = 0;
  subjectMarksList.forEach((s) => {
    if (s.isAbsent) {
      failedSubjectsCount++;
    } else if (s.maxMarks > 0) {
      const passMarks = s.passMarks ?? (s.maxMarks * 0.33);
      if (s.marksObtained < passMarks) {
        failedSubjectsCount++;
      }
    }
  });

  if (failedSubjectsCount === 0 && overallPercentage >= 33) {
    return 'passed';
  } else if (failedSubjectsCount === 1 || failedSubjectsCount === 2) {
    return 'compartment';
  } else {
    return 'failed';
  }
}

export function getDefaultSubjectsForClass(className: string, maxMarksDefault = 100): ExamSubjectConfig[] {
  const norm = className.toLowerCase();
  const passMarksDefault = Math.round(maxMarksDefault * 0.33);

  if (norm.includes('nursery') || norm.includes('lkg') || norm.includes('ukg') || norm.includes('kg')) {
    return [
      { subjectName: 'English (Oral & Written)', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Mathematics', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Odia / Hindi', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Rhymes & Conversation', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Drawing & Craft', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'General Awareness', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
    ];
  }

  if (norm.includes('class 1') || norm.includes('class 2') || norm.includes('class 3') || norm.includes('class 4') || norm.includes('class 5') || norm.includes('standard 1') || norm.includes('standard 2') || norm.includes('standard 3') || norm.includes('standard 4') || norm.includes('standard 5')) {
    return [
      { subjectName: 'English', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Odia', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Hindi', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Mathematics', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Environmental Studies (EVS)', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Computer Science', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'General Knowledge & Moral Sc.', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Art & Craft', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
    ];
  }

  if (norm.includes('class 6') || norm.includes('class 7') || norm.includes('class 8') || norm.includes('standard 6') || norm.includes('standard 7') || norm.includes('standard 8')) {
    return [
      { subjectName: 'English Language & Lit.', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Odia (2nd Language)', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Hindi / Sanskrit (3rd Lang)', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Mathematics', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'General Science', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Social Science', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'Computer Applications', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
      { subjectName: 'General Knowledge', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
    ];
  }

  // Classes 9, 10 and default
  return [
    { subjectName: 'English Language & Literature', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
    { subjectName: 'Odia / Hindi Course A', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
    { subjectName: 'Mathematics', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
    { subjectName: 'Science (Theory & Practical)', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
    { subjectName: 'Social Science', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
    { subjectName: 'Information Technology (IT 402)', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
    { subjectName: 'Art Education & Work Exp.', maxMarks: maxMarksDefault, passMarks: passMarksDefault },
  ];
}

export const EXAM_TYPE_LABELS: Record<string, { label: string; badgeColor: string }> = {
  unit_test: { label: 'Unit Test', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200' },
  periodic_test: { label: 'Periodic Assessment', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  half_yearly: { label: 'Half-Yearly Examination', badgeColor: 'bg-blue-50 text-blue-800 border-blue-200' },
  annual: { label: 'Annual / Final Examination', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  pre_board: { label: 'Pre-Board Examination', badgeColor: 'bg-purple-50 text-purple-800 border-purple-200' },
  mock_test: { label: 'Mock Test', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
  term_exam: { label: 'Term Examination', badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  other: { label: 'General Assessment', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200' },
};
