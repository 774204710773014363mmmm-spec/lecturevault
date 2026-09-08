import JSZip from 'jszip';
import { PhotoItem, LecturePackageMetadata } from '../types';

export async function createLecturePackageZip(
  yearName: string,
  semesterName: string,
  subjectName: string,
  lectureNumber: number,
  lectureTitle: string,
  photos: PhotoItem[]
): Promise<Blob> {
  const zip = new JSZip();

  const metadata: LecturePackageMetadata = {
    version: '1.0',
    appName: 'UniLectureOrganizer',
    exportDate: new Date().toISOString(),
    yearName,
    semesterName,
    subjectName,
    lectureNumber,
    lectureTitle,
    photoCount: photos.length,
    photos: photos.map(p => ({
      fileName: p.fileName,
      indexNumber: p.indexNumber
    }))
  };

  // Add metadata.json
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  // Add photos folder
  const imagesFolder = zip.folder('photos');

  for (const photo of photos) {
    // Strip data url header to get base64
    const base64Data = photo.dataUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    if (imagesFolder) {
      imagesFolder.file(photo.fileName, base64Data, { base64: true });
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

export interface ParseZipResult {
  metadata: LecturePackageMetadata;
  photos: {
    fileName: string;
    indexNumber: number;
    dataUrl: string;
  }[];
}

export async function parseLecturePackageZip(zipFile: File): Promise<ParseZipResult> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(zipFile);

  const metadataFile = contents.file('metadata.json');
  if (!metadataFile) {
    throw new Error('ملف الحزمة غير صالح: تعذر العثور على ملف البيانات metadata.json داخل الحزمة.');
  }

  const metadataText = await metadataFile.async('text');
  const metadata: LecturePackageMetadata = JSON.parse(metadataText);

  const parsedPhotos: { fileName: string; indexNumber: number; dataUrl: string }[] = [];

  for (const p of metadata.photos) {
    // Look inside photos/ or root
    const photoFile = contents.file(`photos/${p.fileName}`) || contents.file(p.fileName);
    if (photoFile) {
      const base64 = await photoFile.async('base64');
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      parsedPhotos.push({
        fileName: p.fileName,
        indexNumber: p.indexNumber,
        dataUrl
      });
    }
  }

  return { metadata, photos: parsedPhotos };
}
