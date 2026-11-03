package com.nounou.connect.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nounou.connect.data.models.User
import com.nounou.connect.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    data class Success(val user: User) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}

class AuthViewModel(private val repository: AuthRepository) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun isLoggedIn(): Boolean = repository.isLoggedIn()

    fun getCurrentUser(): User? = repository.getCurrentUser()

    fun login(phone: String, pass: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            val result = repository.login(phone, pass)
            result.fold(
                onSuccess = { _uiState.value = AuthUiState.Success(it.user) },
                onFailure = { _uiState.value = AuthUiState.Error(it.message ?: "Erreur de connexion") }
            )
        }
    }

    fun register(phone: String, pass: String, role: String, firstName: String, lastName: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            val result = repository.register(phone, pass, role, firstName, lastName)
            result.fold(
                onSuccess = { _uiState.value = AuthUiState.Success(it.user) },
                onFailure = { _uiState.value = AuthUiState.Error(it.message ?: "Erreur d'inscription") }
            )
        }
    }

    fun logout() {
        repository.logout()
        _uiState.value = AuthUiState.Idle
    }

    fun resetState() {
        _uiState.value = AuthUiState.Idle
    }
}
