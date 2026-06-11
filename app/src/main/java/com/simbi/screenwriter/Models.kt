package com.simbi.screenwriter

import java.util.UUID

enum class ScreenplayFormat(val value: String, val label: String, val shortcut: String) {
    SCENE_HEADING("scene-heading", "Scene Heading", "1"),
    ACTION("action", "Action Description", "2"),
    CHARACTER("character", "Character Name", "3"),
    PARENTHETICAL("parenthetical", "Parenthetical Context", "4"),
    DIALOGUE("dialogue", "Dialogue Text", "5"),
    TRANSITION("transition", "Transition Cue", "6"),
    SHOT("shot", "Camera / Shot Detail", "7")
}

data class ScreenplayLine(
    val id: String = UUID.randomUUID().toString(),
    var format: String,
    var text: String,
    var align: String? = null
)

data class IdeaNote(
    val id: String = UUID.randomUUID().toString(),
    var title: String,
    var description: String? = null,
    var content: String, // Serialized HTML / plain text
    var createdAt: String,
    var updatedAt: String
)

data class Script(
    val id: String = UUID.randomUUID().toString(),
    var title: String,
    var writer: String,
    var email: String? = null,
    var phone: String? = null,
    var address: String? = null,
    var notes: String? = null,
    val createdAt: String,
    var updatedAt: String,
    var content: List<ScreenplayLine>
)
