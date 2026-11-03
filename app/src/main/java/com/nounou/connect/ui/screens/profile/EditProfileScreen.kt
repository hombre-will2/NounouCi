package com.nounou.connect.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nounou.connect.data.models.NannyProfile
import com.nounou.connect.data.models.ParentProfile
import com.nounou.connect.ui.components.ABIDJAN_QUARTIERS
import com.nounou.connect.ui.components.DropdownSelector
import com.nounou.connect.ui.components.IVORIAN_CITIES
import com.nounou.connect.ui.components.NounouButton
import com.nounou.connect.ui.screens.auth.AuthViewModel
import com.nounou.connect.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditProfileScreen(
    profileViewModel: ProfileViewModel,
    authViewModel: AuthViewModel,
    onNavigateBack: () -> Unit
) {
    val currentUser = authViewModel.getCurrentUser()
    val isNanny = currentUser?.isNanny ?: true
    val state by profileViewModel.state.collectAsState()

    LaunchedEffect(currentUser) {
        profileViewModel.loadCurrentProfile(isNanny)
    }

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(state.isSaved) {
        if (state.isSaved) {
            snackbarHostState.showSnackbar("Profil mis à jour avec succès !")
            profileViewModel.resetSavedState()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Modifier Mon Profil", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = if (isNanny) Terracotta else SageGreen,
                    titleContentColor = SurfaceLight,
                    navigationIconContentColor = SurfaceLight
                )
            )
        }
    ) { padding ->
        if (state.isLoading) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = if (isNanny) Terracotta else SageGreen)
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(BackgroundLight)
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (state.error != null) {
                    Text(
                        text = state.error!!,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 14.sp
                    )
                }

                if (isNanny) {
                    EditNannyProfileForm(
                        initialProfile = state.nannyProfile ?: NannyProfile(),
                        onSave = { updated -> profileViewModel.saveNannyProfile(updated) }
                    )
                } else {
                    EditParentProfileForm(
                        initialProfile = state.parentProfile ?: ParentProfile(),
                        onSave = { updated -> profileViewModel.saveParentProfile(updated) }
                    )
                }
            }
        }
    }
}

@Composable
fun EditNannyProfileForm(
    initialProfile: NannyProfile,
    onSave: (NannyProfile) -> Unit
) {
    var age by remember { mutableStateOf(initialProfile.age.toString()) }
    var experienceYears by remember { mutableStateOf(initialProfile.experienceYears.toString()) }
    var quartier by remember { mutableStateOf(initialProfile.quartier.ifBlank { ABIDJAN_QUARTIERS.first() }) }
    var city by remember { mutableStateOf(initialProfile.city.ifBlank { "Abidjan" }) }
    var availability by remember { mutableStateOf(initialProfile.availability) }
    var hourlyRate by remember { mutableStateOf(initialProfile.hourlyRate.toString()) }
    var bio by remember { mutableStateOf(initialProfile.bio) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceLight)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Informations Professionnelles", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Terracotta)

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = age,
                    onValueChange = { age = it },
                    label = { Text("Âge") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f)
                )

                OutlinedTextField(
                    value = experienceYears,
                    onValueChange = { experienceYears = it },
                    label = { Text("Années d'expérience") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f)
                )
            }

            DropdownSelector(
                label = "Quartier (Abidjan)",
                options = ABIDJAN_QUARTIERS,
                selectedOption = quartier,
                onOptionSelected = { quartier = it }
            )

            val availOptions = listOf("Temps plein", "Temps partiel", "Garde de nuit", "Ponctuel / Week-end")
            DropdownSelector(
                label = "Disponibilité",
                options = availOptions,
                selectedOption = if (availability.isNotBlank()) availability else availOptions.first(),
                onOptionSelected = { availability = it }
            )

            OutlinedTextField(
                value = hourlyRate,
                onValueChange = { hourlyRate = it },
                label = { Text("Tarif mensuel souhaité (FCFA / mois)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = bio,
                onValueChange = { bio = it },
                label = { Text("Présentation / Biographie") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
                maxLines = 5
            )

            Spacer(modifier = Modifier.height(8.dp))

            NounouButton(
                text = "Enregistrer le profil",
                onClick = {
                    onSave(
                        initialProfile.copy(
                            age = age.toIntOrNull() ?: 25,
                            experienceYears = experienceYears.toIntOrNull() ?: 2,
                            quartier = quartier,
                            city = city,
                            availability = availability,
                            hourlyRate = hourlyRate.toIntOrNull() ?: 100000,
                            bio = bio
                        )
                    )
                },
                backgroundColor = Terracotta
            )
        }
    }
}

@Composable
fun EditParentProfileForm(
    initialProfile: ParentProfile,
    onSave: (ParentProfile) -> Unit
) {
    var quartier by remember { mutableStateOf(initialProfile.quartier.ifBlank { ABIDJAN_QUARTIERS.first() }) }
    var city by remember { mutableStateOf(initialProfile.city.ifBlank { "Abidjan" }) }
    var childrenCount by remember { mutableStateOf(initialProfile.childrenCount.toString()) }
    var careType by remember { mutableStateOf(initialProfile.careType) }
    var schedule by remember { mutableStateOf(initialProfile.schedule) }
    var budgetMax by remember { mutableStateOf(initialProfile.budgetMax.toString()) }
    var needsDescription by remember { mutableStateOf(initialProfile.needsDescription) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceLight)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Besoins de la Famille", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = SageGreen)

            DropdownSelector(
                label = "Quartier (Abidjan)",
                options = ABIDJAN_QUARTIERS,
                selectedOption = quartier,
                onOptionSelected = { quartier = it }
            )

            OutlinedTextField(
                value = childrenCount,
                onValueChange = { childrenCount = it },
                label = { Text("Nombre d'enfants") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth()
            )

            val careOptions = listOf("Garde régulière", "Ponctuelle", "Sortie école", "Garde de nuit")
            DropdownSelector(
                label = "Type de garde",
                options = careOptions,
                selectedOption = if (careType.isNotBlank()) careType else careOptions.first(),
                onOptionSelected = { careType = it }
            )

            val scheduleOptions = listOf("Journée", "Soirée", "Nuit", "Week-end", "Plein temps")
            DropdownSelector(
                label = "Horaires souhaités",
                options = scheduleOptions,
                selectedOption = if (schedule.isNotBlank()) schedule else scheduleOptions.first(),
                onOptionSelected = { schedule = it }
            )

            OutlinedTextField(
                value = budgetMax,
                onValueChange = { budgetMax = it },
                label = { Text("Budget maximum (FCFA / mois)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = needsDescription,
                onValueChange = { needsDescription = it },
                label = { Text("Description des besoins / remarques") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
                maxLines = 5
            )

            Spacer(modifier = Modifier.height(8.dp))

            NounouButton(
                text = "Enregistrer mes besoins",
                onClick = {
                    onSave(
                        initialProfile.copy(
                            quartier = quartier,
                            city = city,
                            childrenCount = childrenCount.toIntOrNull() ?: 1,
                            careType = careType,
                            schedule = schedule,
                            budgetMax = budgetMax.toIntOrNull() ?: 120000,
                            needsDescription = needsDescription
                        )
                    )
                },
                backgroundColor = SageGreen
            )
        }
    }
}
