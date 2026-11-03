package com.nounou.connect.data.api

import com.nounou.connect.data.models.*
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("api/auth/logout")
    suspend fun logout(): Response<GenericSuccessResponse>

    @GET("api/auth/me")
    suspend fun getMe(): Response<Map<String, User>>

    // Nanny Profile
    @PUT("api/profile/nanny")
    suspend fun updateNannyProfile(@Body profile: NannyProfile): Response<NannyProfileResponse>

    @GET("api/profile/nanny/me")
    suspend fun getMyNannyProfile(): Response<NannyProfileResponse>

    @DELETE("api/profile/nanny/me")
    suspend fun deleteMyNannyProfile(): Response<GenericSuccessResponse>

    // Parent Profile
    @PUT("api/profile/parent")
    suspend fun updateParentProfile(@Body profile: ParentProfile): Response<ParentProfileResponse>

    @GET("api/profile/parent/me")
    suspend fun getMyParentProfile(): Response<ParentProfileResponse>

    @DELETE("api/profile/parent/me")
    suspend fun deleteMyParentProfile(): Response<GenericSuccessResponse>

    // Search Nannies
    @GET("api/nannies")
    suspend fun listNannies(
        @Query("quartier") quartier: String? = null,
        @Query("availability") availability: String? = null,
        @Query("min_experience") minExperience: Int? = null,
        @Query("max_rate") maxRate: Int? = null,
        @Query("care_type") careType: String? = null,
        @Query("search") search: String? = null
    ): Response<NannyListResponse>

    @GET("api/nannies/{nanny_id}")
    suspend fun getNanny(@Path("nanny_id") nannyId: String): Response<SingleNannyResponse>

    // Search Parents (for Nannies)
    @GET("api/parents")
    suspend fun listParents(
        @Query("city") city: String? = null,
        @Query("quartier") quartier: String? = null,
        @Query("care_type") careType: String? = null,
        @Query("schedule") schedule: String? = null,
        @Query("min_budget") minBudget: Int? = null,
        @Query("search") search: String? = null
    ): Response<ParentListResponse>

    @GET("api/parents/{parent_id}")
    suspend fun getParent(@Path("parent_id") parentId: String): Response<SingleParentResponse>

    // Matches
    @POST("api/matches")
    suspend fun createMatch(@Body request: MatchCreateRequest): Response<MatchSingleResponse>

    @GET("api/matches/my")
    suspend fun getMyMatches(): Response<MatchesResponse>

    @PUT("api/matches/{match_id}")
    suspend fun updateMatch(
        @Path("match_id") matchId: String,
        @Body request: MatchUpdateRequest
    ): Response<MatchSingleResponse>

    @DELETE("api/matches/{match_id}")
    suspend fun deleteMatch(@Path("match_id") matchId: String): Response<GenericSuccessResponse>

    // Reviews
    @GET("api/reviews/nanny/{nanny_id}")
    suspend fun getNannyReviews(@Path("nanny_id") nannyId: String): Response<ReviewsResponse>

    @POST("api/reviews")
    suspend fun createReview(@Body request: ReviewCreateRequest): Response<Review>

    // Ads
    @GET("api/ads")
    suspend fun getAds(@Query("placement") placement: String? = null): Response<AdsResponse>

    // Upload
    @Multipart
    @POST("api/upload")
    suspend fun uploadFile(@Part file: MultipartBody.Part): Response<UploadResponse>
}
