package com.nounou.connect.ui.screens.matches

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nounou.connect.data.models.Match
import com.nounou.connect.ui.components.AvatarImage
import com.nounou.connect.ui.components.StatusBadge
import com.nounou.connect.ui.screens.auth.AuthViewModel
import com.nounou.connect.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MatchesScreen(
    matchViewModel: MatchViewModel,
    authViewModel: AuthViewModel,
    onNavigateBack: () -> Unit
) {
    val state by matchViewModel.state.collectAsState()
    val currentUser = authViewModel.getCurrentUser()

    LaunchedEffect(Unit) {
        matchViewModel.loadMatches()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mes Mises en Relation", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour")
                    }
                },
                actions = {
                    IconButton(onClick = { matchViewModel.loadMatches() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Actualiser")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Terracotta,
                    titleContentColor = SurfaceLight,
                    navigationIconContentColor = SurfaceLight,
                    actionIconContentColor = SurfaceLight
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundLight)
                .padding(padding)
        ) {
            if (state.isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Terracotta)
                }
            } else if (state.matches.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = "Aucune mise en relation pour le moment.",
                        color = TextSecondary,
                        fontSize = 15.sp
                    )
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.matches) { match ->
                        MatchCardItem(
                            match = match,
                            currentUserId = currentUser?.id ?: "",
                            onAccept = { matchViewModel.updateStatus(match.id, "accepted") },
                            onDecline = { matchViewModel.updateStatus(match.id, "declined") }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun MatchCardItem(
    match: Match,
    currentUserId: String,
    onAccept: () -> Unit,
    onDecline: () -> Unit
) {
    val context = LocalContext.current
    val isIncoming = match.initiatedBy != currentUserId
    val otherName = if (currentUserId == match.parentId) match.nannyName ?: "Nounou" else match.parentName ?: "Particulier"
    val otherPhoto = if (currentUserId == match.parentId) match.nannyPhoto else match.parentPhoto
    val otherPhone = if (currentUserId == match.parentId) match.nannyPhone else match.parentPhone

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceLight),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    AvatarImage(url = otherPhoto, name = otherName, modifier = Modifier.size(50.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(text = otherName, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(
                            text = if (isIncoming) "Demande reçue" else "Demande envoyée",
                            fontSize = 12.sp,
                            color = TextSecondary
                        )
                    }
                }

                StatusBadge(status = match.status)
            }

            if (match.message.isNotBlank()) {
                Spacer(modifier = Modifier.height(10.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = BackgroundLight),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "« ${match.message} »",
                        fontSize = 13.sp,
                        color = TextDark,
                        modifier = Modifier.padding(10.dp)
                    )
                }
            }

            // Controls
            if (isIncoming && match.status == "pending") {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = onAccept,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = StatusAccepted)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Accepter")
                    }

                    OutlinedButton(
                        onClick = onDecline,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = StatusDeclined)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Décliner")
                    }
                }
            } else if (match.status == "accepted" && !otherPhone.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = {
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$otherPhone"))
                            context.startActivity(intent)
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = SageGreen)
                    ) {
                        Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Appeler ($otherPhone)")
                    }
                }
            }
        }
    }
}
