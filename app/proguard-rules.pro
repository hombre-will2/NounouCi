# Keep Retrofit and Gson models
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.nounou.connect.data.models.** { *; }
