package com.nounou.connect.data.repository

import com.nounou.connect.data.api.ApiService
import com.nounou.connect.data.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class NannyRepository(private val apiService: ApiService) {

    suspend fun listNannies(
        quartier: String? = null,
        availability: String? = null,
        minExperience: Int? = null,
        maxRate: Int? = null,
        careType: String? = null,
        search: String? = null
    ): Result<List<NannyProfile>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.listNannies(quartier, availability, minExperience, maxRate, careType, search)
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!.nannies)
            } else {
                Result.failure(Exception(res.errorBody()?.string() ?: "Erreur de chargement des nounous"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getNanny(nannyId: String): Result<NannyProfile> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getNanny(nannyId)
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!.nanny)
            } else {
                Result.failure(Exception(res.errorBody()?.string() ?: "Nounou introuvable"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMyProfile(): Result<NannyProfile?> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getMyNannyProfile()
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!.profile)
            } else {
                Result.failure(Exception(res.errorBody()?.string() ?: "Profil introuvable"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateProfile(profile: NannyProfile): Result<NannyProfile> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.updateNannyProfile(profile)
            if (res.isSuccessful && res.body() != null && res.body()!!.profile != null) {
                Result.success(res.body()!!.profile!!)
            } else {
                Result.failure(Exception(res.errorBody()?.string() ?: "Erreur de sauvegarde"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
