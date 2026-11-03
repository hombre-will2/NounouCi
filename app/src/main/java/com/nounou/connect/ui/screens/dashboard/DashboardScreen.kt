package com.nounou.connect.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.nounou.connect.data.models.User
import com.nounou.connect.ui.components.AvatarImage
import com.nounou.connect.ui.components.RatingStars
import com.nounou.connect.ui.screens.auth.AuthViewModel
import com.nounou.connect.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    authViewModel: AuthViewModel,
    dashboardViewModel: DashboardViewModel,
    onNavigateToSearch: () -> Unit,
    onNavigateToMatches: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToSettings: () -> Unit
) {
    val currentUser = authViewModel.getCurrentUser()
    val isNanny = currentUser?.isNanny ?: true
    val dashboardState by dashboardViewModel.state.collectAsState()

    LaunchedEffect(currentUser) {
        dashboardViewModel.loadDashboard(isNanny)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Nounou Connect CI",
                        fontWeight = FontWeight.Bold,
                        color = SurfaceLight
                    )
                },
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Paramètres", tint = SurfaceLight)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Terracotta
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundLight)
                .padding(padding)
                .verticalScroll(rememberScrollState())
        ) {
            // User Header Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceLight),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val photoUrl = if (isNanny) dashboardState.nannyProfile?.photoUrl else dashboardState.parentProfile?.photoUrl
                    AvatarImage(
                        url = photoUrl,
                        name = currentUser?.fullName ?: "Utilisateur",
                        modifier = Modifier.size(64.dp)
                    )

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Bonjour, ${currentUser?.firstName.orEmpty()} 👋",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        val roleLabel = if (isNanny) "Nounou professionnelle" else "Particulier / Famille"
                        val roleBg = if (isNanny) Terracotta else SageGreen

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(roleBg)
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = roleLabel,
                                color = SurfaceLight,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        if (isNanny && dashboardState.nannyProfile != null) {
                            Spacer(modifier = Modifier.height(6.dp))
                            RatingStars(
                                rating = dashboardState.nannyProfile!!.avgRating,
                                reviewCount = dashboardState.nannyProfile!!.reviewCount
                            )
                        }
                    }
                }
            }

            // Ads Banner Section
            if (dashboardState.ads.isNotEmpty()) {
                Text(
                    text = "À la une",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )

                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(dashboardState.ads) { ad ->
                        Card(
                            modifier = Modifier
                                .width(280.dp)
                                .height(140.dp),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Box(modifier = Modifier.fillMaxSize()) {
                                AsyncImage(
                                    model = ad.imageUrl,
                                    contentDescription = ad.title,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(Color.Black.copy(alpha = 0.35f))
                                        .padding(12.dp),
                                    contentAlignment = Alignment.BottomStart
                                ) {
                                    Text(
                                        text = ad.title,
                                        color = SurfaceLight,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
            }

            // Overview Stats Grid
            Text(
                text = "Aperçu de votre activité",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                val matchesCount = dashboardState.recentMatches.size
                StatCard(
                    title = "Mises en relation",
                    value = "$matchesCount",
                    icon = Icons.Default.ConnectWithoutContact,
                    color = Terracotta,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToMatches
                )

                val location = if (isNanny) {
                    dashboardState.nannyProfile?.quartier ?: "Non défini"
                } else {
                    dashboardState.parentProfile?.quartier ?: "Non défini"
                }
                StatCard(
                    title = "Quartier",
                    value = location.ifBlank { "À renseigner" },
                    icon = Icons.Default.LocationOn,
                    color = SageGreen,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToProfile
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Action Menu List
            Text(
                text = "Services rapides",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )

            Column(
                modifier = Modifier.padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                val searchLabel = if (isNanny) "Trouver des familles / offres" else "Rechercher une nounou"
                val searchSub = if (isNanny) "Consulter les demandes des parents d'Abidjan" else "Filtrer par quartier, tarif, expérience"

                ActionRowCard(
                    title = searchLabel,
                    subtitle = searchSub,
                    icon = Icons.Default.Search,
                    iconBg = Terracotta,
                    onClick = onNavigateToSearch
                )

                ActionRowCard(
                    title = "Mes demandes de contact",
                    subtitle = "Consulter les messages reçus et envoyés",
                    icon = Icons.Default.Message,
                    iconBg = SageGreen,
                    onClick = onNavigateToMatches
                )

                ActionRowCard(
                    title = "Mon profil public",
                    subtitle = "Mettre à jour vos informations et tarifs",
                    icon = Icons.Default.Person,
                    iconBg = WarmSand,
                    onClick = onNavigateToProfile
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier.clickable { onClick() },
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceLight),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .background(color.copy(alpha = 0.15f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = value, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextDark)
            Text(text = title, fontSize = 12.sp, color = TextSecondary)
        }
    }
}

@Composable
fun ActionRowCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    iconBg: Color,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceLight),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(iconBg, RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = SurfaceLight)
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = title, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextDark)
                Text(text = subtitle, fontSize = 12.sp, color = TextSecondary)
            }
            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextSecondary)
        }
    }
}
