package com.pikidelivery.partners

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class PartnerFirebaseMessagingService : FirebaseMessagingService() {
  override fun onMessageReceived(message: RemoteMessage) {
    val data = message.data
    if (data["type"] != "partner.order.created") return
    val code = data["orderCode"].orEmpty()
    val restaurant = data["restaurant"].orEmpty()
    val customer = data["customerName"].orEmpty()
    if (!code.matches(Regex("^[A-Za-z0-9_-]{3,32}$")) || restaurant.isBlank()) return
    // The payload is deliberately minimal. The PWA queries the authenticated API for order detail.
    OrderAlertService.start(applicationContext, PartnerOrderAlert(code, restaurant.take(160), customer.take(160)))
  }

  override fun onNewToken(token: String) {
    super.onNewToken(token)
    // The next foreground PWA session calls PikiNative.push.token and refreshes the server registration.
    // Never upload a token from an unauthenticated native context.
  }
}
