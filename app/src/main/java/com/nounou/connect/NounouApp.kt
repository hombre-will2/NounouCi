package com.nounou.connect

import android.app.Application
import com.nounou.connect.data.api.RetrofitClient
import com.nounou.connect.data.repository.*
import com.nounou.connect.data.storage.UserPreferences

class NounouApp : Application() {

    lateinit var userPreferences: UserPreferences
        private set

    lateinit var authRepository: AuthRepository
        private set

    lateinit var nannyRepository: NannyRepository
        private set

    lateinit var parentRepository: ParentRepository
        private set

    lateinit var matchRepository: MatchRepository
        private set

    lateinit var adRepository: AdRepository
        private set

    override fun onCreate() {
        super.onCreate()
        userPreferences = UserPreferences(this)

        val apiService = RetrofitClient.getService(userPreferences)

        authRepository = AuthRepository(apiService, userPreferences)
        nannyRepository = NannyRepository(apiService)
        parentRepository = ParentRepository(apiService)
        matchRepository = MatchRepository(apiService)
        adRepository = AdRepository(apiService)
    }
}
