package com.nounou.connect.data.models

import com.google.gson.annotations.SerializedName

data class User(
    val id: String,
    val phone: String,
    val role: String, // "nounou" or "parent"
    @SerializedName("first_name") val firstName: String,
    @SerializedName("last_name") val lastName: String,
    @SerializedName("created_at") val createdAt: String? = null
) {
    val fullName: String get() = "$firstName $lastName"
    val isNanny: Boolean get() = role == "nounou"
    val isParent: Boolean get() = role == "parent"
}

data class AuthResponse(
    val user: User,
    val token: String
)

data class RegisterRequest(
    val phone: String,
    val password: String = "",
    val role: String,
    @SerializedName("first_name") val firstName: String,
    @SerializedName("last_name") val lastName: String
)

data class LoginRequest(
    val phone: String,
    val password: String
)

data class PreviousExperience(
    @SerializedName("family_name") val familyName: String = "",
    @SerializedName("household_phone") val householdPhone: String = "",
    @SerializedName("start_date") val startDate: String = "",
    @SerializedName("end_date") val endDate: String = "",
    val description: String = "",
    @SerializedName("children_count") val childrenCount: Int? = null
)

data class NannyProfile(
    @SerializedName("user_id") val userId: String? = null,
    @SerializedName("first_name") val firstName: String? = null,
    @SerializedName("last_name") val lastName: String? = null,
    val phone: String? = null,
    val age: Int = 25,
    @SerializedName("experience_years") val experienceYears: Int = 2,
    val quartier: String = "",
    val city: String = "Abidjan",
    val availability: String = "Temps plein",
    @SerializedName("hourly_rate") val hourlyRate: Int = 100000, // FCFA mensuel
    val bio: String = "",
    @SerializedName("photo_url") val photoUrl: String? = null,
    val languages: List<String> = emptyList(),
    @SerializedName("childcare_types") val childcareTypes: List<String> = emptyList(),
    @SerializedName("previous_experiences") val previousExperiences: List<PreviousExperience> = emptyList(),
    @SerializedName("avg_rating") val avgRating: Float = 0f,
    @SerializedName("review_count") val reviewCount: Int = 0,
    @SerializedName("updated_at") val updatedAt: String? = null
) {
    val fullName: String get() = "${firstName.orEmpty()} ${lastName.orEmpty()}".trim()
}

data class NannyProfileResponse(
    val profile: NannyProfile?
)

data class NannyListResponse(
    val nannies: List<NannyProfile>
)

data class SingleNannyResponse(
    val nanny: NannyProfile
)

data class ParentProfile(
    @SerializedName("user_id") val userId: String? = null,
    @SerializedName("first_name") val firstName: String? = null,
    @SerializedName("last_name") val lastName: String? = null,
    val phone: String? = null,
    val quartier: String = "",
    val city: String = "Abidjan",
    val address: String = "",
    @SerializedName("children_count") val childrenCount: Int = 1,
    @SerializedName("needs_description") val needsDescription: String = "",
    val schedule: String = "Journée",
    @SerializedName("care_type") val careType: String = "Garde régulière",
    @SerializedName("budget_max") val budgetMax: Int = 120000,
    @SerializedName("photo_url") val photoUrl: String? = null,
    @SerializedName("children_photos") val childrenPhotos: List<String> = emptyList(),
    @SerializedName("updated_at") val updatedAt: String? = null
) {
    val fullName: String get() = "${firstName.orEmpty()} ${lastName.orEmpty()}".trim()
}

data class ParentProfileResponse(
    val profile: ParentProfile?
)

data class ParentListResponse(
    val parents: List<ParentProfile>
)

data class SingleParentResponse(
    val parent: ParentProfile
)

data class Match(
    val id: String,
    @SerializedName("parent_id") val parentId: String,
    @SerializedName("nanny_id") val nannyId: String,
    @SerializedName("initiated_by") val initiatedBy: String,
    val status: String, // "pending", "accepted", "declined"
    val message: String = "",
    @SerializedName("created_at") val createdAt: String? = null,
    @SerializedName("nanny_name") val nannyName: String? = null,
    @SerializedName("parent_name") val parentName: String? = null,
    @SerializedName("nanny_phone") val nannyPhone: String? = null,
    @SerializedName("parent_phone") val parentPhone: String? = null,
    @SerializedName("nanny_photo") val nannyPhoto: String? = null,
    @SerializedName("parent_photo") val parentPhoto: String? = null,
    val quartier: String? = null
)

data class MatchCreateRequest(
    @SerializedName("nanny_id") val nannyId: String? = null,
    @SerializedName("parent_id") val parentId: String? = null,
    val message: String = ""
)

data class MatchUpdateRequest(
    val status: String // "accepted" or "declined"
)

data class MatchesResponse(
    val matches: List<Match>
)

data class MatchSingleResponse(
    val match: Match
)

data class Review(
    val id: String = "",
    @SerializedName("nanny_id") val nannyId: String,
    @SerializedName("parent_id") val parentId: String = "",
    val rating: Int,
    val comment: String = "",
    @SerializedName("created_at") val createdAt: String? = null,
    @SerializedName("parent_name") val parentName: String? = null
)

data class ReviewCreateRequest(
    @SerializedName("nanny_id") val nannyId: String,
    val rating: Int,
    val comment: String = ""
)

data class ReviewsResponse(
    val reviews: List<Review>,
    @SerializedName("avg_rating") val avgRating: Float = 0f,
    @SerializedName("review_count") val reviewCount: Int = 0
)

data class Ad(
    val id: String,
    val title: String,
    @SerializedName("image_url") val imageUrl: String,
    @SerializedName("link_url") val linkUrl: String = "",
    val placement: String,
    val active: Boolean = true,
    @SerializedName("media_type") val mediaType: String = "image"
)

data class AdsResponse(
    val ads: List<Ad>
)

data class UploadResponse(
    val url: String,
    val path: String
)

data class GenericSuccessResponse(
    val ok: Boolean = true
)
