package com.nounou.connect.data.api

import com.nounou.connect.data.storage.UserPreferences
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(private val userPreferences: UserPreferences) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = userPreferences.getToken()
        val apiKey = userPreferences.getApiKey().ifEmpty { UserPreferences.DEFAULT_API_KEY }

        val requestBuilder = originalRequest.newBuilder()
        if (!token.isNullOrEmpty()) {
            requestBuilder.header("Authorization", "Bearer $token")
        } else {
            requestBuilder.header("Authorization", "Bearer $apiKey")
        }

        requestBuilder.header("apikey", apiKey)
        requestBuilder.header("Prefer", "return=representation")

        return chain.proceed(requestBuilder.build())
    }
}
