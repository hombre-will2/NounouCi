package com.nounou.connect.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = Terracotta,
    onPrimary = SurfaceLight,
    primaryContainer = WarmSandLight,
    onPrimaryContainer = TerracottaDark,
    secondary = SageGreen,
    onSecondary = SurfaceLight,
    secondaryContainer = SageGreenLight,
    onSecondaryContainer = TextDark,
    tertiary = WarmSand,
    background = BackgroundLight,
    onBackground = TextDark,
    surface = SurfaceLight,
    onSurface = TextDark,
)

@Composable
fun NounouConnectCITheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        content = content
    )
}
