package com.nounou.connect.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object Dashboard : Screen("dashboard")
    object NannyList : Screen("nanny_list")
    object NannyDetail : Screen("nanny_detail/{nannyId}") {
        fun createRoute(nannyId: String) = "nanny_detail/$nannyId"
    }
    object ParentList : Screen("parent_list")
    object ParentDetail : Screen("parent_detail/{parentId}") {
        fun createRoute(parentId: String) = "parent_detail/$parentId"
    }
    object Matches : Screen("matches")
    object EditProfile : Screen("edit_profile")
    object Settings : Screen("settings")
}
