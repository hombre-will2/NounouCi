package com.nounou.connect.ui.screens.matches

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nounou.connect.data.models.Match
import com.nounou.connect.data.repository.MatchRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class MatchState(
    val isLoading: Boolean = false,
    val matches: List<Match> = emptyList(),
    val actionSuccessMessage: String? = null,
    val error: String? = null
)

class MatchViewModel(private val repository: MatchRepository) : ViewModel() {

    private val _state = MutableStateFlow(MatchState())
    val state: StateFlow<MatchState> = _state.asStateFlow()

    init {
        loadMatches()
    }

    fun loadMatches() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            val res = repository.getMyMatches()
            res.fold(
                onSuccess = { _state.value = _state.value.copy(isLoading = false, matches = it) },
                onFailure = { _state.value = _state.value.copy(isLoading = false, error = it.message ?: "Erreur de chargement") }
            )
        }
    }

    fun requestContact(nannyId: String? = null, parentId: String? = null, message: String, onDone: () -> Unit) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            val res = repository.createMatch(nannyId = nannyId, parentId = parentId, message = message)
            res.fold(
                onSuccess = {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        actionSuccessMessage = "Demande de contact envoyée avec succès !"
                    )
                    loadMatches()
                    onDone()
                },
                onFailure = {
                    _state.value = _state.value.copy(isLoading = false, error = it.message ?: "Erreur d'envoi")
                }
            )
        }
    }

    fun updateStatus(matchId: String, status: String) {
        viewModelScope.launch {
            val res = repository.updateMatchStatus(matchId, status)
            res.fold(
                onSuccess = { loadMatches() },
                onFailure = { _state.value = _state.value.copy(error = it.message ?: "Erreur de mise à jour") }
            )
        }
    }

    fun clearMessages() {
        _state.value = _state.value.copy(actionSuccessMessage = null, error = null)
    }
}
