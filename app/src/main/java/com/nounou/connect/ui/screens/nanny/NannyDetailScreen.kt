package com.nounou.connect.ui.screens.nanny

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nounou.connect.data.models.NannyProfile
import com.nounou.connect.data.repository.NannyRepository
import com.nounou.connect.ui.components.AvatarImage
import com.nounou.connect.ui.components.NounouButton
import com.nounou.connect.ui.components.RatingStars
import com.nounou.connect.ui.screens.matches.MatchViewModel
import com.nounou.connect.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NannyDetailScreen(
    nannyId: String,
    nannyRepo: NannyRepository,
    matchViewModel: MatchViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToMatches: () -> Unit
) {
    var nanny by remember { mutableStateOf<NannyProfile?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var showContactDialog by remember { mutableStateOf(false) }
    var messageText by remember { mutableStateOf("Bonjour, je souhaite entrer en contact avec vous pour la garde de mes enfants.") }

    val context = LocalContext.current

    LaunchedEffect(nannyId) {
        val result = nannyRepo.getNanny(nannyId)
        result.fold(
            onSuccess = { nanny = it; isLoading = false },
            onFailure = { error = it.message; isLoading = false }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(nanny?.fullName ?: "Profil Nounou", fontWeight = FontWeight.Bold) },
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
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Terracotta)
            }
        } else if (nanny == null) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text(error ?: "Nounou introuvable", color = TextSecondary)
            }
        } else {
            val item = nanny!!

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(BackgroundLight)
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
            ) {
                // Header profile card
                Card(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceLight)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp).fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        AvatarImage(url = item.photoUrl, name = item.fullName, modifier = Modifier.size(90.dp))

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(text = item.fullName, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = "${item.age} ans · ${item.experienceYears} ans d'expérience",
                            fontSize = 14.sp,
                            color = TextSecondary
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        RatingStars(rating = item.avgRating, reviewCount = item.reviewCount)

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = "${item.hourlyRate} FCFA / mois",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Terracotta
                        )

                        if (!item.phone.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(12.dp))
                            NounouButton(
                                text = "Appeler : ${item.phone}",
                                onClick = {
                                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${item.phone}"))
                                    context.startActivity(intent)
                                },
                                backgroundColor = SageGreen
                            )
                        }
                    }
                }

                // Info Section
                Card(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceLight)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Informations Générales", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Divider(modifier = Modifier.padding(vertical = 8.dp), color = BorderLight)

                        InfoRow(icon = Icons.Default.LocationOn, label = "Quartier", value = "${item.quartier}, ${item.city}")
                        InfoRow(icon = Icons.Default.Schedule, label = "Disponibilité", value = item.availability)
                        if (item.languages.isNotEmpty()) {
                            InfoRow(icon = Icons.Default.Language, label = "Langues parlées", value = item.languages.joinToString(", "))
                        }
                        if (item.childcareTypes.isNotEmpty()) {
                            InfoRow(icon = Icons.Default.ChildCare, label = "Services proposés", value = item.childcareTypes.joinToString(", "))
                        }
                    }
                }

                // Bio
                if (item.bio.isNotBlank()) {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceLight)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Présentation / Bio", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = item.bio, fontSize = 14.sp, color = TextDark)
                        }
                    }
                }

                // Contact Action
                Box(modifier = Modifier.padding(16.dp)) {
                    NounouButton(
                        text = "Faire une demande de contact",
                        onClick = { showContactDialog = true }
                    )
                }
            }
        }
    }

    if (showContactDialog && nanny != null) {
        AlertDialog(
            onDismissRequest = { showContactDialog = false },
            title = { Text("Mise en relation") },
            text = {
                Column {
                    Text("Envoyer un message à ${nanny!!.fullName} pour demander ses coordonnées :")
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = messageText,
                        onValueChange = { messageText = it },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 4
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        matchViewModel.requestContact(
                            nannyId = nanny!!.userId,
                            message = messageText,
                            onDone = {
                                showContactDialog = false
                                onNavigateToMatches()
                            }
                        )
                    }
                ) {
                    Text("Envoyer", color = Terracotta, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showContactDialog = false }) {
                    Text("Annuler")
                }
            }
        )
    }
}

@Composable
fun InfoRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = Terracotta, modifier = Modifier.size(20.dp))
        Spacer(modifier = Modifier.width(10.dp))
        Text(text = "$label : ", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
        Text(text = value, fontSize = 14.sp, color = TextDark)
    }
}
