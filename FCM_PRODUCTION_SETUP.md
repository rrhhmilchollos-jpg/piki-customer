# Activación de Firebase Cloud Messaging para PIKI Customer

La versión nativa **1.0.8** de `com.pikidelivery.customer` incorpora `@capacitor/push-notifications`, registra el token FCM del dispositivo contra la API central y abre el seguimiento del pedido cuando la persona toca la notificación.

> La APK ya tiene la integración. La entrega real de notificaciones se activa únicamente al configurar los dos secretos siguientes fuera de Git: `google-services.json` en el proyecto Android y `FIREBASE_SERVICE_ACCOUNT_JSON` en Render.

## 1. Registrar Android en Firebase

En Firebase Console, seleccionar el proyecto de producción de PIKI y añadir una aplicación Android con estos valores:

- **Nombre de paquete Android:** `com.pikidelivery.customer`
- **Alias visible:** `PIKI Customer · Producción`
- **Huella SHA-1:** opcional para FCM; se puede añadir después desde el certificado de firma de Play.

Descargar el fichero generado y guardarlo exclusivamente en:

```text
piki-customer/android/app/google-services.json
```

Ese fichero está en `.gitignore`: no se debe subir al repositorio ni enviar por chat.

## 2. Configurar el emisor de notificaciones en Render

En Firebase Console, abrir **Configuración del proyecto → Cuentas de servicio**. Generar una clave privada para una cuenta de servicio que tenga el rol **Firebase Cloud Messaging API Admin** en el proyecto de Firebase.

En Render, dentro del servicio **piki-api**, crear o actualizar la variable secreta:

```text
FIREBASE_SERVICE_ACCOUNT_JSON={...JSON completo de la clave de servicio...}
```

No modificar `WEB_PUSH_SUBSCRIPTION_ENCRYPTION_KEY`: PIKI usa esa clave de 32 bytes para cifrar tanto los endpoints Web Push como los tokens FCM antes de guardarlos en MongoDB.

La API expone el estado técnico, sin revelar secretos:

```text
GET https://api.pikidelivery.com/api/v1/push/config
```

Cuando Render tenga la cuenta de servicio correcta, la respuesta debe incluir:

```json
{ "nativeFcmEnabled": true }
```

## 3. Preparar y publicar la versión Android

Con `google-services.json` disponible localmente, ejecutar:

```bash
cd piki-customer
pnpm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

El AAB debe firmarse con la misma clave de subida ya asociada a `com.pikidelivery.customer`. La versión preparada es:

- `versionCode`: **9**
- `versionName`: **1.0.8**

Subir el AAB firmado a la pista de producción de Google Play. Antes de enviar el lanzamiento público, comprobar que Play reconoce el mismo `applicationId` y una versión superior a la publicada.

## 4. Prueba de extremo a extremo

1. Instalar la versión 1.0.8 desde Play en un Android físico con Google Play Services.
2. Iniciar sesión como cliente y aceptar **“Activar avisos”** cuando aparezca el consentimiento de PIKI.
3. Confirmar que la API devuelve `201` para `POST /api/v1/push/native-subscriptions` y que no registra el token en texto plano.
4. Dejar la app en segundo plano.
5. En Partner, cambiar un pedido de `preparing` a `ready_for_pickup`.
6. Confirmar que el móvil muestra **“Pedido listo”** y que, al tocar la notificación, abre el seguimiento con el código `PIKI-…` correcto.
7. Verificar que la tarjeta muestra **“Pedido listo · rider avisado para recogerlo”**, sin necesidad de recargar manualmente.

## Qué corrige esta versión

- El estado canónico `ready_for_pickup` se conserva en la API.
- La tarjeta Customer muestra **“Pedido listo”**, no “En cocina”, en la APK 1.0.8.
- Las notificaciones enlazan con el código público `PIKI-…`, no con el identificador interno de MongoDB.
- Al tener la app abierta, Customer actualiza el pedido por consulta periódica y por evento push.
- Con la app en segundo plano o cerrada, Android recibe la notificación nativa FCM y, al abrirla, carga el estado real del pedido.

## Referencias

[1]: https://capacitorjs.com/docs/guides/push-notifications-firebase "Using Push Notifications with Firebase"

[2]: https://firebase.google.com/docs/cloud-messaging/android/client "Get started with Firebase Cloud Messaging in Android apps"

[3]: https://firebase.google.com/docs/cloud-messaging/send/admin-sdk "Send messages using the Firebase Admin SDK"
