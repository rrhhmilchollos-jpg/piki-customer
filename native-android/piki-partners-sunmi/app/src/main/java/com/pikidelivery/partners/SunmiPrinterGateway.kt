package com.pikidelivery.partners

import android.content.Context
import java.util.Locale

/**
 * Stable PIKI port. The implementation below deliberately does not expose a WebView or JS API
 * to the vendor SDK. Replace VendorSunmiPrinterAdapter only after validating the exact V2 SKU
 * and the official SUNMI AIDL/SDK package distributed with that terminal.
 */
interface VendorSunmiPrinterAdapter {
  fun isReady(): Boolean
  fun transaction(lines: List<String>, onResult: (Result<Unit>) -> Unit)
}

class SunmiPrinterGateway(context: Context) {
  private val adapter: VendorSunmiPrinterAdapter = UnsupportedVendorSunmiPrinterAdapter()

  fun available() = adapter.isReady()

  fun print(ticket: PartnerTicket, onResult: (Result<Unit>) -> Unit) {
    if (!adapter.isReady()) return onResult(Result.failure(IllegalStateException("SDK_NOT_BOUND")))
    val lines = buildList {
      add("PIKI PARTNERS")
      add(ticket.restaurant.uppercase(Locale.ROOT))
      add("Pedido ${ticket.orderCode}")
      add("Cliente: ${ticket.customerName.ifBlank { "Cliente" }}")
      add("${ticket.address}")
      add("--------------------------------")
      ticket.items.forEach { item ->
        add("${item.quantity} x ${item.name}")
        if (item.notes.isNotBlank()) add("  ${item.notes}")
      }
      add("--------------------------------")
      add("TOTAL ${(ticket.totalCents / 100.0).toString().replace('.', ',')} EUR")
      add("PIKI Delivery · pikidelivery.com")
      add("\n\n\n")
    }
    adapter.transaction(lines, onResult)
  }
}

/** Safe default: the device fails closed until the approved SUNMI adapter is compiled in. */
private class UnsupportedVendorSunmiPrinterAdapter : VendorSunmiPrinterAdapter {
  override fun isReady() = false
  override fun transaction(lines: List<String>, onResult: (Result<Unit>) -> Unit) = onResult(Result.failure(IllegalStateException("SDK_NOT_BOUND")))
}
