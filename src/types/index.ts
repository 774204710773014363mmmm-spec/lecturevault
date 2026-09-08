export interface PhotoItem {
  id: string;
  lectureId: string;
  indexNumber: number; // e.g. 1
  fileName: string; // e.g. "001.jpg"
  dataUrl: string; // Base64 data URL stored in IndexedDB
  createdAt: number;
  enhancedFilter?: boolean;
}

export interface StudentNode {
  id: string;
  name: string;
}

export interface LectureNode {
  id: string;
  subjectId: string;
  lectureNumber: number; // e.g. 1, 2, 3
  title: string; // e.g. "المحاضرة 1 - المقدمة"
  createdAt: number;
  isCancelled?: boolean;
  cancelReason?: string;
  imageData?: string;
}

export interface SubjectNode {
  id: string;
  semesterId: string;
  name: string; // e.g. "البرمجة الشيئية"
  code?: string;
  instructorTitle?: 'دكتور' | 'دكتورة' | 'مهندس' | 'مهندسة' | string;
  instructorName?: string;
}

export interface SemesterNode {
  id: string;
  yearId: string;
  name: string; // e.g. "الترم الأول"
  order: number;
}

export interface YearNode {
  id: string;
  name: string; // e.g. "السنة الأولى"
  order: number;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  language: 'ar' | 'en';
  currentYearId: string;
  currentSemesterId: string;
  autoCrop: boolean;
  docEnhance: boolean;
  defaultResolution: 'high' | 'medium';
  pdfPageSize: 'A4' | 'Original';
  pdfHeader: boolean;
  pdfFooterNumbers: boolean;
  storageLocation: string;
  isLocked: boolean;
  hasPasswordSet: boolean;
  passwordPin: string;
  securityQuestion: string; // Default: "ما هو لونك المفضل؟"
  securityAnswer: string;
}

export interface LecturePackageMetadata {
  version: string;
  appName: string;
  exportDate: string;
  yearName: string;
  semesterName: string;
  subjectName: string;
  lectureNumber: number;
  lectureTitle: string;
  photoCount: number;
  photos: {
    fileName: string;
    indexNumber: number;
  }[];
}

export type ActiveTab = 'explorer' | 'quick_add' | 'instructors' | 'grades' | 'pdf_export' | 'sync' | 'settings' | 'shortcuts';
