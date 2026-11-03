package com.nounou.connect.data.repository

import com.nounou.connect.data.api.ApiService
import com.nounou.connect.data.models.AuthResponse
import com.nounou.connect.data.models.LoginRequest
import com.nounou.connect.data.models.RegisterRequest
import com.nounou.connect.data.models.User
import com.nounou.connect.data.storage.UserPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository(
    private val apiService: ApiService,
    private val userPreferences: UserPreferences
) {
    suspend fun login(phone: String, pass: String): Result<AuthResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.login(LoginRequest(phone = phone, password = pass))
            if (response.isSuccessful && response.body() != null) {
                val authRes = response.body()!!
                userPreferences.saveToken(authRes.token)
                userPreferences.saveUser(authRes.user)
                Result.success(authRes)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Échec de connexion"
                Result.failure(Exception(parseDetail(errorMsg)))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun register(
        phone: String,
        pass: String,
        role: String,
        firstName: String,
        lastName: String
    ): Result<AuthResponse> = withContext(Dispatchers.IO) {
        try {
            val request = RegisterRequest(
                phone = phone,
                password = pass,
                role = role,
                firstName = firstName,
                lastName = lastName
            )
            val response = apiService.register(request)
            if (response.isSuccessful && response.body() != null) {
                val authRes = response.body()!!
                userPreferences.saveToken(authRes.token)
                userPreferences.saveUser(authRes.user)
                Result.success(authRes)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Échec d'inscription"
                Result.failure(Exception(parseDetail(errorMsg)))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchMe(): Result<User> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMe()
            if (response.isSuccessful && response.body() != null) {
                val user = response.body()!!["user"]
                if (user != null) {
                    userPreferences.saveUser(user)
                    Result.success(user)
                } else {
                    Result.failure(Exception("Utilisateur non trouvé"))
                }
            } else {
                Result.failure(Exception("Session invalide"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getCurrentUser(): User? = userPreferences.getUser()

    fun isLoggedIn(): Boolean = !userPreferences.getToken().isNullOrEmpty()

    fun logout() {
        userPreferences.clear()
    }

    private fun parseDetail(json: String): String {
        return try {
            val gson = com.google.gson.Gson()
            val map = gson.fromJson(json, Map::class.java)
            map["detail"]?.toString() ?: json
        } catch (e: Exception) {
            json
        }
    }
}
