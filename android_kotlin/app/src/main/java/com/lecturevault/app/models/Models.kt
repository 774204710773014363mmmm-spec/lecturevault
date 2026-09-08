package com.lecturevault.app.models

data class YearNode(
    val id: String,
    val name: String,
    val order: Int
)

data class SemesterNode(
    val id: String,
    val yearId: String,
    val name: String,
    val order: Int
)

data class SubjectNode(
    val id: String,
    val semesterId: String,
    val name: String,
    val code: String = ""
)

data class LectureNode(
    val id: String,
    val subjectId: String,
    val lectureNumber: Int,
    val title: String,
    val createdAt: Long = System.currentTimeMillis()
)

data class PhotoItem(
    val id: String,
    val lectureId: String,
    val indexNumber: Int,
    val fileName: String,
    val dataUrl: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

data class AppSettings(
    val theme: String = "dark",
    val language: String = "ar",
    val currentYearId: String = "y1",
    val currentSemesterId: String = "s1",
    val autoCrop: Boolean = true,
    val docEnhance: Boolean = true,
    val pdfPageSize: String = "A4",
    val pdfHeader: Boolean = true,
    val pdfFooterNumbers: Boolean = true
)
