import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PhotoItem,
  LectureNode,
  SubjectNode,
  SemesterNode,
  YearNode,
  AppSettings,
  ActiveTab,
  LecturePackageMetadata,
  StudentNode
} from '../types';

import {
  initDatabaseIfNeeded,
  getAllYears,
  getAllSemesters,
  getAllSubjects,
  getAllLectures,
  getAllPhotos,
  saveYear,
  saveSemester,
  saveSubject,
  saveLecture,
  savePhoto,
  savePhotosBatch,
  deletePhoto as deletePhotoDb,
  deleteLecture as deleteLectureDb,
  deleteSubject as deleteSubjectDb,
  reindexLecturePhotos,
  getSettings,
  saveSettings as saveSettingsDb,
  getGrades,
  saveGrades as saveGradesDb,
  getStudents,
  saveStudents,
  getBatchGrades,
  saveBatchGrades,
  exportFullBackup,
  importFullBackup,
  calculateStorageUsage,
  wipeAllAcademicData
} from '../services/db';

import { translations } from '../i18n/translations';

interface AppContextType {
  years: YearNode[];
  semesters: SemesterNode[];
  subjects: SubjectNode[];
  lectures: LectureNode[];
  photos: PhotoItem[];
  settings: AppSettings;
  grades: Record<string, number>;
  students: StudentNode[];
  batchGrades: Record<string, Record<string, number>>;
  updateGrades: (newGrades: Record<string, number>) => Promise<void>;
  addOrUpdateStudent: (student: StudentNode) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  updateBatchGrades: (batchGrades: Record<string, Record<string, number>>) => Promise<void>;
  updateSubject: (subject: SubjectNode) => Promise<void>;
  exportBackup: () => Promise<string>;
  importBackup: (jsonData: string) => Promise<boolean>;
  wipeAllData: () => Promise<boolean>;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedYearId: string;
  setSelectedYearId: (id: string) => void;
  selectedSemesterId: string;
  setSelectedSemesterId: (id: string) => void;
  selectedSubjectId: string;
  setSelectedSubjectId: (id: string) => void;
  selectedLectureId: string;
  setSelectedLectureId: (id: string) => void;
  
  // App Lock State
  isLocked: boolean;
  unlockApp: (pin: string) => boolean;
  lockAppNow: () => void;
  resetPasswordWithSecurityAnswer: (answer: string, newPin: string) => boolean;
  changePassword: (oldPin: string, newPin: string) => { success: boolean; messageKey?: string };
  
  // Actions
  refreshData: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  addNewYear: (name: string) => Promise<YearNode>;
  addNewSemester: (yearId: string, name: string) => Promise<SemesterNode>;
  addNewSubject: (semesterId: string, name: string, code?: string, instructorTitle?: string, instructorName?: string) => Promise<SubjectNode>;
  addNewLecture: (subjectId: string, title?: string) => Promise<LectureNode>;
  quickAddPhotos: (subjectId: string, photoDataUrls: string[], lectureTitle?: string) => Promise<LectureNode>;
  addPhotosToLecture: (lectureId: string, photoDataUrls: string[]) => Promise<void>;
  deletePhoto: (photoId: string, lectureId: string) => Promise<void>;
  deleteLecture: (lectureId: string) => Promise<void>;
  deleteSubject: (subjectId: string) => Promise<void>;
  reindexLecture: (lectureId: string) => Promise<void>;
  movePhotoIndex: (photoId: string, direction: 'up' | 'down') => Promise<void>;
  importPackageData: (metadata: LecturePackageMetadata, photoData: { fileName: string; indexNumber: number; dataUrl: string }[]) => Promise<LectureNode>;
  
  // Storage Stats
  storageStats: { totalMB: number; photoCount: number; lectureCount: number };
  refreshStorageStats: () => Promise<void>;
  
  // Translation helper
  t: (key: keyof typeof translations.ar) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [years, setYears] = useState<YearNode[]>([]);
  const [semesters, setSemesters] = useState<SemesterNode[]>([]);
  const [subjects, setSubjects] = useState<SubjectNode[]>([]);
  const [lectures, setLectures] = useState<LectureNode[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettingsInitialState());
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [students, setStudents] = useState<StudentNode[]>([]);
  const [batchGrades, setBatchGrades] = useState<Record<string, Record<string, number>>>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>('explorer');

  const [selectedYearId, setSelectedYearId] = useState<string>('year-1');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('sem-1');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('subj-1');
  const [selectedLectureId, setSelectedLectureId] = useState<string>('lect-1');

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [storageStats, setStorageStats] = useState({ totalMB: 0, photoCount: 0, lectureCount: 0 });

  function getSettingsInitialState(): AppSettings {
    return {
      theme: 'dark',
      language: 'ar',
      currentYearId: 'year-1',
      currentSemesterId: 'sem-1',
      autoCrop: true,
      docEnhance: true,
      defaultResolution: 'high',
      pdfPageSize: 'A4',
      pdfHeader: true,
      pdfFooterNumbers: true,
      storageLocation: 'IndexedDB (Local Scoped Storage)',
      isLocked: false,
      hasPasswordSet: false,
      passwordPin: '',
      securityQuestion: 'ما هو لونك المفضل؟',
      securityAnswer: '',
    };
  }

  // Load Database on Mount
  useEffect(() => {
    async function init() {
      await initDatabaseIfNeeded();
      await refreshData();
    }
    init();
  }, []);

  // Update HTML Dir & Class based on language and theme
  useEffect(() => {
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
    
    if (settings.theme === 'dark') {
      document.body.classList.remove('bg-slate-50', 'text-slate-900');
      document.body.classList.add('bg-slate-950', 'text-slate-100');
    } else {
      document.body.classList.remove('bg-slate-950', 'text-slate-100');
      document.body.classList.add('bg-slate-50', 'text-slate-900');
    }
  }, [settings.language, settings.theme]);

  const refreshData = async () => {
    const yList = await getAllYears();
    const sList = await getAllSemesters();
    const sbList = await getAllSubjects();
    const lList = await getAllLectures();
    const pList = await getAllPhotos();
    const stData = await getSettings();
    const grData = await getGrades();
    const stds = await getStudents();
    const bgData = await getBatchGrades();

    setYears(yList.sort((a, b) => a.order - b.order));
    setSemesters(sList.sort((a, b) => a.order - b.order));
    setSubjects(sbList);
    setLectures(lList.sort((a, b) => b.createdAt - a.createdAt));
    setPhotos(pList.sort((a, b) => a.indexNumber - b.indexNumber));
    setSettings(stData);
    setGrades(grData);
    setStudents(stds);
    setBatchGrades(bgData);

    if (stData.isLocked && stData.hasPasswordSet) {
      setIsLocked(true);
    }

    const stats = await calculateStorageUsage();
    setStorageStats(stats);
  };

  const updateGrades = async (newGrades: Record<string, number>) => {
    setGrades(newGrades);
    await saveGradesDb(newGrades);
  };

  const addOrUpdateStudent = async (std: StudentNode) => {
    let updated: StudentNode[];
    const idx = students.findIndex(s => s.id === std.id);
    if (idx !== -1) {
      updated = [...students];
      updated[idx] = std;
    } else {
      updated = [...students, std];
    }
    setStudents(updated);
    await saveStudents(updated);
  };

  const deleteStudent = async (studentId: string) => {
    const updated = students.filter(s => s.id !== studentId);
    setStudents(updated);
    await saveStudents(updated);

    const bgCopy = { ...batchGrades };
    delete bgCopy[studentId];
    setBatchGrades(bgCopy);
    await saveBatchGrades(bgCopy);
  };

  const updateBatchGrades = async (bgData: Record<string, Record<string, number>>) => {
    setBatchGrades(bgData);
    await saveBatchGrades(bgData);
  };

  const updateSubject = async (sub: SubjectNode) => {
    await saveSubject(sub);
    await refreshData();
  };

  const exportBackup = async (): Promise<string> => {
    return await exportFullBackup();
  };

  const importBackup = async (jsonData: string): Promise<boolean> => {
    const success = await importFullBackup(jsonData);
    if (success) {
      await refreshData();
    }
    return success;
  };

  const wipeAllData = async (): Promise<boolean> => {
    const success = await wipeAllAcademicData();
    if (success) {
      await refreshData();
    }
    return success;
  };

  const refreshStorageStats = async () => {
    const stats = await calculateStorageUsage();
    setStorageStats(stats);
  };

  const t = (key: keyof typeof translations.ar): string => {
    const lang = settings.language || 'ar';
    return translations[lang][key] || translations['ar'][key] || key;
  };

  const updateSettings = async (newSt: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSt };
    setSettings(updated);
    await saveSettingsDb(updated);
  };

  // Lock & Passcode Management
  const unlockApp = (pin: string): boolean => {
    if (settings.passwordPin === pin.trim()) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lockAppNow = () => {
    if (settings.hasPasswordSet) {
      setIsLocked(true);
    }
  };

  const resetPasswordWithSecurityAnswer = (answer: string, newPin: string): boolean => {
    if (settings.securityAnswer.toLowerCase().trim() === answer.toLowerCase().trim()) {
      const updated = {
        ...settings,
        passwordPin: newPin.trim(),
        hasPasswordSet: true,
        isLocked: false
      };
      setSettings(updated);
      saveSettingsDb(updated);
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const changePassword = (oldPin: string, newPin: string): { success: boolean; messageKey?: string } => {
    if (settings.hasPasswordSet && settings.passwordPin !== oldPin.trim()) {
      return { success: false, messageKey: 'oldPasswordIncorrect' };
    }
    const updated = {
      ...settings,
      passwordPin: newPin.trim(),
      hasPasswordSet: true,
    };
    setSettings(updated);
    saveSettingsDb(updated);
    return { success: true };
  };

  // Tree Handlers
  const addNewYear = async (name: string): Promise<YearNode> => {
    const newYear: YearNode = {
      id: `year-${Date.now()}`,
      name: name.trim(),
      order: years.length + 1
    };
    await saveYear(newYear);
    await refreshData();
    return newYear;
  };

  const addNewSemester = async (yearId: string, name: string): Promise<SemesterNode> => {
    const newSem: SemesterNode = {
      id: `sem-${Date.now()}`,
      yearId,
      name: name.trim(),
      order: semesters.filter(s => s.yearId === yearId).length + 1
    };
    await saveSemester(newSem);
    await refreshData();
    return newSem;
  };

  const addNewSubject = async (
    semesterId: string,
    name: string,
    code?: string,
    instructorTitle?: string,
    instructorName?: string
  ): Promise<SubjectNode> => {
    const newSubj: SubjectNode = {
      id: `subj-${Date.now()}`,
      semesterId,
      name: name.trim(),
      code: code?.trim(),
      instructorTitle: instructorTitle?.trim(),
      instructorName: instructorName?.trim()
    };
    await saveSubject(newSubj);
    await refreshData();
    return newSubj;
  };

  const addNewLecture = async (
    subjectId: string,
    title?: string,
    isCancelled?: boolean,
    cancelReason?: string
  ): Promise<LectureNode> => {
    const subjectLectures = lectures.filter(l => l.subjectId === subjectId);
    const nextNumber = subjectLectures.length + 1;
    const defaultTitle = title || `المحاضرة ${nextNumber}`;

    const newLect: LectureNode = {
      id: `lect-${Date.now()}`,
      subjectId,
      lectureNumber: nextNumber,
      title: defaultTitle,
      createdAt: Date.now(),
      isCancelled,
      cancelReason
    };

    await saveLecture(newLect);
    await refreshData();
    return newLect;
  };

  // Quick Add
  const quickAddPhotos = async (subjectId: string, photoDataUrls: string[], lectureTitle?: string): Promise<LectureNode> => {
    const newLecture = await addNewLecture(subjectId, lectureTitle);
    await addPhotosToLecture(newLecture.id, photoDataUrls);
    return newLecture;
  };

  const addPhotosToLecture = async (lectureId: string, photoDataUrls: string[]) => {
    const existingPhotos = photos.filter(p => p.lectureId === lectureId);
    let startIndex = existingPhotos.length;

    const newPhotoItems: PhotoItem[] = photoDataUrls.map((dataUrl, idx) => {
      const idxNum = startIndex + idx + 1;
      const formattedNum = idxNum < 10 ? `00${idxNum}` : idxNum < 100 ? `0${idxNum}` : `${idxNum}`;
      return {
        id: `photo-${Date.now()}-${idx}`,
        lectureId,
        indexNumber: idxNum,
        fileName: `${formattedNum}.jpg`,
        dataUrl,
        createdAt: Date.now() + idx
      };
    });

    await savePhotosBatch(newPhotoItems);
    await refreshData();
  };

  const deletePhoto = async (photoId: string, lectureId: string) => {
    await deletePhotoDb(photoId, lectureId);
    await refreshData();
  };

  const deleteLecture = async (lectureId: string) => {
    await deleteLectureDb(lectureId);
    await refreshData();
  };

  const deleteSubject = async (subjectId: string) => {
    await deleteSubjectDb(subjectId);
    await refreshData();
  };

  const reindexLecture = async (lectureId: string) => {
    await reindexLecturePhotos(lectureId);
    await refreshData();
  };

  const movePhotoIndex = async (photoId: string, direction: 'up' | 'down') => {
    const targetPhoto = photos.find(p => p.id === photoId);
    if (!targetPhoto) return;

    const lecturePhotos = photos
      .filter(p => p.lectureId === targetPhoto.lectureId)
      .sort((a, b) => a.indexNumber - b.indexNumber);

    const currentIdx = lecturePhotos.findIndex(p => p.id === photoId);
    if (currentIdx === -1) return;

    if (direction === 'up' && currentIdx > 0) {
      const prevPhoto = lecturePhotos[currentIdx - 1];
      const tempNum = targetPhoto.indexNumber;
      targetPhoto.indexNumber = prevPhoto.indexNumber;
      prevPhoto.indexNumber = tempNum;
      await savePhotosBatch([targetPhoto, prevPhoto]);
      await reindexLecturePhotos(targetPhoto.lectureId);
      await refreshData();
    } else if (direction === 'down' && currentIdx < lecturePhotos.length - 1) {
      const nextPhoto = lecturePhotos[currentIdx + 1];
      const tempNum = targetPhoto.indexNumber;
      targetPhoto.indexNumber = nextPhoto.indexNumber;
      nextPhoto.indexNumber = tempNum;
      await savePhotosBatch([targetPhoto, nextPhoto]);
      await reindexLecturePhotos(targetPhoto.lectureId);
      await refreshData();
    }
  };

  const importPackageData = async (
    metadata: LecturePackageMetadata,
    photoData: { fileName: string; indexNumber: number; dataUrl: string }[]
  ): Promise<LectureNode> => {
    // 1. Find or create Year
    let targetYear = years.find(y => y.name === metadata.yearName);
    if (!targetYear) {
      targetYear = await addNewYear(metadata.yearName || 'السنة الأولى');
    }

    // 2. Find or create Semester
    let targetSemester = semesters.find(s => s.yearId === targetYear!.id && s.name === metadata.semesterName);
    if (!targetSemester) {
      targetSemester = await addNewSemester(targetYear.id, metadata.semesterName || 'الفصل الدراسي الأول');
    }

    // 3. Find or create Subject
    let targetSubject = subjects.find(sb => sb.semesterId === targetSemester!.id && sb.name === metadata.subjectName);
    if (!targetSubject) {
      targetSubject = await addNewSubject(targetSemester.id, metadata.subjectName || 'المادة المستوردة');
    }

    // 4. Create Lecture
    const newLecture = await addNewLecture(targetSubject.id, metadata.lectureTitle || `المحاضرة ${metadata.lectureNumber}`);

    // 5. Add Photos
    const photoUrls = photoData.sort((a, b) => a.indexNumber - b.indexNumber).map(p => p.dataUrl);
    await addPhotosToLecture(newLecture.id, photoUrls);

    return newLecture;
  };

  return (
    <AppContext.Provider
      value={{
        years,
        semesters,
        subjects,
        lectures,
        photos,
        settings,
        grades,
        students,
        batchGrades,
        updateGrades,
        addOrUpdateStudent,
        deleteStudent,
        updateBatchGrades,
        updateSubject,
        exportBackup,
        importBackup,
        wipeAllData,
        activeTab,
        setActiveTab,
        selectedYearId,
        setSelectedYearId,
        selectedSemesterId,
        setSelectedSemesterId,
        selectedSubjectId,
        setSelectedSubjectId,
        selectedLectureId,
        setSelectedLectureId,
        isLocked,
        unlockApp,
        lockAppNow,
        resetPasswordWithSecurityAnswer,
        changePassword,
        refreshData,
        updateSettings,
        addNewYear,
        addNewSemester,
        addNewSubject,
        addNewLecture,
        quickAddPhotos,
        addPhotosToLecture,
        deletePhoto,
        deleteLecture,
        deleteSubject,
        reindexLecture,
        movePhotoIndex,
        importPackageData,
        storageStats,
        refreshStorageStats,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
