package com.nounou.connect.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nounou.connect.data.models.NannyProfile
import com.nounou.connect.data.models.ParentProfile
import com.nounou.connect.data.repository.NannyRepository
import com.nounou.connect.data.repository.ParentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProfileState(
    val isLoading: Boolean = false,
    val nannyProfile: NannyProfile? = null,
    val parentProfile: ParentProfile? = null,
    val isSaved: Boolean = false,
    val error: String? = null
)

class ProfileViewModel(
    private val nannyRepo: NannyRepository,
    private val parentRepo: ParentRepository
) : ViewModel() {

    private val _state = MutableStateFlow(ProfileState())
    val state: StateFlow<ProfileState> = _state.asStateFlow()

    fun loadCurrentProfile(isNanny: Boolean) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null, isSaved = false)
            if (isNanny) {
                val res = nannyRepo.getMyProfile()
                _state.value = ProfileState(
                    isLoading = false,
                    nannyProfile = res.getOrNull() ?: NannyProfile()
                )
            } else {
                val res = parentRepo.getMyProfile()
                _state.value = ProfileState(
                    isLoading = false,
                    parentProfile = res.getOrNull() ?: ParentProfile()
                )
            }
        }
    }

    fun saveNannyProfile(profile: NannyProfile) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null, isSaved = false)
            val res = nannyRepo.updateProfile(profile)
            res.fold(
                onSuccess = { _state.value = _state.value.copy(isLoading = false, nannyProfile = it, isSaved = true) },
                onFailure = { _state.value = _state.value.copy(isLoading = false, error = it.message ?: "Erreur de sauvegarde") }
            )
        }
    }

    fun saveParentProfile(profile: ParentProfile) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null, isSaved = false)
            val res = parentRepo.updateProfile(profile)
            res.fold(
                onSuccess = { _state.value = _state.value.copy(isLoading = false, parentProfile = it, isSaved = true) },
                onFailure = { _state.value = _state.value.copy(isLoading = false, error = it.message ?: "Erreur de sauvegarde") }
            )
        }
    }

    fun resetSavedState() {
        _state.value = _state.value.copy(isSaved = false)
    }
}
