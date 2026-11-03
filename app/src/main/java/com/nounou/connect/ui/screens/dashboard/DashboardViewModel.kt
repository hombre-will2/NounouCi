package com.nounou.connect.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nounou.connect.data.models.Ad
import com.nounou.connect.data.models.Match
import com.nounou.connect.data.models.NannyProfile
import com.nounou.connect.data.models.ParentProfile
import com.nounou.connect.data.repository.AdRepository
import com.nounou.connect.data.repository.MatchRepository
import com.nounou.connect.data.repository.NannyRepository
import com.nounou.connect.data.repository.ParentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardState(
    val isLoading: Boolean = false,
    val nannyProfile: NannyProfile? = null,
    val parentProfile: ParentProfile? = null,
    val recentMatches: List<Match> = emptyList(),
    val ads: List<Ad> = emptyList(),
    val error: String? = null
)

class DashboardViewModel(
    private val nannyRepo: NannyRepository,
    private val parentRepo: ParentRepository,
    private val matchRepo: MatchRepository,
    private val adRepo: AdRepository
) : ViewModel() {

    private val _state = MutableStateFlow(DashboardState())
    val state: StateFlow<DashboardState> = _state.asStateFlow()

    fun loadDashboard(isNanny: Boolean) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)

            // Load Ads
            val adsResult = adRepo.getAds("home")
            val adsList = adsResult.getOrDefault(emptyList())

            // Load Matches
            val matchesResult = matchRepo.getMyMatches()
            val matches = matchesResult.getOrDefault(emptyList())

            if (isNanny) {
                val pResult = nannyRepo.getMyProfile()
                _state.value = DashboardState(
                    isLoading = false,
                    nannyProfile = pResult.getOrNull(),
                    recentMatches = matches,
                    ads = adsList
                )
            } else {
                val pResult = parentRepo.getMyProfile()
                _state.value = DashboardState(
                    isLoading = false,
                    parentProfile = pResult.getOrNull(),
                    recentMatches = matches,
                    ads = adsList
                )
            }
        }
    }
}
