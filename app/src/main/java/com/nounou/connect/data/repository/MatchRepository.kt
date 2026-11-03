package com.nounou.connect.data.repository

import com.nounou.connect.data.api.ApiService
import com.nounou.connect.data.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MatchRepository(private val apiService: ApiService) {

    suspend fun getMyMatches(): Result<List<Match>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getMyMatches()
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!.matches)
            } else {
                Result.failure(Exception(res.errorBody()?.string() ?: "Erreur de chargement des demandes"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createMatch(nannyId: String? = null, parentId: String? = null, message: String): Result<Match> = withContext(Dispatchers.IO) {
        try {
            val request = MatchCreateRequest(nannyId = nannyId, parentId = parentId, message = message)
            val res = apiService.createMatch(request)
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!.match)
            } else {
                val err = res.errorBody()?.string() ?: "Mise en relation impossible"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateMatchStatus(matchId: String, status: String): Result<Match> = withContext(Dispatchers.IO) {
        try {
            val request = MatchUpdateRequest(status = status)
            val res = apiService.updateMatch(matchId, request)
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!.match)
            } else {
                Result.failure(Exception(res.errorBody()?.string() ?: "Erreur de mise à jour"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
