package com.lecturevault.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lecturevault.app.models.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            LectureVaultTheme {
                LectureVaultApp()
            }
        }
    }
}

@Composable
fun LectureVaultTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            background = Color(0xFF0F172A),
            surface = Color(0xFF1E293B),
            surfaceVariant = Color(0xFF334155),
            primary = Color(0xFFD4AF37),
            onPrimary = Color.Black,
            secondary = Color(0xFF38BDF8),
            onSecondary = Color.Black,
            onBackground = Color(0xFFE2E8F0),
            onSurface = Color(0xFFE2E8F0),
            onSurfaceVariant = Color(0xFF94A3B8),
            outline = Color(0xFF475569)
        ),
        typography = Typography(
            headlineLarge = TextStyle(fontSize = 28.sp, fontWeight = FontWeight.Bold),
            headlineMedium = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Bold),
            titleLarge = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.SemiBold),
            titleMedium = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Medium),
            bodyLarge = TextStyle(fontSize = 16.sp),
            bodyMedium = TextStyle(fontSize = 14.sp),
            labelLarge = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium)
        )
    ) {
        content()
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
            SemesterNode("s1", "y1", "الفصل الأول", 1),
            SemesterNode("s2", "y1", "الفصل الثاني", 2),
            SemesterNode("s3", "y2", "الفصل الأول", 1),
            SemesterNode("s4", "y2", "الفصل الثاني", 2),
            SemesterNode("s5", "y3", "الفصل الأول", 1),
            SemesterNode("s6", "y3", "الفصل الثاني", 2),
            SemesterNode("s7", "y4", "الفصل الأول", 1),
            SemesterNode("s8", "y4", "الفصل الثاني", 2)
        )
    }
    var selectedSemester by remember { mutableStateOf(semesters[0]) }

    val subjects = remember {
        mutableStateListOf(
            SubjectNode("sub1", "s1", "برمجة Kotlin", "CS101"),
            SubjectNode("sub2", "s1", "قواعد البيانات", "CS102"),
            SubjectNode("sub3", "s1", "هياكل البيانات", "CS103"),
            SubjectNode("sub4", "s2", "تطوير Android", "CS201"),
            SubjectNode("sub5", "s2", "شبكات الحاسوب", "CS202"),
            SubjectNode("sub6", "s3", "هندسة البرمجيات", "CS301"),
            SubjectNode("sub7", "s3", "الذكاء الاصطناعي", "CS302"),
            SubjectNode("sub8", "s4", "أمن المعلومات", "CS401")
        )
    }

    val lectures = remember {
        mutableStateListOf(
            LectureNode("lec1", "sub1", 1, "محاضرة 1: مقدمة في Kotlin"),
            LectureNode("lec2", "sub1", 2, "محاضرة 2: المتغيرات والدوال"),
            LectureNode("lec3", "sub1", 3, "محاضرة 3: البرمجة الكائنية"),
            LectureNode("lec4", "sub2", 1, "محاضرة 1: مقدمة في قواعد البيانات"),
            LectureNode("lec5", "sub2", 2, "محاضرة 2: SQL الأساسي"),
            LectureNode("lec6", "sub3", 1, "محاضرة 1: المكدسات والقوائم"),
            LectureNode("lec7", "sub4", 1, "محاضرة 1: مقدمة في Android"),
            LectureNode("lec8", "sub4", 2, "محاضرة 2: Jetpack Compose")
        )
    }

    var selectedSubject by remember { mutableStateOf<SubjectNode?>(null) }

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF1E293B),
                contentColor = Color(0xFF94A3B8)
            ) {
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Explore, contentDescription = null) },
                    label = { Text("الاستكشاف") },
                    selected = activeTab == "explorer",
                    onClick = { activeTab = "explorer" },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFD4AF37),
                        selectedTextColor = Color(0xFFD4AF37),
                        indicatorColor = Color(0xFFD4AF37).copy(alpha = 0.12f)
                    )
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.PictureAsPdf, contentDescription = null) },
                    label = { Text("تصدير PDF") },
                    selected = activeTab == "pdf",
                    onClick = { activeTab = "pdf" },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFD4AF37),
                        selectedTextColor = Color(0xFFD4AF37),
                        indicatorColor = Color(0xFFD4AF37).copy(alpha = 0.12f)
                    )
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Settings, contentDescription = null) },
                    label = { Text("الإعدادات") },
                    selected = activeTab == "settings",
                    onClick = { activeTab = "settings" },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFD4AF37),
                        selectedTextColor = Color(0xFFD4AF37),
                        indicatorColor = Color(0xFFD4AF37).copy(alpha = 0.12f)
                    )
                )
            }
        }
    ) { padding ->
        when (activeTab) {
            "explorer" -> ExplorerScreen(
                modifier = Modifier.padding(padding),
                years = years,
                selectedYear = selectedYear,
                onYearSelected = { selectedYear = it },
                semesters = semesters.filter { it.yearId == selectedYear.id },
                selectedSemester = selectedSemester,
                onSemesterSelected = { selectedSemester = it },
                subjects = subjects.filter { it.semesterId == selectedSemester.id },
                selectedSubject = selectedSubject,
                onSubjectSelected = { selectedSubject = it },
                lectures = if (selectedSubject != null) lectures.filter { it.subjectId == selectedSubject!!.id } else emptyList(),
                onBack = { selectedSubject = null }
            )
            "pdf" -> PdfExportScreen(
                modifier = Modifier.padding(padding),
                subjects = subjects,
                lectures = lectures
            )
            "settings" -> SettingsScreen(modifier = Modifier.padding(padding))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExplorerScreen(
    modifier: Modifier = Modifier,
    years: List<YearNode>,
    selectedYear: YearNode,
    onYearSelected: (YearNode) -> Unit,
    semesters: List<SemesterNode>,
    selectedSemester: SemesterNode,
    onSemesterSelected: (SemesterNode) -> Unit,
    subjects: List<SubjectNode>,
    selectedSubject: SubjectNode?,
    onSubjectSelected: (SubjectNode) -> Unit,
    lectures: List<LectureNode>,
    onBack: () -> Unit
) {
    Column(modifier = modifier.fillMaxSize()) {
        TopAppBar(
            title = {
                Column {
                    Text(
                        text = "منسق المحاضرات",
                        color = Color(0xFFD4AF37),
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp
                    )
                    Text(
                        text = "الاستكشاف والتصفح",
                        color = Color(0xFF94A3B8),
                        fontSize = 12.sp
                    )
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = Color(0xFF0F172A)
            )
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (selectedSubject == null) {
                item {
                    Text(
                        text = "السنوات الدراسية",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(0xFFD4AF37),
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                }

                items(years) { year ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onYearSelected(year) },
                        colors = CardDefaults.cardColors(
                            containerColor = if (selectedYear.id == year.id)
                                Color(0xFFD4AF37).copy(alpha = 0.15f)
                            else Color(0xFF1E293B)
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.School,
                                contentDescription = null,
                                tint = if (selectedYear.id == year.id) Color(0xFFD4AF37) else Color(0xFF94A3B8),
                                modifier = Modifier.size(32.dp)
                            )
                            Spacer(modifier = Modifier.width(16.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = year.name,
                                    style = MaterialTheme.typography.titleLarge,
                                    color = Color(0xFFE2E8F0)
                                )
                                Text(
                                    text = "${semesters.filter { it.yearId == year.id }.size} فصول دراسية",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color(0xFF94A3B8)
                                )
                            }
                            Icon(
                                Icons.Default.ChevronLeft,
                                contentDescription = null,
                                tint = Color(0xFF94A3B8)
                            )
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "الفصول الدراسية - ${selectedYear.name}",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(0xFFD4AF37),
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                }

                items(semesters) { semester ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSemesterSelected(semester) },
                        colors = CardDefaults.cardColors(
                            containerColor = if (selectedSemester.id == semester.id)
                                Color(0xFF38BDF8).copy(alpha = 0.15f)
                            else Color(0xFF1E293B)
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.CalendarMonth,
                                contentDescription = null,
                                tint = if (selectedSemester.id == semester.id) Color(0xFF38BDF8) else Color(0xFF94A3B8),
                                modifier = Modifier.size(28.dp)
                            )
                            Spacer(modifier = Modifier.width(16.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = semester.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = Color(0xFFE2E8F0)
                                )
                                Text(
                                    text = "${subjects.filter { it.semesterId == semester.id }.size} مقررات",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color(0xFF94A3B8)
                                )
                            }
                            Icon(
                                Icons.Default.ChevronLeft,
                                contentDescription = null,
                                tint = Color(0xFF94A3B8)
                            )
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "المقررات - ${selectedSemester.name}",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(0xFFD4AF37),
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                }

                items(subjects) { subject ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSubjectSelected(subject) },
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Book,
                                contentDescription = null,
                                tint = Color(0xFF38BDF8),
                                modifier = Modifier.size(28.dp)
                            )
                            Spacer(modifier = Modifier.width(16.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = subject.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = Color(0xFFE2E8F0)
                                )
                                Text(
                                    text = "كود: ${subject.code}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color(0xFF94A3B8)
                                )
                            }
                            Icon(
                                Icons.Default.ChevronLeft,
                                contentDescription = null,
                                tint = Color(0xFF94A3B8)
                            )
                        }
                    }
                }
            } else {
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onBack() }
                            .padding(bottom = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.ArrowBack,
                            contentDescription = null,
                            tint = Color(0xFFD4AF37)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "رجوع للمقررات",
                            color = Color(0xFFD4AF37),
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                    Text(
                        text = selectedSubject!!.name,
                        style = MaterialTheme.typography.headlineMedium,
                        color = Color(0xFFD4AF37),
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Text(
                        text = "${lectures.size} محاضرات",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFF94A3B8),
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                }

                if (lectures.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 64.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    Icons.Default.MenuBook,
                                    contentDescription = null,
                                    tint = Color(0xFF475569),
                                    modifier = Modifier.size(64.dp)
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    text = "لا توجد محاضرات بعد",
                                    color = Color(0xFF94A3B8),
                                    fontSize = 16.sp
                                )
                            }
                        }
                    }
                }

                items(lectures) { lecture ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFD4AF37).copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${lecture.lectureNumber}",
                                    color = Color(0xFFD4AF37),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 18.sp
                                )
                            }
                            Spacer(modifier = Modifier.width(16.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = lecture.title,
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = Color(0xFFE2E8F0)
                                )
                            }
                            Icon(
                                Icons.Default.CameraAlt,
                                contentDescription = "التقاط صورة",
                                tint = Color(0xFF38BDF8),
                                modifier = Modifier
                                    .size(32.dp)
                                    .clickable { }
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PdfExportScreen(
    modifier: Modifier = Modifier,
    subjects: List<SubjectNode>,
    lectures: List<LectureNode>
) {
    Column(modifier = modifier.fillMaxSize()) {
        TopAppBar(
            title = {
                Text(
                    text = "تصدير PDF",
                    color = Color(0xFFD4AF37),
                    fontWeight = FontWeight.Bold
                )
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0F172A))
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Icon(
                            Icons.Default.PictureAsPdf,
                            contentDescription = null,
                            tint = Color(0xFFD4AF37),
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "تصدير المحاضرات كملف PDF",
                            style = MaterialTheme.typography.titleLarge,
                            color = Color(0xFFE2E8F0)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "اختر المقررات التي تريد تصدير محاضراتها",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color(0xFF94A3B8)
                        )
                    }
                }
            }

            items(subjects) { subject ->
                val subjectLectures = lectures.filter { it.subjectId == subject.id }
                var selected by remember { mutableStateOf(false) }

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { selected = !selected },
                    colors = CardDefaults.cardColors(
                        containerColor = if (selected)
                            Color(0xFFD4AF37).copy(alpha = 0.15f)
                        else Color(0xFF1E293B)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = selected,
                            onCheckedChange = { selected = it },
                            colors = CheckboxDefaults.colors(
                                checkedColor = Color(0xFFD4AF37)
                            )
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = subject.name,
                                style = MaterialTheme.typography.titleMedium,
                                color = Color(0xFFE2E8F0)
                            )
                            Text(
                                text = "${subjectLectures.size} محاضرات",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color(0xFF94A3B8)
                            )
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = { },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFD4AF37)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Download, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "تصدير PDF",
                        color = Color.Black,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxSize()) {
        TopAppBar(
            title = {
                Text(
                    text = "الإعدادات",
                    color = Color(0xFFD4AF37),
                    fontWeight = FontWeight.Bold
                )
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0F172A))
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                SettingsSection(title = "المظهر") {
                    SettingsItem(
                        icon = Icons.Default.DarkMode,
                        title = "الوضع الداكن",
                        subtitle = "مفعّل",
                        onClick = { }
                    )
                    SettingsItem(
                        icon = Icons.Default.Language,
                        title = "اللغة",
                        subtitle = "العربية",
                        onClick = { }
                    )
                }
            }

            item {
                SettingsSection(title = "البيانات") {
                    SettingsItem(
                        icon = Icons.Default.CloudUpload,
                        title = "رفع البيانات للسحابة",
                        subtitle = "مزامنة مع Firebase",
                        onClick = { }
                    )
                    SettingsItem(
                        icon = Icons.Default.CloudDownload,
                        title = "تنزيل البيانات",
                        subtitle = "آخر مزامنة: اليوم",
                        onClick = { }
                    )
                }
            }

            item {
                SettingsSection(title = "عام") {
                    SettingsItem(
                        icon = Icons.Default.Info,
                        title = "عن التطبيق",
                        subtitle = "الإصدار 1.0.0",
                        onClick = { }
                    )
                }
            }
        }
    }
}

@Composable
fun SettingsSection(
    title: String,
    content: @Composable () -> Unit
) {
    Column {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = Color(0xFFD4AF37),
            modifier = Modifier.padding(bottom = 8.dp, top = 8.dp)
        )
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column {
                content()
            }
        }
    }
}

@Composable
fun SettingsItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            icon,
            contentDescription = null,
            tint = Color(0xFFD4AF37),
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                color = Color(0xFFE2E8F0)
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0xFF94A3B8)
            )
        }
        Icon(
            Icons.Default.ChevronLeft,
            contentDescription = null,
            tint = Color(0xFF475569)
        )
    }
}

