package com.simbi.screenwriter

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.gson.Gson
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.UUID

// Simbi Color Palette constants
object SimbiColor {
    val Background = Color(0xFFFAF9F6) // Elegant soft off-white
    val Surface = Color(0xFFFFFFFF)    // Crisp white
    val Primary = Color(0xFF97CC5B)    // Signature Light Green
    val Secondary = Color(0xFFCEE7AA)  // Pale Secondary Green
    val Accent = Color(0xFF9ACD32)     // Vibrant Lime Accent
    val TextDark = Color(0xFF111111)   // Deep rich charcoal
    val TextMuted = Color(0xFF666666)  // Cool grey
    val Highlight = Color(0xFFFBBF24)  // Amber / Scene Highlight Gold
    val SelectedBg = Color(0xFFEBF4E2) // Soft selected green hue
    val Border = Color(0xFFE5E5E5)     // Light clean borders
}

sealed class Screen {
    object Catalog : Screen()
    data class Editor(val scriptId: String) : Screen()
    data class NoteEditor(val noteId: String) : Screen()
}

data class ToastData(val message: String, val isError: Boolean = false)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SimbiApp()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SimbiApp() {
    val context = androidx.compose.ui.platform.LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    // State vectors
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Catalog) }
    var scripts by remember { mutableStateOf(Storage.getScripts(context)) }
    var notes by remember { mutableStateOf(Storage.getNotes(context)) }
    var toast by remember { mutableStateOf<ToastData?>(null) }

    // Helper: Show floating status toast matching web-app styling
    fun showToast(msg: String, isError: Boolean = false) {
        toast = ToastData(msg, isError)
        coroutineScope.launch {
            delay(2500)
            if (toast?.message == msg) {
                toast = null
            }
        }
    }

    // Modal / Dialog variables
    var showCreateScriptDialog by remember { mutableStateOf(false) }
    var showCreateNoteDialog by remember { mutableStateOf(false) }
    var showImportSimbidocDialog by remember { mutableStateOf(false) }
    var showEditScriptMetaDialog by remember { mutableStateOf<Script?>(null) }
    var showEditNoteMetaDialog by remember { mutableStateOf<IdeaNote?>(null) }
    var showShareExportDialog by remember { mutableStateOf<Any?>(null) }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = SimbiColor.Background
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (val screen = currentScreen) {
                is Screen.Catalog -> {
                    CatalogView(
                        scripts = scripts,
                        notes = notes,
                        onCreateScript = { showCreateScriptDialog = true },
                        onCreateNote = { showCreateNoteDialog = true },
                        onOpenScript = { id -> currentScreen = Screen.Editor(id) },
                        onOpenNote = { id -> currentScreen = Screen.NoteEditor(id) },
                        onEditScriptMeta = { s -> showEditScriptMetaDialog = s },
                        onEditNoteMeta = { n -> showEditNoteMetaDialog = n },
                        onDeleteScript = { id ->
                            Storage.deleteScript(context, id)
                            scripts = Storage.getScripts(context)
                            showToast("Screenplay deleted securely")
                        },
                        onDeleteNote = { id ->
                            Storage.deleteNote(context, id)
                            notes = Storage.getNotes(context)
                            showToast("Idea note deleted securely")
                        },
                        onOpenImportDialog = { showImportSimbidocDialog = true }
                    )
                }
                is Screen.Editor -> {
                    val script = scripts.find { it.id == screen.scriptId }
                    if (script != null) {
                        EditorView(
                            initialScript = script,
                            onBackToCatalog = { updated ->
                                Storage.saveScript(context, updated)
                                scripts = Storage.getScripts(context)
                                currentScreen = Screen.Catalog
                                showToast("Returned to catalogue", false)
                            },
                            onSaveScript = { updated ->
                                Storage.saveScript(context, updated)
                                scripts = Storage.getScripts(context)
                                showToast("Saved securely!", false)
                            },
                            onShareExport = { showShareExportDialog = it },
                            showToastAlert = { msg, isErr -> showToast(msg, isErr) }
                        )
                    } else {
                        currentScreen = Screen.Catalog
                        showToast("Screenplay not found", true)
                    }
                }
                is Screen.NoteEditor -> {
                    val note = notes.find { it.id == screen.noteId }
                    if (note != null) {
                        NoteEditorView(
                            initialNote = note,
                            onBackToCatalog = { updated ->
                                Storage.saveNote(context, updated)
                                notes = Storage.getNotes(context)
                                currentScreen = Screen.Catalog
                                showToast("Workspace notes saved", false)
                            },
                            onSaveNote = { updated ->
                                Storage.saveNote(context, updated)
                                notes = Storage.getNotes(context)
                                showToast("Notes saved securely", false)
                            },
                            onShareNote = { showShareExportDialog = it }
                        )
                    } else {
                        currentScreen = Screen.Catalog
                        showToast("Idea note not found", true)
                    }
                }
            }

            // Beautiful minimal Floating Status Notification Toast
            toast?.let {
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 32.dp, start = 24.dp, end = 24.dp)
                        .background(
                            if (it.isError) Color(0xFFEF4444) else Color(0xFF1E293B),
                            RoundedCornerShape(8.dp)
                        )
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    Text(
                        text = it.message,
                        color = Color.White,
                        fontSize = 13.sp,
                        fontFamily = FontFamily.Monospace,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }

    // Dialog: Create Screenplay
    if (showCreateScriptDialog) {
        var title by remember { mutableStateOf("") }
        var writer by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showCreateScriptDialog = false },
            title = { Text("New Screenplay", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Title") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = writer,
                        onValueChange = { writer = it },
                        label = { Text("Writer / Author") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (title.isBlank()) {
                            showToast("Title is required", true)
                            return@Button
                        }
                        val newScript = Script(
                            title = title,
                            writer = if (writer.isBlank()) "Unknown Writer" else writer,
                            createdAt = System.currentTimeMillis().toString(),
                            updatedAt = System.currentTimeMillis().toString(),
                            content = listOf(
                                ScreenplayLine(UUID.randomUUID().toString(), "scene-heading", "INT. LOCATION - DAY"),
                                ScreenplayLine(UUID.randomUUID().toString(), "action", "Introduce the scene here.")
                            )
                        )
                        Storage.saveScript(context, newScript)
                        scripts = Storage.getScripts(context)
                        showCreateScriptDialog = false
                        currentScreen = Screen.Editor(newScript.id)
                        showToast("Created ${newScript.title}", false)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SimbiColor.Primary, contentColor = Color.Black)
                ) {
                    Text("Create", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateScriptDialog = false }) {
                    Text("Cancel", color = Color.Gray)
                }
            }
        )
    }

    // Dialog: Create Idea Note
    if (showCreateNoteDialog) {
        var title by remember { mutableStateOf("") }
        var desc by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showCreateNoteDialog = false },
            title = { Text("New Idea Note", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Title") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = desc,
                        onValueChange = { desc = it },
                        label = { Text("Brief Description (Optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (title.isBlank()) {
                            showToast("Title is required", true)
                            return@Button
                        }
                        val newNote = IdeaNote(
                            title = title,
                            description = desc,
                            content = "<h2><strong>${title} Screenplay Worldbuilding</strong></h2><p>Provide initial parameters and arcs here...</p>",
                            createdAt = System.currentTimeMillis().toString(),
                            updatedAt = System.currentTimeMillis().toString()
                        )
                        Storage.saveNote(context, newNote)
                        notes = Storage.getNotes(context)
                        showCreateNoteDialog = false
                        currentScreen = Screen.NoteEditor(newNote.id)
                        showToast("Created ${newNote.title}", false)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SimbiColor.Primary, contentColor = Color.Black)
                ) {
                    Text("Create", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateNoteDialog = false }) {
                    Text("Cancel", color = Color.Gray)
                }
            }
        )
    }

    // Dialog: Import Simbidoc File Content
    if (showImportSimbidocDialog) {
        var rawJson by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showImportSimbidocDialog = false },
            title = { Text("Import Simbidoc", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Paste raw .simbidoc JSON text payload below:", fontSize = 12.sp, color = Color.Gray)
                    OutlinedTextField(
                        value = rawJson,
                        onValueChange = { rawJson = it },
                        label = { Text("Simbidoc JSON Text") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp),
                        textStyle = TextStyle(fontFamily = FontFamily.Monospace, fontSize = 11.sp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (rawJson.isBlank()) return@Button
                        try {
                            val gsonParser = Gson()
                            val wrapped = gsonParser.fromJson(rawJson, Map::class.java)
                            if (wrapped["simbiSign"] != "SIMBI_DOCUMENT_v1") {
                                showToast("Invalid Simbi document signature", true)
                                return@Button
                            }
                            val docType = wrapped["docType"] as? String
                            val payloadJson = gsonParser.toJson(wrapped["payload"])
                            
                            if (docType == "script") {
                                val script = gsonParser.fromJson(payloadJson, Script::class.java)
                                val imported = script.copy(
                                    id = "imported_script_" + System.currentTimeMillis(),
                                    updatedAt = System.currentTimeMillis().toString()
                                )
                                Storage.saveScript(context, imported)
                                scripts = Storage.getScripts(context)
                                showImportSimbidocDialog = false
                                currentScreen = Screen.Editor(imported.id)
                                showToast("Imported screenplay!", false)
                            } else if (docType == "note") {
                                val note = gsonParser.fromJson(payloadJson, IdeaNote::class.java)
                                val imported = note.copy(
                                    id = "imported_note_" + System.currentTimeMillis(),
                                    updatedAt = System.currentTimeMillis().toString()
                                )
                                Storage.saveNote(context, imported)
                                notes = Storage.getNotes(context)
                                showImportSimbidocDialog = false
                                currentScreen = Screen.NoteEditor(imported.id)
                                showToast("Imported idea notes!", false)
                            } else {
                                showToast("Unrecognized document format type", true)
                            }
                        } catch (e: Exception) {
                            showToast("Failed to parse JSON document text", true)
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SimbiColor.Primary, contentColor = Color.Black)
                ) {
                    Text("Import", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showImportSimbidocDialog = false }) {
                    Text("Cancel", color = Color.Gray)
                }
            }
        )
    }

    // Dialog: Edit Script Meta
    showEditScriptMetaDialog?.let { currentScript ->
        var title by remember { mutableStateOf(currentScript.title) }
        var writer by remember { mutableStateOf(currentScript.writer) }
        var email by remember { mutableStateOf(currentScript.email ?: "") }
        var phone by remember { mutableStateOf(currentScript.phone ?: "") }
        var address by remember { mutableStateOf(currentScript.address ?: "") }
        var notesMeta by remember { mutableStateOf(currentScript.notes ?: "") }

        AlertDialog(
            onDismissRequest = { showEditScriptMetaDialog = null },
            title = { Text("Edit Metadata", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.verticalScroll(rememberScrollState())
                ) {
                    OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Title") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = writer, onValueChange = { writer = it }, label = { Text("Writer / Author") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email Contact") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Phone Number") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = address, onValueChange = { address = it }, label = { Text("Mailing Address") }, modifier = Modifier.fillMaxWidth(), maxLines = 3)
                    OutlinedTextField(value = notesMeta, onValueChange = { notesMeta = it }, label = { Text("Loglines / Core Notes") }, modifier = Modifier.fillMaxWidth(), maxLines = 3)
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val updated = currentScript.copy(
                            title = title,
                            writer = writer,
                            email = email,
                            phone = phone,
                            address = address,
                            notes = notesMeta,
                            updatedAt = System.currentTimeMillis().toString()
                        )
                        Storage.saveScript(context, updated)
                        scripts = Storage.getScripts(context)
                        showEditScriptMetaDialog = null
                        showToast("Settings updated securely", false)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SimbiColor.Primary, contentColor = Color.Black)
                ) {
                    Text("Save", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditScriptMetaDialog = null }) {
                    Text("Cancel", color = Color.Gray)
                }
            }
        )
    }

    // Dialog: Edit Note Meta
    showEditNoteMetaDialog?.let { currentNote ->
        var title by remember { mutableStateOf(currentNote.title) }
        var desc by remember { mutableStateOf(currentNote.description ?: "") }

        AlertDialog(
            onDismissRequest = { showEditNoteMetaDialog = null },
            title = { Text("Edit Notebook Meta", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Title") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = desc, onValueChange = { desc = it }, label = { Text("Brief Description") }, modifier = Modifier.fillMaxWidth())
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val updated = currentNote.copy(
                            title = title,
                            description = desc,
                            updatedAt = System.currentTimeMillis().toString()
                        )
                        Storage.saveNote(context, updated)
                        notes = Storage.getNotes(context)
                        showEditNoteMetaDialog = null
                        showToast("Notebook updated securely", false)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SimbiColor.Primary, contentColor = Color.Black)
                ) {
                    Text("Save", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditNoteMetaDialog = null }) {
                    Text("Cancel", color = Color.Gray)
                }
            }
        )
    }

    // Dialog: Share & Export .Simbidoc file payload (Copyable JSON)
    showShareExportDialog?.let { payload ->
        val dialogTitle = if (payload is Script) "Share Screenplay" else "Share Notebook"
        val label = if (payload is Script) "Copy .simbidoc payload to clipboard:" else "Copy .simbidoc payload to clipboard:"
        val simbiDocJson = remember {
            val type = if (payload is Script) "script" else "note"
            val envelope = mapOf(
                "simbiSign" to "SIMBI_DOCUMENT_v1",
                "docType" to type,
                "payload" to payload
            )
            Gson().toJson(envelope)
        }

        AlertDialog(
            onDismissRequest = { showShareExportDialog = null },
            title = { Text(dialogTitle, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(label, fontSize = 12.sp, color = Color.Gray)
                    OutlinedTextField(
                        value = simbiDocJson,
                        onValueChange = {},
                        readOnly = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp),
                        textStyle = TextStyle(fontFamily = FontFamily.Monospace, fontSize = 10.sp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        val clip = ClipData.newPlainText("simbidoc", simbiDocJson)
                        clipboard.setPrimaryClip(clip)
                        showShareExportDialog = null
                        showToast("Copied to clipboard!", false)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SimbiColor.Primary, contentColor = Color.Black)
                ) {
                    Text("Copy", fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showShareExportDialog = null }) {
                    Text("Close", color = Color.Gray)
                }
            }
        )
    }
}

@Composable
fun CatalogView(
    scripts: List<Script>,
    notes: List<IdeaNote>,
    onCreateScript: () -> Unit,
    onCreateNote: () -> Unit,
    onOpenScript: (String) -> Unit,
    onOpenNote: (String) -> Unit,
    onEditScriptMeta: (Script) -> Unit,
    onEditNoteMeta: (IdeaNote) -> Unit,
    onDeleteScript: (String) -> Unit,
    onDeleteNote: (String) -> Unit,
    onOpenImportDialog: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) } // 0: Screenplays, 1: Idea Notes

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SimbiColor.Background)
    ) {
        // App header mimicking index.html
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(SimbiColor.Surface)
                .padding(horizontal = 24.dp, vertical = 20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Simbi: ScreenWriter Pro",
                        fontSize = 24.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.Black
                    )
                    Text(
                        text = "AN ELEGANT DISTRACTION-FREE SCREENPLAY WORKSPACE",
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        color = SimbiColor.TextMuted,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp
                    )
                }
                
                Button(
                    onClick = onOpenImportDialog,
                    colors = ButtonDefaults.buttonColors(containerColor = SimbiColor.SelectedBg, contentColor = Color.Black),
                    shape = RoundedCornerShape(6.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text("Import .simbidoc", fontSize = 11.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                }
            }
        }

        Divider(color = SimbiColor.Border)

        // Custom beautiful tabs
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(SimbiColor.Surface)
        ) {
            val tabs = listOf("Screenplays", "Idea Notes")
            tabs.forEachIndexed { index, title ->
                val isSelected = selectedTab == index
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { selectedTab = index }
                        .padding(vertical = 16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = title,
                            fontSize = 14.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) Color.Black else Color.Gray
                        )
                        if (isSelected) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Box(
                                modifier = Modifier
                                    .size(width = 40.dp, height = 3.dp)
                                    .background(SimbiColor.Primary)
                            )
                        }
                    }
                }
            }
        }

        Divider(color = SimbiColor.Border)

        // Content Area
        Box(
            modifier = Modifier
                .fillMaxSize()
                .weight(1f)
                .padding(16.dp)
        ) {
            if (selectedTab == 0) {
                // Screenplays view
                Column(modifier = Modifier.fillMaxSize()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "ACTIVE SCRIPTS (${scripts.size})",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = Color.Black
                        )
                        Button(
                            onClick = onCreateScript,
                            colors = ButtonDefaults.buttonColors(containerColor = SimbiColor.Primary, contentColor = Color.Black),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text("+ New Screenplay", fontSize = 12.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    if (scripts.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .weight(1f),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No screenplays in catalog.\nTap + New Screenplay to begin.", textAlign = TextAlign.Center, color = Color.Gray, fontFamily = FontFamily.Monospace, fontSize = 13.sp)
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxWidth().weight(1f),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(scripts.size) { i ->
                                val script = scripts[i]
                                ScriptCatalogItem(
                                    script = script,
                                    onOpen = { onOpenScript(script.id) },
                                    onEdit = { onEditScriptMeta(script) },
                                    onDelete = { onDeleteScript(script.id) }
                                )
                            }
                        }
                    }
                }
            } else {
                // Idea Notes tab
                Column(modifier = Modifier.fillMaxSize()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "NOTEBOOKS (${notes.size})",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = Color.Black
                        )
                        Button(
                            onClick = onCreateNote,
                            colors = ButtonDefaults.buttonColors(containerColor = SimbiColor.Primary, contentColor = Color.Black),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text("+ New Note", fontSize = 12.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    if (notes.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .weight(1f),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No notebooks or drafts here.\nTap + New Note to begin outlines.", textAlign = TextAlign.Center, color = Color.Gray, fontFamily = FontFamily.Monospace, fontSize = 13.sp)
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxWidth().weight(1f),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(notes.size) { i ->
                                val note = notes[i]
                                NoteCatalogItem(
                                    note = note,
                                    onOpen = { onOpenNote(note.id) },
                                    onEdit = { onEditNoteMeta(note) },
                                    onDelete = { onDeleteNote(note.id) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ScriptCatalogItem(
    script: Script,
    onOpen: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SimbiColor.Surface),
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, SimbiColor.Border)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = script.title,
                        fontSize = 18.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = Color.Black
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "by ${script.writer}",
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        color = SimbiColor.TextMuted
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    IconButton(onClick = onEdit) {
                        Text("⚙", fontSize = 18.sp)
                    }
                    IconButton(onClick = onDelete) {
                        Text("🗑", fontSize = 18.sp, color = Color.Red)
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Divider(color = SimbiColor.Border)
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${script.content.size} elements",
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    color = Color.Gray
                )
                Button(
                    onClick = onOpen,
                    colors = ButtonDefaults.buttonColors(containerColor = SimbiColor.Primary, contentColor = Color.Black),
                    shape = RoundedCornerShape(4.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text("Write", fontSize = 12.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun NoteCatalogItem(
    note: IdeaNote,
    onOpen: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SimbiColor.Surface),
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, SimbiColor.Border)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = note.title,
                        fontSize = 18.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = Color.Black
                    )
                    note.description?.let {
                        if (it.isNotBlank()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = it,
                                fontSize = 12.sp,
                                fontFamily = FontFamily.Monospace,
                                color = SimbiColor.TextMuted,
                                fontStyle = FontStyle.Italic
                            )
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    IconButton(onClick = onEdit) {
                        Text("⚙", fontSize = 18.sp)
                    }
                    IconButton(onClick = onDelete) {
                        Text("🗑", fontSize = 18.sp, color = Color.Red)
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Divider(color = SimbiColor.Border)
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Brainstorm file",
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    color = Color.Gray
                )
                Button(
                    onClick = onOpen,
                    colors = ButtonDefaults.buttonColors(containerColor = SimbiColor.Primary, contentColor = Color.Black),
                    shape = RoundedCornerShape(4.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text("Edit Notes", fontSize = 12.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// Rich Text scrolling Outline / Brainstorm Notepad screen
@Composable
fun NoteEditorView(
    initialNote: IdeaNote,
    onBackToCatalog: (IdeaNote) -> Unit,
    onSaveNote: (IdeaNote) -> Unit,
    onShareNote: (IdeaNote) -> Unit
) {
    var rawText by remember { mutableStateOf(initialNote.content) }
    var title by remember { mutableStateOf(initialNote.title) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SimbiColor.Background)
    ) {
        // Notepad Top toolbar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(SimbiColor.Surface)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(onClick = { onBackToCatalog(initialNote.copy(title = title, content = rawText)) }) {
                Text("❮", fontSize = 20.sp, fontWeight = FontWeight.Bold)
            }

            Text(
                text = "${title} workspace",
                fontSize = 14.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                color = Color.Black,
                modifier = Modifier.weight(1f),
                textAlign = TextAlign.Center
            )

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                IconButton(onClick = { onShareNote(initialNote.copy(title = title, content = rawText)) }) {
                    Text("📤", fontSize = 18.sp, color = Color.Gray)
                }
                IconButton(onClick = { onSaveNote(initialNote.copy(title = title, content = rawText)) }) {
                    Text("💾", fontSize = 18.sp, color = SimbiColor.Accent)
                }
            }
        }

        Divider(color = SimbiColor.Border)

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(16.dp)
                .background(SimbiColor.Surface, RoundedCornerShape(8.dp))
                .padding(16.dp)
        ) {
            Text("IDEAS & WORLD OUTLINES SCRATCHPAD", fontSize = 10.sp, fontFamily = FontFamily.Monospace, color = Color.Gray, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(12.dp))
            
            OutlinedTextField(
                value = rawText,
                onValueChange = { rawText = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                textStyle = TextStyle(fontFamily = FontFamily.Monospace, fontSize = 13.sp, color = Color.Black, lineHeight = 18.sp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color.Transparent,
                    unfocusedBorderColor = Color.Transparent
                )
            )
        }
    }
}

// Full Screen Screenplay formatting typing editor Screen
@Composable
fun EditorView(
    initialScript: Script,
    onBackToCatalog: (Script) -> Unit,
    onSaveScript: (Script) -> Unit,
    onShareExport: (Script) -> Unit,
    showToastAlert: (String, Boolean) -> Unit
) {
    var title by remember { mutableStateOf(initialScript.title) }
    val scriptLines = remember { mutableStateListOf<ScreenplayLine>().apply { addAll(initialScript.content) } }
    
    // Editor State variables
    var activeLineIdx by remember { mutableStateOf(0) }
    var isNavigatorOpen by remember { mutableStateOf(false) } // Scene Navigator toggle
    var isSearchOpen by remember { mutableStateOf(false) }
    var searchTxt by remember { mutableStateOf("") }

    // Live Analytics calculations matching original js logic
    val countWords = remember(scriptLines.size) {
        scriptLines.sumOf { (it.text.trim().split(Regex("\\s+")).filter { w -> w.isNotBlank() }.size) }
    }
    val countScenes = remember(scriptLines.size) {
        scriptLines.count { it.format == "scene-heading" }
    }
    // Simple projection page calculations: 1 screenplay element typically approximates 1/15 minute or page height equivalence
    val countPages = remember(scriptLines.size) {
        val calculated = (scriptLines.size / 15.0).toInt() + 1
        if (calculated < 1) 1 else calculated
    }

    // List of scene indices for Jump Navigation
    val listScenes = remember(scriptLines.size) {
        scriptLines.mapIndexedNotNull { index, line ->
            if (line.format == "scene-heading") Pair(line.text, index) else null
        }
    }

    val lazyListState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SimbiColor.Background)
    ) {
        // Toolbar Top Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(SimbiColor.Surface)
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(onClick = {
                val updated = initialScript.copy(content = scriptLines.toList())
                onBackToCatalog(updated)
            }) {
                Text("❮", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }

            Column(
                modifier = Modifier.weight(1f),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = title,
                    fontSize = 14.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black
                )
                Text(
                    text = "Words: $countWords | Pages: $countPages",
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    color = Color.Gray
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // Scene Navigator toggle button
                IconButton(onClick = { isNavigatorOpen = !isNavigatorOpen }) {
                    Text("🧭", fontSize = 18.sp, color = if (isNavigatorOpen) SimbiColor.Accent else Color.Gray)
                }
                // Search toggle
                IconButton(onClick = { isSearchOpen = !isSearchOpen }) {
                    Text("🔍", fontSize = 18.sp, color = if (isSearchOpen) SimbiColor.Accent else Color.Gray)
                }
                // Share .simbidoc
                IconButton(onClick = {
                    val updated = initialScript.copy(content = scriptLines.toList())
                    onShareExport(updated)
                }) {
                    Text("📤", fontSize = 18.sp, color = Color.Gray)
                }
                // Manual Save
                IconButton(onClick = {
                    val updated = initialScript.copy(content = scriptLines.toList())
                    onSaveScript(updated)
                }) {
                    Text("💾", fontSize = 18.sp, color = SimbiColor.Accent)
                }
            }
        }

        Divider(color = SimbiColor.Border)

        // Find/Search Overlay
        if (isSearchOpen) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SimbiColor.Surface)
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = searchTxt,
                    onValueChange = { searchTxt = it },
                    placeholder = { Text("Search text...", fontSize = 12.sp) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    textStyle = TextStyle(fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                )
                Button(
                    onClick = {
                        if (searchTxt.isNotBlank()) {
                            // Find matching index and scroll to it
                            val matchIdx = scriptLines.indexOfFirst { it.text.contains(searchTxt, ignoreCase = true) }
                            if (matchIdx >= 0) {
                                activeLineIdx = matchIdx
                                coroutineScope.launch {
                                    lazyListState.animateScrollToItem(matchIdx)
                                }
                                showToastAlert("Found match at element ${matchIdx + 1}", false)
                            } else {
                                showToastAlert("No matches found", true)
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SimbiColor.SelectedBg, contentColor = Color.Black),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text("Find", fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                }
            }
            Divider(color = SimbiColor.Border)
        }

        Row(modifier = Modifier.fillMaxWidth().weight(1f)) {
            // Optional Left Sliding Scene Navigator Drawer
            if (isNavigatorOpen) {
                Column(
                    modifier = Modifier
                        .fillMaxHeight()
                        .width(180.dp)
                        .background(SimbiColor.Surface)
                        .padding(8.dp)
                ) {
                    Text(
                        text = "SCENES NAV",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Gray,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Divider(color = SimbiColor.Border)
                    Spacer(modifier = Modifier.height(8.dp))

                    if (listScenes.isEmpty()) {
                        Text(
                            text = "Add SCENE HEADING to outline script structure",
                            fontSize = 10.sp,
                            color = Color.Gray,
                            fontFamily = FontFamily.Monospace,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(8.dp)
                        )
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            itemsIndexed(listScenes) { idx, scenePair ->
                                val text = scenePair.first
                                val lineIndex = scenePair.second
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(
                                            if (activeLineIdx == lineIndex) SimbiColor.SelectedBg else Color.Transparent,
                                            RoundedCornerShape(4.dp)
                                        )
                                        .clickable {
                                            activeLineIdx = lineIndex
                                            coroutineScope.launch {
                                                lazyListState.animateScrollToItem(lineIndex)
                                            }
                                        }
                                        .padding(horizontal = 6.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = text.uppercase(),
                                        fontSize = 11.sp,
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.Bold,
                                        color = if (activeLineIdx == lineIndex) Color(0xFF5D8F25) else Color.Black,
                                        maxLines = 1
                                    )
                                }
                            }
                        }
                    }
                }
                Box(modifier = Modifier.fillMaxHeight().width(1.dp).background(SimbiColor.Border))
            }

            // Central screenplay scroll view
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .weight(1f)
                    .background(SimbiColor.Background)
            ) {
                LazyColumn(
                    state = lazyListState,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                        .background(SimbiColor.Surface, RoundedCornerShape(4.dp))
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    itemsIndexed(scriptLines) { index, line ->
                        EditableLineRow(
                            line = line,
                            isActive = activeLineIdx == index,
                            onFocus = { activeLineIdx = index },
                            onChangeText = { txt ->
                                scriptLines[index] = line.copy(text = txt)
                            }
                        )
                    }
                }
            }
        }

        // Expanded Focused Formatting Controls Panel (Standard active tools drawer)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(SimbiColor.Surface)
                .padding(8.dp)
        ) {
            Text(
                text = "FORMATTING CONTROLS (${scriptLines[activeLineIdx].format.uppercase()})",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = Color.Gray,
                modifier = Modifier.padding(start = 8.dp, bottom = 6.dp)
            )

            // Horizontal scrolling row of screenplay formats
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                val formats = listOf(
                    Pair("scene", "Heading"),
                    Pair("action", "Action"),
                    Pair("character", "Char"),
                    Pair("parenthetical", "Parent"),
                    Pair("dialogue", "Dialogue"),
                    Pair("transition", "Transit"),
                    Pair("shot", "Shot")
                )

                formats.forEach { pair ->
                    val formatCode = when (pair.first) {
                        "scene" -> "scene-heading"
                        else -> pair.first
                    }
                    val isSelected = scriptLines[activeLineIdx].format == formatCode
                    Button(
                        onClick = {
                            val activeLine = scriptLines[activeLineIdx]
                            scriptLines[activeLineIdx] = activeLine.copy(format = formatCode)
                            showToastAlert("Changed format to ${pair.second}", false)
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isSelected) SimbiColor.Primary else SimbiColor.SelectedBg,
                            contentColor = Color.Black
                        ),
                        shape = RoundedCornerShape(4.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(pair.second, fontSize = 11.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))
            Divider(color = SimbiColor.Border)
            Spacer(modifier = Modifier.height(4.dp))

            // Sequence modifiers: insert before, insert after, shift format up/down, delete line
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Insert before
                Button(
                    onClick = {
                        val activeFormat = scriptLines[activeLineIdx].format
                        scriptLines.add(activeLineIdx, ScreenplayLine(UUID.randomUUID().toString(), activeFormat, ""))
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE2E8F0), contentColor = Color.Black),
                    shape = RoundedCornerShape(4.dp),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("+ Before", fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                }

                // Insert after
                Button(
                    onClick = {
                        val nextIdx = activeLineIdx + 1
                        val activeFormat = scriptLines[activeLineIdx].format
                        val targetFormat = when (activeFormat) {
                            "character" -> "dialogue"
                            "parenthetical" -> "dialogue"
                            "dialogue" -> "action"
                            "scene-heading" -> "action"
                            else -> "action"
                        }
                        scriptLines.add(nextIdx, ScreenplayLine(UUID.randomUUID().toString(), targetFormat, ""))
                        activeLineIdx = nextIdx
                        coroutineScope.launch {
                            lazyListState.animateScrollToItem(nextIdx)
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SimbiColor.Primary, contentColor = Color.Black),
                    shape = RoundedCornerShape(4.dp),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                    modifier = Modifier.weight(1.3f)
                ) {
                    Text("+ Add Next Element", fontSize = 11.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                }

                // Delete node
                Button(
                    onClick = {
                        if (scriptLines.size > 1) {
                            scriptLines.removeAt(activeLineIdx)
                            if (activeLineIdx >= scriptLines.size) {
                                activeLineIdx = scriptLines.size - 1
                            }
                        } else {
                            scriptLines[0] = ScreenplayLine(UUID.randomUUID().toString(), "scene-heading", "")
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEE2E2), contentColor = Color.Red),
                    shape = RoundedCornerShape(4.dp),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                    modifier = Modifier.weight(0.9f)
                ) {
                    Text("🗑 Delete", fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                }
            }
        }
    }
}

// Display line of script formatting 1-to-1 with screenplay margins
@Composable
fun EditableLineRow(
    line: ScreenplayLine,
    isActive: Boolean,
    onFocus: () -> Unit,
    onChangeText: (String) -> Unit
) {
    // Exact typewriter formatting offsets based on screenplay rules
    val alignment = when (line.format) {
        "character", "dialogue", "parenthetical" -> TextAlign.Center
        "transition" -> TextAlign.Right
        else -> TextAlign.Left
    }

    val style = when (line.format) {
        "scene-heading", "character", "transition", "shot" -> TextStyle(
            fontFamily = FontFamily.Monospace,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = Color.Black
        )
        "parenthetical" -> TextStyle(
            fontFamily = FontFamily.Monospace,
            fontSize = 13.sp,
            fontStyle = FontStyle.Italic,
            color = Color.DarkGray
        )
        else -> TextStyle(
            fontFamily = FontFamily.Monospace,
            fontSize = 13.sp,
            color = Color.Black
        )
    }

    val paddingModifier = when (line.format) {
        "scene-heading" -> Modifier.padding(top = 10.dp, bottom = 4.dp)
        "character" -> Modifier.padding(start = 60.dp, end = 60.dp, top = 8.dp)
        "dialogue" -> Modifier.padding(start = 40.dp, end = 40.dp, bottom = 8.dp)
        "parenthetical" -> Modifier.padding(start = 50.dp, end = 50.dp, bottom = 2.dp)
        "transition" -> Modifier.padding(top = 8.dp, bottom = 8.dp)
        else -> Modifier.padding(vertical = 4.dp)
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                if (isActive) SimbiColor.SelectedBg else Color.Transparent,
                RoundedCornerShape(4.dp)
            )
            .clickable { onFocus() }
            .then(paddingModifier)
            .padding(horizontal = 8.dp, vertical = 6.dp)
    ) {
        OutlinedTextField(
            value = line.text,
            onValueChange = onChangeText,
            modifier = Modifier.fillMaxWidth(),
            textStyle = style.copy(textAlign = alignment),
            placeholder = {
                Text(
                    text = when (line.format) {
                        "scene-heading" -> "INT. LOCATION - DAY"
                        "character" -> "CHARACTER NAME"
                        "parenthetical" -> "(action details)"
                        "dialogue" -> "Dialogue typing..."
                        "transition" -> "CUT TO:"
                        "shot" -> "WIDE SHOT detail..."
                        else -> "Describe action details..."
                    },
                    style = style.copy(textAlign = alignment, color = Color.LightGray)
                )
            },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color.Transparent,
                unfocusedBorderColor = Color.Transparent,
                focusedContainerColor = Color.Transparent,
                unfocusedContainerColor = Color.Transparent
            ),
            singleLine = (line.format == "scene-heading" || line.format == "character" || line.format == "transition")
        )
    }
}
