package com.nounou.connect.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.nounou.connect.data.repository.*
import com.nounou.connect.data.storage.UserPreferences
import com.nounou.connect.ui.screens.auth.AuthViewModel
import com.nounou.connect.ui.screens.auth.LoginScreen
import com.nounou.connect.ui.screens.auth.RegisterScreen
import com.nounou.connect.ui.screens.dashboard.DashboardScreen
import com.nounou.connect.ui.screens.dashboard.DashboardViewModel
import com.nounou.connect.ui.screens.matches.MatchViewModel
import com.nounou.connect.ui.screens.matches.MatchesScreen
import com.nounou.connect.ui.screens.nanny.NannyDetailScreen
import com.nounou.connect.ui.screens.nanny.NannyListScreen
import com.nounou.connect.ui.screens.nanny.NannyListViewModel
import com.nounou.connect.ui.screens.parent.ParentDetailScreen
import com.nounou.connect.ui.screens.parent.ParentListScreen
import com.nounou.connect.ui.screens.parent.ParentListViewModel
import com.nounou.connect.ui.screens.profile.EditProfileScreen
import com.nounou.connect.ui.screens.profile.ProfileViewModel
import com.nounou.connect.ui.screens.settings.SettingsScreen

@Composable
fun NavGraph(
    navController: NavHostController,
    userPreferences: UserPreferences,
    authRepository: AuthRepository,
    nannyRepository: NannyRepository,
    parentRepository: ParentRepository,
    matchRepository: MatchRepository,
    adRepository: AdRepository,
    authViewModel: AuthViewModel,
    dashboardViewModel: DashboardViewModel,
    nannyListViewModel: NannyListViewModel,
    parentListViewModel: ParentListViewModel,
    matchViewModel: MatchViewModel,
    profileViewModel: ProfileViewModel
) {
    val startDestination = if (authViewModel.isLoggedIn()) Screen.Dashboard.route else Screen.Login.route

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                viewModel = authViewModel,
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    authViewModel.resetState()
                    navController.navigate(Screen.Register.route)
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                }
            )
        }

        composable(Screen.Register.route) {
            RegisterScreen(
                viewModel = authViewModel,
                onRegisterSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Register.route) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    authViewModel.resetState()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Register.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Dashboard.route) {
            DashboardScreen(
                authViewModel = authViewModel,
                dashboardViewModel = dashboardViewModel,
                onNavigateToSearch = {
                    val user = authViewModel.getCurrentUser()
                    if (user?.isNanny == true) {
                        navController.navigate(Screen.ParentList.route)
                    } else {
                        navController.navigate(Screen.NannyList.route)
                    }
                },
                onNavigateToMatches = {
                    navController.navigate(Screen.Matches.route)
                },
                onNavigateToProfile = {
                    navController.navigate(Screen.EditProfile.route)
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                }
            )
        }

        composable(Screen.NannyList.route) {
            NannyListScreen(
                viewModel = nannyListViewModel,
                onSelectNanny = { nannyId ->
                    navController.navigate(Screen.NannyDetail.createRoute(nannyId))
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.NannyDetail.route,
            arguments = listOf(navArgument("nannyId") { type = NavType.StringType })
        ) { backStackEntry ->
            val nannyId = backStackEntry.arguments?.getString("nannyId") ?: ""
            NannyDetailScreen(
                nannyId = nannyId,
                nannyRepo = nannyRepository,
                matchViewModel = matchViewModel,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToMatches = { navController.navigate(Screen.Matches.route) }
            )
        }

        composable(Screen.ParentList.route) {
            ParentListScreen(
                viewModel = parentListViewModel,
                onSelectParent = { parentId ->
                    navController.navigate(Screen.ParentDetail.createRoute(parentId))
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.ParentDetail.route,
            arguments = listOf(navArgument("parentId") { type = NavType.StringType })
        ) { backStackEntry ->
            val parentId = backStackEntry.arguments?.getString("parentId") ?: ""
            ParentDetailScreen(
                parentId = parentId,
                parentRepo = parentRepository,
                matchViewModel = matchViewModel,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToMatches = { navController.navigate(Screen.Matches.route) }
            )
        }

        composable(Screen.Matches.route) {
            MatchesScreen(
                matchViewModel = matchViewModel,
                authViewModel = authViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.EditProfile.route) {
            EditProfileScreen(
                profileViewModel = profileViewModel,
                authViewModel = authViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Settings.route) {
            SettingsScreen(
                userPreferences = userPreferences,
                authViewModel = authViewModel,
                onNavigateBack = { navController.popBackStack() },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
