package com.lecturevault.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lecturevault.app.models.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    background = Color(0xFF0F172A),
                    surface = Color(0xFF1E293B),
                    primary = Color(0xFFD4AF37),
                    secondary = Color(0xFF38BDF8)
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF0F172A)
                ) {
                    LectureVaultApp()
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LectureVaultApp() {
    var activeTab by remember { mutableStateOf("explorer") }

    val years = remember {
        listOf(
            YearNode("y1", "السنة الأولى", 1),
            YearNode("y2", "السنة الثانية", 2),
            YearNode("y3", "السنة الثالثة", 3),
            YearNode("y4", "السنة الرابعة", 4)
        )
    }

    var selectedYear by remember { mutableStateOf(years[0]) }

    val semesters = remember {
        listOf(
            SemesterNode("s1", "y1", "الترم الأول", 1),
            SemesterNode("s2", "y1", "الترم الثاني", 2)
        )
    }

    var selectedSemester by remember { mutableStateOf(semesters[0]) }

    val subjects = remember {
        mutableStateListOf(
            SubjectNode("sub1", "s1", "البرمجة بلغة Kotlin", "CS301"),
            SubjectNode("sub2", "s1", "قواعد البيانات Advanced DB", "CS302"),
            SubjectNode("sub3", "s1", "شبكات الحاسوب", "CS303"),
            SubjectNode("sub4", "s1", "ذكاء اصطناعي Machine Learning", "CS304")
        )
    }

    val lectures = remember {
        mutableStateListOf(
            LectureNode("lec1", "sub1", 1, "المحاضرة 1: مقدمة في Kotlin & Android"),
            LectureNode("lec2", "sub1", 2, "المحاضرة 2: بناء الواجهات مع Jetpack Compose"),
            LectureNode("lec3", "sub2", 1, "المحاضرة 1: تصميم المخططات ERD & SQL")
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "منسق المحاضرات الجامعية",
                            color = Color(0xFFD4AF37),
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Text(
                            text = "تطبيق أندرويد متكامل (Kotlin Native)",
                            color = Color(0xFF94A3B8),
                            fontSize = 11.sp
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0F172A)
                )
            ),
        bottomBar = {
            NavigationBar(containerColor = Color(0xFF1E293B)) {
                NavigationBarItem(
                    selected = activeTab == "explorer",
                    onClick = { activeTab = "explorer" },
                    label = { Text("المستعرض") },
                    icon = { Text("📁", fontSize = 18.sp) }
                )
                NavigationBarItem(
                    selected = activeTab == "add",
                    onClick = { activeTab = "add" },
                    label = { Text("إضافة جديدة") },
                    icon = { Text("📷", fontSize = 18.sp) }
                )
                NavigationBarItem(
                    selected = activeTab == "pdf",
                    onClick = { activeTab = "pdf" },
                    label = { Text("تصدير PDF") },
                    icon = { Text("📄", fontSize = 18.sp) }
                )
                NavigationBarItem(
                    selected = activeTab == "settings",
                    onClick = { activeTab = "settings" },
                    label = { Text("الإعدادات") },
                    icon = { Text("⚙️", fontSize = 18.sp) }
                )
            }
        },
        containerColor = Color(0xFF0F172A)
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .padding(16.dp)
                .fillMaxSize()
        ) {
            when (activeTab) {
                "explorer" -> ExplorerScreen(
                    years = years,
                    selectedYear = selectedYear,
                    onSelectYear = { selectedYear = it },
                    semesters = semesters,
                    selectedSemester = selectedSemester,
                    onSelectSemester = { selectedSemester = it },
                    subjects = subjects,
                    lectures = lectures
                )
                "add" -> QuickAddScreen(subjects = subjects)
                "pdf" -> PdfExportScreen(lectures = lectures)
                "settings" -> SettingsScreen()
            }
        }
    }
}

@Composable
fun ExplorerScreen(
    years: List<YearNode>,
    selectedYear: YearNode,
    onSelectYear: (YearNode) -> Unit,
    semesters: List<SemesterNode>,
    selectedSemester: SemesterNode,
    onSelectSemester: (SemesterNode) -> Unit,
    subjects: List<SubjectNode>,
    lectures: List<LectureNode>
) {
    Column {
        // Years Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            years.forEach { year ->
                val isSelected = year.id == selectedYear.id
                Surface(
                    color = if (isSelected) Color(0xFFD4AF37) else Color(0xFF1E293B),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.clickable { onSelectYear(year) }
                ) {
                    Text(
                        text = year.name,
                        color = if (isSelected) Color.Black else Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }
        }

        // Subjects Section
        Text(
            text = "المواد الدراسية في ${selectedSemester.name}",
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(subjects) { subject ->
                val subLectures = lectures.filter { it.subjectId == subject.id }
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = subject.name,
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                            Text(
                                text = subject.code,
                                color = Color(0xFF38BDF8),
                                fontSize = 12.sp
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "عدد المحاضرات: ${subLectures.size}",
                            color = Color(0xFF94A3B8),
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun QuickAddScreen(subjects: List<SubjectNode>) {
    Column(modifier = Modifier.fillMaxSize()) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "إضافة صورة محاضرة جديدة 📷",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "يمكنك التلتقاط من كاميرا الجوال أو اختيار الصور من الاستوديو وتوجيهها للمادة مباشرة.",
                    color = Color(0xFF94A3B8),
                    fontSize = 13.sp
                )
            }
        }
        Button(
            onClick = { /* Handle camera/gallery in native Android */ },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD4AF37)),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().height(50.dp)
        ) {
            Text("افتح الكاميرا / الاستوديو", color = Color.Black, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun PdfExportScreen(lectures: List<LectureNode>) {
    Column(modifier = Modifier.fillMaxSize()) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "تصدير المحاضرة إلى ملف PDF 📄",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "تحويل جميع الصور المحفوظة في المحاضرة إلى ملف PDF عالي الجودة ومشاركته.",
                    color = Color(0xFF94A3B8),
                    fontSize = 13.sp
                )
            }
        }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(lectures) { lec ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = lec.title, color = Color.White, fontSize = 14.sp)
                        Button(
                            onClick = { },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8))
                        ) {
                            Text("تصدير PDF", color = Color.Black, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsScreen() {
    Column(modifier = Modifier.fillMaxSize()) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "إعدادات التطبيق (Kotlin Settings)",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(text = "• اللغة: العربية", color = Color(0xFF94A3B8), fontSize = 13.sp)
                Text(text = "• المظهر: داكن (Dark Slate)", color = Color(0xFF94A3B8), fontSize = 13.sp)
                Text(text = "• حجم ورقة الـ PDF: A4", color = Color(0xFF94A3B8), fontSize = 13.sp)
                Text(text = "• تحسين الصور التلقائي: مفعل", color = Color(0xFF94A3B8), fontSize = 13.sp)
            }
        }
    }
}
