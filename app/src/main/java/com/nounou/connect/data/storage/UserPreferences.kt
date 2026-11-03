package com.nounou.connect.data.storage

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.nounou.connect.data.models.User

class UserPreferences(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("nounou_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    companion object {
        private const val KEY_TOKEN = "jwt_token"
        private const val KEY_USER = "user_json"
        private const val KEY_BASE_URL = "base_url"
        const val DEFAULT_BASE_URL = "http://127.0.0.1:8000" // Local server URL (use Configuration Serveur for Vercel/Supabase URL)
    }

    fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    fun getToken(): String? {
        return prefs.getString(KEY_TOKEN, null)
    }

    fun saveUser(user: User) {
        val json = gson.toJson(user)
        prefs.edit().putString(KEY_USER, json).apply()
    }

    fun getUser(): User? {
        val json = prefs.getString(KEY_USER, null) ?: return null
        return try {
            gson.fromJson(json, User::class.java)
        } catch (e: Exception) {
            null
        }
    }

    fun getBaseUrl(): String {
        return prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
    }

    fun saveBaseUrl(url: String) {
        val cleanUrl = if (url.endsWith("/")) url.substring(0, url.length - 1) else url
        prefs.edit().putString(KEY_BASE_URL, cleanUrl).apply()
    }

    fun clear() {
        prefs.edit().remove(KEY_TOKEN).remove(KEY_USER).apply()
    }
}
