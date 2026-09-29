package com.pikidelivery.partners

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.IBinder
import androidx.core.app.NotificationCompat

private const val ALERT_CHANNEL = "piki_new_orders"
private const val ALERT_NOTIFICATION_ID = 301

data class PartnerOrderAlert(val orderCode: String, val restaurant: String, val customerName: String)

interface OrderAlertController {
  fun start(context: Context, alert: PartnerOrderAlert)
  fun stop(context: Context, orderCode: String)
}

object OrderAlertService : OrderAlertController {
  const val ACTION_START = "com.pikidelivery.partners.START_ORDER_ALERT"
  const val ACTION_STOP = "com.pikidelivery.partners.STOP_ORDER_ALERT"
  const val EXTRA_CODE = "orderCode"
  const val EXTRA_RESTAURANT = "restaurant"
  const val EXTRA_CUSTOMER = "customer"

  override fun start(context: Context, alert: PartnerOrderAlert) {
    val intent = Intent(context, OrderAlertServiceImpl::class.java).setAction(ACTION_START)
      .putExtra(EXTRA_CODE, alert.orderCode).putExtra(EXTRA_RESTAURANT, alert.restaurant).putExtra(EXTRA_CUSTOMER, alert.customerName)
    context.startForegroundService(intent)
  }
  override fun stop(context: Context, orderCode: String) {
    context.startService(Intent(context, OrderAlertServiceImpl::class.java).setAction(ACTION_STOP).putExtra(EXTRA_CODE, orderCode))
  }
}

class OrderAlertServiceImpl : Service() {
  private var activeOrderCode: String? = null
  private var player: MediaPlayer? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      OrderAlertService.ACTION_START -> startAlert(
        intent.getStringExtra(OrderAlertService.EXTRA_CODE).orEmpty(),
        intent.getStringExtra(OrderAlertService.EXTRA_RESTAURANT).orEmpty(),
        intent.getStringExtra(OrderAlertService.EXTRA_CUSTOMER).orEmpty(),
      )
      OrderAlertService.ACTION_STOP -> if (intent.getStringExtra(OrderAlertService.EXTRA_CODE) == activeOrderCode) stopAlert()
    }
    return START_NOT_STICKY
  }

  private fun startAlert(orderCode: String, restaurant: String, customer: String) {
    if (!orderCode.matches(Regex("^[A-Za-z0-9_-]{3,32}$"))) return
    activeOrderCode = orderCode
    createChannel()
    val activity = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val notification = NotificationCompat.Builder(this, ALERT_CHANNEL)
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle("Nuevo pedido PIKI · $orderCode")
      .setContentText("$restaurant · ${customer.ifBlank { "Cliente" }}")
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setOngoing(true)
      .setOnlyAlertOnce(false)
      .setContentIntent(activity)
      .build()
    startForeground(ALERT_NOTIFICATION_ID, notification)
    player?.release()
    player = MediaPlayer.create(this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)).apply {
      isLooping = true
      setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
      start()
    }
  }

  private fun stopAlert() {
    player?.run { if (isPlaying) stop(); release() }; player = null
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
    activeOrderCode = null
  }

  private fun createChannel() {
    val manager = getSystemService(NotificationManager::class.java)
    val channel = NotificationChannel(ALERT_CHANNEL, "PIKI · Nuevos pedidos", NotificationManager.IMPORTANCE_HIGH).apply {
      description = "Alertas persistentes para pedidos nuevos del comandero PIKI"
      setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build())
      enableVibration(true)
      vibrationPattern = longArrayOf(0, 250, 150, 250, 150, 700)
    }
    manager.createNotificationChannel(channel)
  }

  override fun onBind(intent: Intent?): IBinder? = null
  override fun onDestroy() { player?.release(); player = null; super.onDestroy() }
}
