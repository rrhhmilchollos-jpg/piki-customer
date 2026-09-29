package com.pikidelivery.partners

import android.annotation.SuppressLint
import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature

class MainActivity : ComponentActivity() {
  companion object { const val TRUSTED_ORIGIN = "https://pikidelivery.com" }

  @SuppressLint("SetJavaScriptEnabled")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val webView = WebView(this)
    webView.settings.apply {
      javaScriptEnabled = true
      domStorageEnabled = true
      databaseEnabled = false
      allowFileAccess = false
      allowContentAccess = false
      mediaPlaybackRequiresUserGesture = false
      setSupportMultipleWindows(false)
    }
    webView.webChromeClient = WebChromeClient()
    webView.webViewClient = object : WebViewClient() {
      override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
        return !url.startsWith(TRUSTED_ORIGIN)
      }
    }

    val bridge = PikiBridge(
      context = this,
      printer = SunmiPrinterGateway(this),
      alerts = OrderAlertService,
    )
    if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
      WebViewCompat.addWebMessageListener(webView, "PikiNative", setOf(TRUSTED_ORIGIN)) { _, message, sourceOrigin, isMainFrame, replyProxy ->
        if (!isMainFrame || sourceOrigin.toString().removeSuffix("/") != TRUSTED_ORIGIN) return@addWebMessageListener
        bridge.handle(message.data ?: "", replyProxy)
      }
    } else {
      // The terminal must run a current Android System WebView. Do not fall back to addJavascriptInterface.
      webView.loadData("<h1>Actualiza Android System WebView</h1><p>PIKI Partners requiere un WebView con mensajería de origen verificado.</p>", "text/html", "UTF-8")
      setContentView(webView)
      return
    }
    webView.loadUrl("$TRUSTED_ORIGIN/partners")
    setContentView(webView)
  }

  override fun onResume() {
    super.onResume()
    // Never call startLockTask on an unmanaged device: it would degrade to
    // user-controlled screen pinning. Android Enterprise must allowlist this
    // package before PIKI reinforces the dedicated-device session.
    val policy = getSystemService(DevicePolicyManager::class.java) ?: return
    if (!policy.isLockTaskPermitted(packageName) || isLockTaskActive()) return
    runCatching { startLockTask() }
  }

  private fun isLockTaskActive(): Boolean {
    val manager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    return manager.lockTaskModeState == ActivityManager.LOCK_TASK_MODE_LOCKED
  }
}
