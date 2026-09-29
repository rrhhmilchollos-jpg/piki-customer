plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
  id("com.google.gms.google-services")
}

android {
  namespace = "com.pikidelivery.partners"
  compileSdk = 35

  defaultConfig {
    applicationId = "com.pikidelivery.partners"
    minSdk = 26
    targetSdk = 35
    versionCode = 1
    versionName = "0.1.0"
  }
}

dependencies {
  implementation("androidx.core:core-ktx:1.15.0")
  implementation("androidx.activity:activity-ktx:1.9.3")
  implementation("androidx.webkit:webkit:1.12.1")
  implementation("com.google.firebase:firebase-messaging-ktx:24.1.0")
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

  // Add the exact SUNMI printer SDK/AIDL package supplied for the deployed V2 SKU.
  // Keep it private; do not publish a vendor SDK in the PIKI repository.
  compileOnly(files("libs/sunmi-printer-sdk.aar"))
}
