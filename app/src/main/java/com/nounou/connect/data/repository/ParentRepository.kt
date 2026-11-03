package com.nounou.connect.data.repository

import com.nounou.connect.data.api.ApiService
import com.nounou.connect.data.models.ParentProfile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ParentRepository(private val apiService: ApiService) {

    suspend fun listParents(
        city: String? = null,
        quartier: String? = null,
        careType: String? = null,
        schedule: String? = null,
        minBudget: Int? = null,
        search: String? = null
    ): Result<List<ParentProfile>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.listParents(city, quartier, careType, schedule, minBudget, search)
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!.parents)
            } else {
                Result.failure(Exception(res.errorBody()?.string() ?: "Erreur de chargement"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getParent(parentId: String): Result<ParentProfile> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getParent(parentId)
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!.parent)
            } else {
                Result.failure(Exception(res.errorBody()?.string() ?: "Famille introuvable"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMyProfile(): Result<ParentProfile?> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getMyParentProfile()
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!.profile)
            } else {
                Result.failure(Exception(res.errorBody()?.string() ?: "Profil introuvable"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateProfile(profile: ParentProfile): Result<ParentProfile> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.updateParentProfile(profile)
            if (res.isSuccessful && res.body() != null && res.body()!!.profile != null) {
                Result.success(res.body()!!.profile!!)
            } else {
                Result.failure(Exception(res.errorBody()?.string() ?: "Erreur de mise à jour"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
