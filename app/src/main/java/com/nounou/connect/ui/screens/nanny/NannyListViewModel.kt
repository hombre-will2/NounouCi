package com.nounou.connect.ui.screens.nanny

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nounou.connect.data.models.NannyProfile
import com.nounou.connect.data.repository.NannyRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class NannyListState(
    val isLoading: Boolean = false,
    val nannies: List<NannyProfile> = emptyList(),
    val selectedQuartier: String = "Tous",
    val selectedAvailability: String = "Toutes",
    val searchQuery: String = "",
    val error: String? = null
)

class NannyListViewModel(private val repository: NannyRepository) : ViewModel() {

    private val _state = MutableStateFlow(NannyListState())
    val state: StateFlow<NannyListState> = _state.asStateFlow()

    init {
        fetchNannies()
    }

    fun fetchNannies() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            val q = if (_state.value.selectedQuartier == "Tous") null else _state.value.selectedQuartier
            val avail = if (_state.value.selectedAvailability == "Toutes") null else _state.value.selectedAvailability
            val search = if (_state.value.searchQuery.isBlank()) null else _state.value.searchQuery

            val res = repository.listNannies(quartier = q, availability = avail, search = search)
            res.fold(
                onSuccess = { _state.value = _state.value.copy(isLoading = false, nannies = it) },
                onFailure = { _state.value = _state.value.copy(isLoading = false, error = it.message ?: "Erreur de chargement") }
            )
        }
    }

    fun onQuartierChange(quartier: String) {
        _state.value = _state.value.copy(selectedQuartier = quartier)
        fetchNannies()
    }

    fun onAvailabilityChange(availability: String) {
        _state.value = _state.value.copy(selectedAvailability = availability)
        fetchNannies()
    }

    fun onSearchQueryChange(query: String) {
        _state.value = _state.value.copy(searchQuery = query)
        fetchNannies()
    }
}
