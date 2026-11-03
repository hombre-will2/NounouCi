package com.nounou.connect.ui.screens.parent

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nounou.connect.data.models.ParentProfile
import com.nounou.connect.data.repository.ParentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ParentListState(
    val isLoading: Boolean = false,
    val parents: List<ParentProfile> = emptyList(),
    val selectedQuartier: String = "Tous",
    val searchQuery: String = "",
    val error: String? = null
)

class ParentListViewModel(private val repository: ParentRepository) : ViewModel() {

    private val _state = MutableStateFlow(ParentListState())
    val state: StateFlow<ParentListState> = _state.asStateFlow()

    init {
        fetchParents()
    }

    fun fetchParents() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            val q = if (_state.value.selectedQuartier == "Tous") null else _state.value.selectedQuartier
            val search = if (_state.value.searchQuery.isBlank()) null else _state.value.searchQuery

            val res = repository.listParents(quartier = q, search = search)
            res.fold(
                onSuccess = { _state.value = _state.value.copy(isLoading = false, parents = it) },
                onFailure = { _state.value = _state.value.copy(isLoading = false, error = it.message ?: "Erreur de chargement") }
            )
        }
    }

    fun onQuartierChange(quartier: String) {
        _state.value = _state.value.copy(selectedQuartier = quartier)
        fetchParents()
    }

    fun onSearchQueryChange(query: String) {
        _state.value = _state.value.copy(searchQuery = query)
        fetchParents()
    }
}
