import { PhotoItem, LectureNode, SubjectNode, SemesterNode, YearNode, AppSettings, StudentNode } from '../types';

const DB_NAME = 'UniLectureOrganizerDB';
const DB_VERSION = 1;

export const defaultSettings: AppSettings = {
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
  storageLocation: 'المساحة المحلية الداخلية (IndexedDB / Scoped Storage)',
  isLocked: false,
  hasPasswordSet: false,
  passwordPin: '',
  securityQuestion: 'ما هو لونك المفضل؟',
  securityAnswer: '',
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('years')) {
        db.createObjectStore('years', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('semesters')) {
        db.createObjectStore('semesters', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('subjects')) {
        db.createObjectStore('subjects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('lectures')) {
        db.createObjectStore('lectures', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('photos')) {
        const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
        photoStore.createIndex('lectureId', 'lectureId', { unique: false });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Sample helper canvas SVG data URL generator for initial demo photos
function generateSampleLectureBoardPhoto(title: string, pageNum: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Green chalkboard or clean paper background
  const isChalk = pageNum % 2 === 1;
  if (isChalk) {
    ctx.fillStyle = '#1A3323';
    ctx.fillRect(0, 0, 1200, 1600);
    // Grid lines
    ctx.strokeStyle = '#274A33';
    ctx.lineWidth = 2;
    for (let i = 0; i < 1600; i += 80) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1200, i);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, 1200, 1600);
    // Paper lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    for (let i = 0; i < 1600; i += 60) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1200, i);
      ctx.stroke();
    }
    // Margin line
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(100, 1600);
    ctx.stroke();
  }

  // Header Banner
  ctx.fillStyle = isChalk ? 'rgba(212, 175, 55, 0.2)' : 'rgba(15, 23, 42, 0.05)';
  ctx.fillRect(40, 40, 1120, 140);

  // Title Text
  ctx.fillStyle = isChalk ? '#E5C158' : '#0F172A';
  ctx.font = 'bold 44px sans-serif';
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillText(title, 1120, 100);

  ctx.font = '28px sans-serif';
  ctx.fillStyle = isChalk ? '#94A3B8' : '#64748B';
  ctx.fillText(`صفحة المحاضرة رقم: 00${pageNum}`, 1120, 150);

  // Sample handwritten lecture notes simulation
  ctx.fillStyle = isChalk ? '#FFFFFF' : '#1E293B';
  ctx.font = '32px serif';

  const notes = [
    '١. مقدمة ومفاهيم رئيسية في المقرر الجامعي',
    '٢. المعادلة الأساسية والتحليل الهيكلي للنظام',
    '• f(x) = ∫ (x² + 2x + 1) dx = x³/3 + x² + x + C',
    '٣. الرسم البياني والتسلسل المنهجي للمحاضرة',
    '٤. ملاحظات هامة للامتحان والتمارين التطبيقية',
    '• مراجعة الفصل الأول والثاني قبل التطبيق العملي'
  ];

  notes.forEach((line, index) => {
    ctx.fillText(line, 1100, 260 + index * 90);
  });

  // Diagram Box Simulation
  ctx.strokeStyle = isChalk ? '#38BDF8' : '#2563EB';
  ctx.lineWidth = 4;
  ctx.strokeRect(150, 850, 900, 500);

  ctx.fillStyle = isChalk ? '#38BDF8' : '#2563EB';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('رسم توضيحي ومخطط المحاضرة', 600, 920);

  // Concentric Circles Diagram
  ctx.beginPath();
  ctx.arc(600, 1120, 140, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(600, 1120, 70, 0, Math.PI * 2);
  ctx.stroke();

  // Watermark Footer
  ctx.fillStyle = isChalk ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('UniLecture Organizer - 00' + pageNum, 60, 1560);

  return canvas.toDataURL('image/jpeg', 0.85);
}

export async function initDatabaseIfNeeded(): Promise<void> {
  const db = await openDB();

  // Check if years exist
  const yearCount = await new Promise<number>((resolve) => {
    const tx = db.transaction('years', 'readonly');
    const store = tx.objectStore('years');
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
  });

  if (yearCount === 0) {
    // Populate Initial Sample Data
    const tx = db.transaction(['years', 'semesters', 'subjects', 'lectures', 'photos', 'settings'], 'readwrite');

    const years: YearNode[] = [
      { id: 'year-1', name: 'السنة الأولى', order: 1 },
      { id: 'year-2', name: 'السنة الثانية', order: 2 },
      { id: 'year-3', name: 'السنة الثالثة', order: 3 },
      { id: 'year-4', name: 'السنة الرابعة', order: 4 },
    ];

    const semesters: SemesterNode[] = [
      { id: 'sem-1', yearId: 'year-1', name: 'الفصل الدراسي الأول (الترم 1)', order: 1 },
      { id: 'sem-2', yearId: 'year-1', name: 'الفصل الدراسي الثاني (الترم 2)', order: 2 },
    ];

    const subjects: SubjectNode[] = [
      { id: 'subj-1', semesterId: 'sem-1', name: 'البرمجة الشيئية (OOP)', code: 'CS101' },
      { id: 'subj-2', semesterId: 'sem-1', name: 'الرياضيات الهندسية', code: 'MATH102' },
      { id: 'subj-3', semesterId: 'sem-1', name: 'قواعد البيانات', code: 'DB103' },
    ];

    const lectures: LectureNode[] = [
      { id: 'lect-1', subjectId: 'subj-1', lectureNumber: 1, title: 'المحاضرة 1 - المقدمة والمفاهيم', createdAt: Date.now() - 86400000 * 3 },
      { id: 'lect-2', subjectId: 'subj-1', lectureNumber: 2, title: 'المحاضرة 2 - الفئات والكائنات Classes', createdAt: Date.now() - 86400000 * 2 },
      { id: 'lect-3', subjectId: 'subj-2', lectureNumber: 1, title: 'المحاضرة 1 - المصفوفات والمحددات', createdAt: Date.now() - 86400000 },
    ];

    const photo1_1 = generateSampleLectureBoardPhoto('المحاضرة 1 - المقدمة والمفاهيم', 1);
    const photo1_2 = generateSampleLectureBoardPhoto('المحاضرة 1 - المقدمة والمفاهيم', 2);
    const photo2_1 = generateSampleLectureBoardPhoto('المحاضرة 2 - الفئات والكائنات Classes', 1);

    const photos: PhotoItem[] = [
      { id: 'p-1', lectureId: 'lect-1', indexNumber: 1, fileName: '001.jpg', dataUrl: photo1_1, createdAt: Date.now() - 86400000 * 3 },
      { id: 'p-2', lectureId: 'lect-1', indexNumber: 2, fileName: '002.jpg', dataUrl: photo1_2, createdAt: Date.now() - 86400000 * 3 + 1000 },
      { id: 'p-3', lectureId: 'lect-2', indexNumber: 1, fileName: '001.jpg', dataUrl: photo2_1, createdAt: Date.now() - 86400000 * 2 },
    ];

    years.forEach(y => tx.objectStore('years').put(y));
    semesters.forEach(s => tx.objectStore('semesters').put(s));
    subjects.forEach(sb => tx.objectStore('subjects').put(sb));
    lectures.forEach(l => tx.objectStore('lectures').put(l));
    photos.forEach(p => tx.objectStore('photos').put(p));
    tx.objectStore('settings').put({ id: 'app_settings', ...defaultSettings });
  }
}

export async function getAllYears(): Promise<YearNode[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('years', 'readonly');
    const store = tx.objectStore('years');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
}

export async function getAllSemesters(): Promise<SemesterNode[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('semesters', 'readonly');
    const store = tx.objectStore('semesters');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
}

export async function getAllSubjects(): Promise<SubjectNode[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('subjects', 'readonly');
    const store = tx.objectStore('subjects');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
}

export async function getAllLectures(): Promise<LectureNode[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('lectures', 'readonly');
    const store = tx.objectStore('lectures');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
}

export async function getAllPhotos(): Promise<PhotoItem[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('photos', 'readonly');
    const store = tx.objectStore('photos');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
}

export async function getPhotosByLectureId(lectureId: string): Promise<PhotoItem[]> {
  const all = await getAllPhotos();
  return all.filter(p => p.lectureId === lectureId).sort((a, b) => a.indexNumber - b.indexNumber);
}

// Data Mutation Handlers
export async function saveYear(year: YearNode): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('years', 'readwrite');
  tx.objectStore('years').put(year);
}

export async function saveSemester(semester: SemesterNode): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('semesters', 'readwrite');
  tx.objectStore('semesters').put(semester);
}

export async function saveSubject(subject: SubjectNode): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('subjects', 'readwrite');
  tx.objectStore('subjects').put(subject);
}

export async function saveLecture(lecture: LectureNode): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('lectures', 'readwrite');
  tx.objectStore('lectures').put(lecture);
}

export async function savePhoto(photo: PhotoItem): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('photos', 'readwrite');
  tx.objectStore('photos').put(photo);
}

export async function savePhotosBatch(photos: PhotoItem[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('photos', 'readwrite');
  const store = tx.objectStore('photos');
  photos.forEach(p => store.put(p));
}

export async function deletePhoto(photoId: string, lectureId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('photos', 'readwrite');
  tx.objectStore('photos').delete(photoId);

  // Auto Re-index photos in the lecture to close numerical gaps
  setTimeout(async () => {
    await reindexLecturePhotos(lectureId);
  }, 100);
}

export async function deleteLecture(lectureId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['lectures', 'photos'], 'readwrite');
  tx.objectStore('lectures').delete(lectureId);

  const photoStore = tx.objectStore('photos');
  const allPhotos = await getAllPhotos();
  allPhotos.filter(p => p.lectureId === lectureId).forEach(p => photoStore.delete(p.id));
}

export async function deleteSubject(subjectId: string): Promise<void> {
  const db = await openDB();
  const lectures = await getAllLectures();
  const subjectLectures = lectures.filter(l => l.subjectId === subjectId);

  for (const l of subjectLectures) {
    await deleteLecture(l.id);
  }

  const tx = db.transaction('subjects', 'readwrite');
  tx.objectStore('subjects').delete(subjectId);
}

export async function reindexLecturePhotos(lectureId: string): Promise<PhotoItem[]> {
  const photos = await getPhotosByLectureId(lectureId);
  photos.sort((a, b) => a.indexNumber - b.indexNumber);

  const updatedPhotos: PhotoItem[] = photos.map((p, idx) => {
    const newIdx = idx + 1;
    const formattedNum = newIdx < 10 ? `00${newIdx}` : newIdx < 100 ? `0${newIdx}` : `${newIdx}`;
    return {
      ...p,
      indexNumber: newIdx,
      fileName: `${formattedNum}.jpg`
    };
  });

  await savePhotosBatch(updatedPhotos);
  return updatedPhotos;
}

// Settings Handlers
export async function getSettings(): Promise<AppSettings> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const req = store.get('app_settings');
    req.onsuccess = () => {
      if (req.result) {
        const { id, ...settingsData } = req.result;
        resolve({ ...defaultSettings, ...settingsData });
      } else {
        resolve(defaultSettings);
      }
    };
  });
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('settings', 'readwrite');
  tx.objectStore('settings').put({ id: 'app_settings', ...settings });
}

export async function getGrades(): Promise<Record<string, number>> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const req = store.get('app_grades');
    req.onsuccess = () => {
      if (req.result && req.result.gradesData) {
        resolve(req.result.gradesData);
      } else {
        resolve({});
      }
    };
    req.onerror = () => resolve({});
  });
}

export async function saveGrades(gradesData: Record<string, number>): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('settings', 'readwrite');
  tx.objectStore('settings').put({ id: 'app_grades', gradesData });
}

export async function calculateStorageUsage(): Promise<{ totalMB: number; photoCount: number; lectureCount: number }> {
  const photos = await getAllPhotos();
  const lectures = await getAllLectures();

  let totalBytes = 0;
  photos.forEach(p => {
    totalBytes += (p.dataUrl.length * 0.75); // approx base64 size
  });

  return {
    totalMB: Number((totalBytes / (1024 * 1024)).toFixed(2)),
    photoCount: photos.length,
    lectureCount: lectures.length
  };
}

export async function getStudents(): Promise<StudentNode[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const req = store.get('app_students');
    req.onsuccess = () => {
      if (req.result && req.result.studentsData) {
        resolve(req.result.studentsData);
      } else {
        // Default initial demo student
        resolve([{ id: 'st-1', name: 'الطالب الأول (افتراضي)' }]);
      }
    };
    req.onerror = () => resolve([{ id: 'st-1', name: 'الطالب الأول (افتراضي)' }]);
  });
}

export async function saveStudents(studentsData: StudentNode[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('settings', 'readwrite');
  tx.objectStore('settings').put({ id: 'app_students', studentsData });
}

export async function getBatchGrades(): Promise<Record<string, Record<string, number>>> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const req = store.get('app_batch_grades');
    req.onsuccess = () => {
      if (req.result && req.result.batchGradesData) {
        resolve(req.result.batchGradesData);
      } else {
        resolve({});
      }
    };
    req.onerror = () => resolve({});
  });
}

export async function saveBatchGrades(batchGradesData: Record<string, Record<string, number>>): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('settings', 'readwrite');
  tx.objectStore('settings').put({ id: 'app_batch_grades', batchGradesData });
}

export async function exportFullBackup(): Promise<string> {
  const years = await getAllYears();
  const semesters = await getAllSemesters();
  const subjects = await getAllSubjects();
  const lectures = await getAllLectures();
  const photos = await getAllPhotos();
  const students = await getStudents();
  const batchGrades = await getBatchGrades();
  const singleGrades = await getGrades();
  const settings = await getSettings();

  const backupData = {
    appName: 'منسق المحاضرات والنتائج الجامعية',
    exportDate: new Date().toISOString(),
    years,
    semesters,
    subjects,
    lectures,
    photos,
    students,
    batchGrades,
    singleGrades,
    settings
  };

  return JSON.stringify(backupData, null, 2);
}

export async function importFullBackup(jsonData: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonData);
    if (!data.subjects && !data.lectures && !data.years) {
      throw new Error('ملف بيانات غير صالح');
    }

    const db = await openDB();

    if (data.years && Array.isArray(data.years)) {
      const tx = db.transaction('years', 'readwrite');
      tx.objectStore('years').clear();
      data.years.forEach((y: YearNode) => tx.objectStore('years').put(y));
    }
    if (data.semesters && Array.isArray(data.semesters)) {
      const tx = db.transaction('semesters', 'readwrite');
      tx.objectStore('semesters').clear();
      data.semesters.forEach((s: SemesterNode) => tx.objectStore('semesters').put(s));
    }
    if (data.subjects && Array.isArray(data.subjects)) {
      const tx = db.transaction('subjects', 'readwrite');
      tx.objectStore('subjects').clear();
      data.subjects.forEach((sb: SubjectNode) => tx.objectStore('subjects').put(sb));
    }
    if (data.lectures && Array.isArray(data.lectures)) {
      const tx = db.transaction('lectures', 'readwrite');
      tx.objectStore('lectures').clear();
      data.lectures.forEach((l: LectureNode) => tx.objectStore('lectures').put(l));
    }
    if (data.photos && Array.isArray(data.photos)) {
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').clear();
      data.photos.forEach((p: PhotoItem) => tx.objectStore('photos').put(p));
    }

    if (data.students && Array.isArray(data.students)) {
      await saveStudents(data.students);
    }
    if (data.batchGrades) {
      await saveBatchGrades(data.batchGrades);
    }
    if (data.singleGrades) {
      await saveGrades(data.singleGrades);
    }

    return true;
  } catch (err) {
    console.error('Failed to import backup:', err);
    return false;
  }
}

export async function wipeAllAcademicData(): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(['years', 'semesters', 'subjects', 'lectures', 'photos', 'settings'], 'readwrite');

    tx.objectStore('years').clear();
    tx.objectStore('semesters').clear();
    tx.objectStore('subjects').clear();
    tx.objectStore('lectures').clear();
    tx.objectStore('photos').clear();

    tx.objectStore('settings').put({ id: 'app_students', studentsData: [] });
    tx.objectStore('settings').put({ id: 'app_batch_grades', batchGradesData: {} });
    tx.objectStore('settings').put({ id: 'app_grades', gradesData: {} });

    return true;
  } catch (err) {
    console.error('Error wiping academic data:', err);
    return false;
  }
}

