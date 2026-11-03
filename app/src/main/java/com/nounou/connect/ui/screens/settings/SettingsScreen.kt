package com.nounou.connect.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nounou.connect.data.api.RetrofitClient
import com.nounou.connect.data.storage.UserPreferences
import com.nounou.connect.ui.components.NounouButton
import com.nounou.connect.ui.screens.auth.AuthViewModel
import com.nounou.connect.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    userPreferences: UserPreferences,
    authViewModel: AuthViewModel,
    onNavigateBack: () -> Unit,
    onLogout: () -> Unit
) {
    var baseUrl by remember { mutableStateOf(userPreferences.getBaseUrl()) }
    var saveMessage by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Paramètres", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Terracotta,
                    titleContentColor = SurfaceLight,
                    navigationIconContentColor = SurfaceLight
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundLight)
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Server Config Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceLight)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Dns, contentDescription = null, tint = Terracotta)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Adresse du Serveur Backend", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = baseUrl,
                        onValueChange = { baseUrl = it },
                        label = { Text("URL du Serveur API") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    if (saveMessage != null) {
                        Text(
                            text = saveMessage!!,
                            color = SageGreen,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    NounouButton(
                        text = "Sauvegarder l'adresse",
                        onClick = {
                            userPreferences.saveBaseUrl(baseUrl)
                            RetrofitClient.reset()
                            saveMessage = "URL mise à jour avec succès !"
                        },
                        backgroundColor = SageGreen
                    )
                }
            }

            // Info Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceLight)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = Terracotta)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("À propos de l'application", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text("Application Nounou Connect CI", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Text("Version : 1.0.0 (Native Android Compose)", fontSize = 13.sp, color = TextSecondary)
                    Text("Plateforme de mise en relation Nounous & Familles", fontSize = 13.sp, color = TextSecondary)
                    Text("Côte d'Ivoire", fontSize = 13.sp, color = TextSecondary)
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Logout Button
            if (authViewModel.isLoggedIn()) {
                NounouButton(
                    text = "Se déconnecter",
                    onClick = {
                        authViewModel.logout()
                        onLogout()
                    },
                    backgroundColor = StatusDeclined
                )
            }
        }
    }
}
