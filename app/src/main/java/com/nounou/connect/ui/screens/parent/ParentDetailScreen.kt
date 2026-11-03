package com.nounou.connect.ui.screens.parent

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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nounou.connect.data.models.ParentProfile
import com.nounou.connect.data.repository.ParentRepository
import com.nounou.connect.ui.components.AvatarImage
import com.nounou.connect.ui.components.NounouButton
import com.nounou.connect.ui.screens.matches.MatchViewModel
import com.nounou.connect.ui.screens.nanny.InfoRow
import com.nounou.connect.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ParentDetailScreen(
    parentId: String,
    parentRepo: ParentRepository,
    matchViewModel: MatchViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToMatches: () -> Unit
) {
    var parent by remember { mutableStateOf<ParentProfile?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var showContactDialog by remember { mutableStateOf(false) }
    var messageText by remember { mutableStateOf("Bonjour, je suis disponible pour m'occuper de vos enfants.") }

    val context = LocalContext.current

    LaunchedEffect(parentId) {
        val result = parentRepo.getParent(parentId)
        result.fold(
            onSuccess = { parent = it; isLoading = false },
            onFailure = { error = it.message; isLoading = false }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(parent?.fullName ?: "Profil Famille", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = SageGreen,
                    titleContentColor = SurfaceLight,
                    navigationIconContentColor = SurfaceLight
                )
            )
        }
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = SageGreen)
            }
        } else if (parent == null) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text(error ?: "Famille introuvable", color = TextSecondary)
            }
        } else {
            val item = parent!!

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(BackgroundLight)
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
            ) {
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

                        Text(text = "${item.quartier}, ${item.city}", fontSize = 14.sp, color = TextSecondary)

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = "Budget max : ${item.budgetMax} FCFA",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = SageGreen
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

                Card(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceLight)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Détails du besoin", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Divider(modifier = Modifier.padding(vertical = 8.dp), color = BorderLight)

                        InfoRow(icon = Icons.Default.ChildCare, label = "Nombre d'enfants", value = "${item.childrenCount}")
                        InfoRow(icon = Icons.Default.Work, label = "Type de garde", value = item.careType)
                        InfoRow(icon = Icons.Default.Schedule, label = "Horaires", value = item.schedule)
                    }
                }

                if (item.needsDescription.isNotBlank()) {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceLight)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Description / Consignes", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = item.needsDescription, fontSize = 14.sp, color = TextDark)
                        }
                    }
                }

                Box(modifier = Modifier.padding(16.dp)) {
                    NounouButton(
                        text = "Proposer mes services à cette famille",
                        onClick = { showContactDialog = true },
                        backgroundColor = SageGreen
                    )
                }
            }
        }
    }

    if (showContactDialog && parent != null) {
        AlertDialog(
            onDismissRequest = { showContactDialog = false },
            title = { Text("Proposer mes services") },
            text = {
                Column {
                    Text("Envoyer un message à ${parent!!.fullName} :")
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
                            parentId = parent!!.userId,
                            message = messageText,
                            onDone = {
                                showContactDialog = false
                                onNavigateToMatches()
                            }
                        )
                    }
                ) {
                    Text("Envoyer", color = SageGreen, fontWeight = FontWeight.Bold)
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
