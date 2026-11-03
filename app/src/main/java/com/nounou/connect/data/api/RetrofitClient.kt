package com.nounou.connect.data.api

import com.nounou.connect.data.storage.UserPreferences
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private var instance: ApiService? = null
    private var currentBaseUrl: String? = null

    fun getService(userPreferences: UserPreferences): ApiService {
        val baseUrl = userPreferences.getBaseUrl()
        val formattedBaseUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"

        if (instance == null || currentBaseUrl != formattedBaseUrl) {
            val loggingInterceptor = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            val okHttpClient = OkHttpClient.Builder()
                .addInterceptor(AuthInterceptor(userPreferences))
                .addInterceptor(loggingInterceptor)
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build()

            val retrofit = Retrofit.Builder()
                .baseUrl(formattedBaseUrl)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            instance = retrofit.create(ApiService::class.java)
            currentBaseUrl = formattedBaseUrl
        }

        return instance!!
    }

    fun reset() {
        instance = null
        currentBaseUrl = null
    }
}
