# MDM para comandero SUNMI V2 — PIKI Partners

## Resultado esperado

Cada SUNMI V2 vendido por PIKI se entrega como **dispositivo corporativo dedicado**: al arrancar abre `com.pikidelivery.partners`, no permite regresar al launcher, instalar aplicaciones, arrancar en modo seguro, realizar capturas o restablecer el terminal desde el uso diario. La salida queda restringida al equipo PIKI mediante la consola MDM y un protocolo *break-glass* documentado.

> **No basta con instalar un APK o una PWA.** El bloqueo real necesita un Device Policy Controller/EMM con el terminal enrolado como *fully managed*. La app se limita a entrar en Lock Task cuando la política MDM ya la ha autorizado.

## Política preparada

[`android-management-policy-piki-sunmi.json`](../infra/mdm/android-management-policy-piki-sunmi.json) es una plantilla para **Android Management API**. Configura:

| Control | Política | Razón |
|---|---|---|
| Aplicación única | `com.pikidelivery.partners` con `installType: KIOSK` | Arranque automático, pantalla completa y app fijada. |
| Permisos | `defaultPermissionPolicy: GRANT` y notificaciones | Evita que una alerta de pedido quede bloqueada por un diálogo. |
| Arranque alternativo | `safeBootDisabled: true` | Impide eludir la política iniciando en modo seguro. |
| Exfiltración visual | `screenCaptureDisabled: true` | Protege pedidos/datos de cocina. |
| Reset local | `factoryResetDisabled: true` | Evita que un comercio quite el control MDM. |
| Cámara | `cameraDisabled: true` | El flujo del comandero no la requiere; se puede retirar solo si se aprueba un caso de QR/cámara. |
| Actualizaciones | ventana 02:00–04:00 | Reduce interrupciones en horario de servicio. |

La política no desactiva Wi‑Fi ni el bloqueo de pantalla: el terminal necesita red para PIKI y el PIN de pantalla se gestiona desde el MDM según la política de cada comercio.

## Refuerzo incluido en la app

El wrapper Android se declara `android:lockTaskMode="if_whitelisted"` y, al volver a primer plano, entra en `startLockTask()` únicamente si el `DevicePolicyManager` confirma que el paquete está en la allowlist. Por tanto:

- sin MDM/allowlist, la app **no** activa el inseguro *screen pinning* del usuario;
- con MDM, el kiosk se reafirma tras reboot, actualización o regreso a foreground;
- el bridge informa a la PWA si el terminal está realmente en Lock Task, para que soporte detecte instalaciones incompletas.

## Provisioning de un SUNMI nuevo

1. **Preparar el tenant MDM.** Crear una empresa Android Enterprise y un servicio de enrolamiento (Android Management API u otro EMM compatible). Guardar la cuenta de servicio y los tokens solo en el gestor de secretos, nunca en Git.
2. **Publicar un APK firmado.** Definir `applicationId` estable, firmar el wrapper, registrar su certificado/paquete en el EMM y asociar la versión aprobada. El APK debe integrar el SDK/AIDL correcto del SKU SUNMI antes del piloto.
3. **Asignar la política.** Reemplazar `ENTERPRISE_ID` en la plantilla, aplicar la política al dispositivo/código de enrolamiento y fijar la versión de PIKI Partners aprobada.
4. **Enrolar como corporate-owned fully managed.** Preferir zero-touch del distribuidor. Como alternativa, hacer QR provisioning durante el asistente inicial de un equipo nuevo/restablecido. **El enrolamiento puede borrar el terminal**; confirmar que no contiene datos operativos antes de hacerlo.
5. **Comprobar cumplimiento antes de entregarlo.** Verificar: app arranca al reboot; Home/Recents no permiten salir; el estado MDM es compliant; Wi‑Fi y alarma funcionan; la cuenta partner es la tienda correcta; impresión y alertas se prueban físicamente.
6. **Registrar el activo.** En Operaciones asociar serial/Android ID de MDM, comercio, tienda, política, versión de app, fecha de entrega, propietario y último check-in. No usar el nombre del restaurante como identificador de seguridad.

## Flujo de instalación/control de cambios

```text
APK firmado → canal interno MDM → grupo piloto → prueba en SUNMI real
    → aprobación Operaciones → grupo producción → ventana nocturna
```

- Las actualizaciones de la PWA se sirven por HTTPS desde `pikidelivery.com`; el APK/WebView se actualiza por MDM en un canal independiente.
- Los cambios de policy se prueban primero en 2–3 terminales de laboratorio. Nunca empujar una política de bloqueo a todos los comercios sin prueba de salida remota.
- El sistema debe alertar si el device no hace check-in, sale de compliance, ejecuta una versión vetada o lleva más de 24 h sin conectividad.

## Break-glass y soporte

1. El comercio llama a soporte; no se comparte PIN MDM ni se desactiva protección por chat.
2. Un operador PIKI autorizado verifica identidad, número de serie y ticket.
3. Desde MDM se aplica temporalmente una política de soporte (launcher restringido + app de asistencia allowlisted), con caducidad y auditoría.
4. Tras resolver, se reaplica la política de producción y se confirma que Lock Task está activo.
5. Si se requiere reset, PIKI borra credenciales/sesión de la app, preserva la trazabilidad de pedidos y registra la cadena de custodia del equipo.

## Condiciones de salida de piloto

No entregar comercialmente hasta cumplir todo lo siguiente:

- APK reproducible, firmado y probado en el SKU SUNMI V2 exacto;
- integración real del SDK/AIDL de impresión, papel/tapa/cola y reimpresión validadas;
- Firebase/FCM y `POST_NOTIFICATIONS` comprobados en Android 13+;
- pertenencia pedido↔comercio por ID inmutable, no por nombre;
- migraciones de dispositivos push aplicadas y registradas en producción;
- alta/rotación de token FCM automática y trazable;
- comprobación de modo Kiosk/Lock Task y check-in MDM visible en Operaciones;
- plan de soporte, privacidad, retención y recuperación aprobado.

## Fuentes

- [Android Lock Task mode](https://developer.android.com/work/dpc/dedicated-devices/lock-task-mode): solo un DPC puede allowlistar y fijar aplicaciones; distingue Lock Task de screen pinning.
- [Android Management API — dedicated devices](https://developers.google.com/android/management/policies/dedicated-devices): `installType: KIOSK` inicia la app al arrancar y permite controles de safe boot, captura, reset y actualizaciones.
