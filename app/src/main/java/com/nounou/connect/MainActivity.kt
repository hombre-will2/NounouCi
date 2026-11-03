package com.nounou.connect

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.nounou.connect.ui.navigation.NavGraph
import com.nounou.connect.ui.screens.auth.AuthViewModel
import com.nounou.connect.ui.screens.dashboard.DashboardViewModel
import com.nounou.connect.ui.screens.matches.MatchViewModel
import com.nounou.connect.ui.screens.nanny.NannyListViewModel
import com.nounou.connect.ui.screens.parent.ParentListViewModel
import com.nounou.connect.ui.screens.profile.ProfileViewModel
import com.nounou.connect.ui.theme.NounouConnectCITheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as NounouApp

        val authViewModel = AuthViewModel(app.authRepository)
        val dashboardViewModel = DashboardViewModel(
            app.nannyRepository,
            app.parentRepository,
            app.matchRepository,
            app.adRepository
        )
        val nannyListViewModel = NannyListViewModel(app.nannyRepository)
        val parentListViewModel = ParentListViewModel(app.parentRepository)
        val matchViewModel = MatchViewModel(app.matchRepository)
        val profileViewModel = ProfileViewModel(app.nannyRepository, app.parentRepository)

        setContent {
            NounouConnectCITheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    NavGraph(
                        navController = navController,
                        userPreferences = app.userPreferences,
                        authRepository = app.authRepository,
                        nannyRepository = app.nannyRepository,
                        parentRepository = app.parentRepository,
                        matchRepository = app.matchRepository,
                        adRepository = app.adRepository,
                        authViewModel = authViewModel,
                        dashboardViewModel = dashboardViewModel,
                        nannyListViewModel = nannyListViewModel,
                        parentListViewModel = parentListViewModel,
                        matchViewModel = matchViewModel,
                        profileViewModel = profileViewModel
                    )
                }
            }
        }
    }
}
