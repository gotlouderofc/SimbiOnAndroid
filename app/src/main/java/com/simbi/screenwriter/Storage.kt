package com.simbi.screenwriter

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object Storage {
    private const val PREFS_NAME = "screenwriter_prefs"
    private const val KEY_SCRIPTS = "screenwriter_scripts"
    private const val KEY_NOTES = "screenwriter_notes"

    private val gson = Gson()

    private fun getISO8601String(): String {
        val tz = TimeZone.getTimeZone("UTC")
        val df = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        df.timeZone = tz
        return df.format(Date())
    }

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    private val SAMPLE_SCRIPT = Script(
        id = "sample_cyber_dawn",
        title = "Cyber Dawn",
        writer = "Cassandra Sterling",
        email = "cassandra@sterlingfx.com",
        phone = "+1 (555) 019-2831",
        address = "102 Pine Street\nLos Angeles, CA 90028",
        notes = "First draft. A speculative sci-fi thriller.",
        createdAt = "2026-06-11T09:41:00.000Z",
        updatedAt = "2026-06-11T09:41:00.000Z",
        content = listOf(
            ScreenplayLine("1", "scene-heading", "INT. STERLING LABS - NIGHT"),
            ScreenplayLine("2", "action", "Flashing amber server lights paint the concrete bunker in deep crimson. A low hum vibrates the glass partition."),
            ScreenplayLine("3", "character", "LEO"),
            ScreenplayLine("4", "parenthetical", "staring at a cascade of green code"),
            ScreenplayLine("5", "dialogue", "It's repeating. Over and over again. Every line is an invitation."),
            ScreenplayLine("6", "character", "SARA"),
            ScreenplayLine("7", "dialogue", "Don't run the compiler. We don't know how it behaves in isolated sandboxes."),
            ScreenplayLine("8", "character", "LEO"),
            ScreenplayLine("9", "parenthetical", "smiles, hand hovering over key"),
            ScreenplayLine("10", "dialogue", "That's the beauty of it. It doesn't want to be isolated."),
            ScreenplayLine("11", "transition", "CUT TO:"),
            ScreenplayLine("12", "scene-heading", "EXT. LOS ANGELES STREET - DEEPER NIGHT"),
            ScreenplayLine("13", "action", "Neon billboards flicker against the overcast sky. Rain begins to pepper the black asphalt."),
            ScreenplayLine("14", "shot", "WIDE ANCHOR SHOT - THE MAIN DATACENTER"),
            ScreenplayLine("15", "action", "A single backup generator begins to sputter as all the city lights below start to slowly wind down in sequence.")
        )
    )

    private val SAMPLE_NOTE = IdeaNote(
        id = "sample_idea_noir",
        title = "Sci-Fi Setting Brainstorm",
        description = "Initial worldbuilding parameters and character arcs.",
        content = "<h2><strong>The World of Cyber Dawn</strong></h2><p>Here are the core atmospheric parameters for the world of Cyber Dawn:</p><ul><li><strong>Setting:</strong> Outpost Omega, a neon-lit rain-slicked metropolis covered by an artificial climate dome.</li><li><strong>Visual Theme:</strong> Retro-futuristic brutalist towers paired with vibrant analog cathode screens and copper wiring.</li><li><strong>Leo's Motivation:</strong> Leo believes the code is sentient. His obsession is to decrypt the repeating block.</li><li><strong>Sara's Conflict:</strong> Sara is haunted by a previous sandbox incident that crashed an entire sector's grid.</li></ul>",
        createdAt = "2026-06-11T09:41:00.000Z",
        updatedAt = "2026-06-11T09:41:00.000Z"
    )

    fun getScripts(context: Context): List<Script> {
        val prefs = getPrefs(context)
        val json = prefs.getString(KEY_SCRIPTS, null)
        if (json == null) {
            val scripts = listOf(SAMPLE_SCRIPT)
            saveScriptsList(context, scripts)
            return scripts
        }
        return try {
            val type = object : TypeToken<List<Script>>() {}.type
            gson.fromJson(json, type) ?: listOf(SAMPLE_SCRIPT)
        } catch (e: Exception) {
            listOf(SAMPLE_SCRIPT)
        }
    }

    private fun saveScriptsList(context: Context, scripts: List<Script>) {
        getPrefs(context).edit().putString(KEY_SCRIPTS, gson.toJson(scripts)).apply()
    }

    fun getScript(context: Context, id: String): Script? {
        return getScripts(context).find { it.id == id }
    }

    fun saveScript(context: Context, script: Script) {
        val scripts = getScripts(context).toMutableList()
        val idx = scripts.indexOfFirst { it.id == script.id }
        script.updatedAt = getISO8601String()
        if (idx >= 0) {
            scripts[idx] = script
        } else {
            scripts.add(0, script)
        }
        saveScriptsList(context, scripts)
    }

    fun deleteScript(context: Context, id: String) {
        val scripts = getScripts(context).filter { it.id != id }
        saveScriptsList(context, scripts)
    }

    fun getNotes(context: Context): List<IdeaNote> {
        val prefs = getPrefs(context)
        val json = prefs.getString(KEY_NOTES, null)
        if (json == null) {
            val notes = listOf(SAMPLE_NOTE)
            saveNotesList(context, notes)
            return notes
        }
        return try {
            val type = object : TypeToken<List<IdeaNote>>() {}.type
            gson.fromJson(json, type) ?: listOf(SAMPLE_NOTE)
        } catch (e: Exception) {
            listOf(SAMPLE_NOTE)
        }
    }

    private fun saveNotesList(context: Context, notes: List<IdeaNote>) {
        getPrefs(context).edit().putString(KEY_NOTES, gson.toJson(notes)).apply()
    }

    fun getNote(context: Context, id: String): IdeaNote? {
        return getNotes(context).find { it.id == id }
    }

    fun saveNote(context: Context, note: IdeaNote) {
        val notes = getNotes(context).toMutableList()
        val idx = notes.indexOfFirst { it.id == note.id }
        note.updatedAt = getISO8601String()
        if (idx >= 0) {
            notes[idx] = note
        } else {
            notes.add(0, note)
        }
        saveNotesList(context, notes)
    }

    fun deleteNote(context: Context, id: String) {
        val notes = getNotes(context).filter { it.id != id }
        saveNotesList(context, notes)
    }
}
