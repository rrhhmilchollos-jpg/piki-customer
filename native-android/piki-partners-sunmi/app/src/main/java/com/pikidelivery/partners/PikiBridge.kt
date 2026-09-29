package com.pikidelivery.partners

import android.content.Context
import android.app.ActivityManager
import androidx.webkit.JavaScriptReplyProxy
import com.google.firebase.messaging.FirebaseMessaging
import org.json.JSONArray
import org.json.JSONObject

class PikiBridge(
  private val context: Context,
  private val printer: SunmiPrinterGateway,
  private val alerts: OrderAlertController,
) {
  fun handle(raw: String, reply: JavaScriptReplyProxy) {
    val envelope = runCatching { JSONObject(raw) }.getOrNull() ?: return
    val requestId = envelope.optString("requestId")
    val command = envelope.optJSONObject("command")
    if (envelope.optString("channel") != "piki-partners" || requestId.length !in 12..80 || command == null) return
    fun answer(ok: Boolean, payload: JSONObject? = null, error: String? = null) {
      reply.postMessage(JSONObject().apply {
        put("channel", "piki-partners"); put("requestId", requestId); put("ok", ok)
        payload?.let { put("payload", it) }; error?.let { put("error", it) }
      }.toString())
    }
    when (command.optString("action")) {
      "device.info" -> answer(true, JSONObject().apply {
        val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        put("model", android.os.Build.MODEL)
        put("bridgeVersion", 1)
        put("nativeAlerts", true)
        put("printer", printer.available())
        put("managedKiosk", manager.lockTaskModeState == ActivityManager.LOCK_TASK_MODE_LOCKED)
      })
      "push.token" -> FirebaseMessaging.getInstance().token.addOnSuccessListener { token -> answer(true, JSONObject().put("token", token)) }.addOnFailureListener { answer(false, error = "FCM_TOKEN_UNAVAILABLE") }
      "alert.start" -> {
        val code = command.optString("orderCode"); val restaurant = command.optString("restaurant"); val customer = command.optString("customerName")
        if (!validOrder(code) || restaurant.isBlank()) answer(false, error = "INVALID_ALERT") else { alerts.start(context, PartnerOrderAlert(code, restaurant.take(160), customer.take(160))); answer(true, JSONObject().put("started", true)) }
      }
      "alert.stop" -> {
        val code = command.optString("orderCode")
        if (!validOrder(code)) answer(false, error = "INVALID_ORDER") else { alerts.stop(context, code); answer(true, JSONObject().put("stopped", true)) }
      }
      "printer.ticket" -> {
        val ticket = parseTicket(command.optJSONObject("ticket"))
        if (ticket == null) answer(false, error = "INVALID_TICKET") else printer.print(ticket) { result -> result.fold(onSuccess = { answer(true, JSONObject().put("printed", true)) }, onFailure = { answer(false, error = "PRINTER_${it.message ?: "ERROR"}") }) }
      }
      else -> answer(false, error = "UNKNOWN_ACTION")
    }
  }

  private fun validOrder(value: String) = value.matches(Regex("^[A-Za-z0-9_-]{3,32}$"))
  private fun parseTicket(value: JSONObject?): PartnerTicket? {
    if (value == null) return null
    val code = value.optString("orderCode"); val restaurant = value.optString("restaurant"); val address = value.optString("address")
    if (!validOrder(code) || restaurant.isBlank() || address.isBlank()) return null
    val source = value.optJSONArray("items") ?: JSONArray()
    if (source.length() > 50) return null
    val lines = (0 until source.length()).mapNotNull { index -> source.optJSONObject(index)?.let { item ->
      val name = item.optString("name").take(96); val quantity = item.optInt("quantity", 1)
      if (name.isBlank() || quantity !in 1..99) null else TicketLine(name, quantity, item.optString("notes").take(160))
    } }
    return PartnerTicket(code, restaurant.take(160), value.optString("customerName").take(160), address.take(280), value.optInt("totalCents", 0).coerceIn(0, 1_000_000), lines)
  }
}

data class PartnerTicket(val orderCode: String, val restaurant: String, val customerName: String, val address: String, val totalCents: Int, val items: List<TicketLine>)
data class TicketLine(val name: String, val quantity: Int, val notes: String)
