package com.nounou.connect.data.repository

import com.nounou.connect.data.api.ApiService
import com.nounou.connect.data.models.Ad
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AdRepository(private val apiService: ApiService) {

    suspend fun getAds(placement: String? = "home"): Result<List<Ad>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getAds(placement)
            if (res.isSuccessful && res.body() != null) {
                Result.success(res.body()!!.ads)
            } else {
                Result.failure(Exception("Impossible de charger les annonces"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
