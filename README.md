# Finanzas — personal finance app (Google Sheets + Gemini)

Finanzas is an installable web app (PWA) that people open from their phone's home screen. It has no server and no third-party AI besides Gemini.

**What it does on each phone**

1. Signs the person in with Google.
2. Creates a sheet called **Finanzas personales** in their own Google Drive, with these tabs and formulas: Movimientos, Cuentas por pagar, Deudas, Metas, Listas, Resumen and Perfil. If that person already created one with the app, it finds it instead.
3. Asks for their own Gemini API key. The key is stored only on that phone.
4. Opens the **budget guide** and walks them through it step by step:
   - income
   - fixed bills
   - debts
   - day-to-day spending (Gemini suggests amounts)
   - goals and savings
   - payment methods
   - a final Gemini review with concrete adjustments they can apply in one tap

   The guide then writes the budget into their sheet. It can be re-run any time from **Plan → Ajustar presupuesto con Gemini**.
5. From then on, every entry goes through Gemini before it is saved to their sheet:
   - **Escribir** (form): Gemini checks the category, duplicates and budget impact.
   - **Foto**: Gemini reads a receipt.
   - **Voz**: Gemini listens to a voice note.
   - **Frase**: Gemini parses a typed sentence.

   Every save shows a confirmation screen first.

**Privacy model**

- Each person's data lives only in their own Google Drive.
- The app only calls Google (Sheets, Drive, sign-in) and Gemini, straight from the phone.
- You, as the publisher, never see anyone's data.

## Files

| File | What it is |
|---|---|
| `index.html` | App shell and styles (Instagram palette, Finanzas layout) |
| `app.js` | All app logic: sign-in, sheet creation, Gemini, budget guide, screens |
| `template.js` | Structure, formats and formulas of the sheet the app creates |
| `config.js` | **The only file you edit**: your Google OAuth client ID |
| `sw.js`, `manifest.webmanifest`, `icons/` | What makes it installable and open offline |

## One-time setup (about 15 minutes)

Google only lets an app sign people in from a registered web address. So the app has to be hosted once; GitHub Pages is free. After that, everyone installs it from that address.

### 1. Host it on GitHub Pages

1. Put these files at the root of the repository `pccalderonr-coder/finanzas-app`.
2. Open the repository on GitHub → **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**, then branch `main` and folder `/ (root)`. Save.
4. After a minute the app is live at **https://pccalderonr-coder.github.io/finanzas-app/**.

### 2. Configure Google (Google Cloud Console)

1. Go to https://console.cloud.google.com/ and create a project, for example "Finanzas App".
2. Open **APIs & Services → Library** and enable both **Google Sheets API** and **Google Drive API**.
3. Open **APIs & Services → OAuth consent screen** (also called "Google Auth Platform"):
   1. Set the user type to **External**.
   2. Fill in the app name ("Finanzas"), your support email and your developer email.
   3. Under **Data access / Scopes**, add `.../auth/drive.file`.
   4. Optionally, also add `.../auth/spreadsheets`. That one is only needed to connect an existing sheet by link.
   5. Under **Audience**, choose one of these:
      - Keep it in **Testing** and add each tester's Gmail under **Test users** (up to 100).
      - Or click **Publish app**. The app's normal flow only uses `drive.file`, a non-sensitive scope, so anyone can sign in.
4. Open **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   1. Set **Application type** to **Web application**.
   2. Under **Authorized JavaScript origins**, add `https://pccalderonr-coder.github.io`.
   3. Under **Authorized redirect URIs**, add both `https://pccalderonr-coder.github.io/finanzas-app/` and `https://pccalderonr-coder.github.io/finanzas-app/index.html`. These are used by the "¿No se abrió la ventana de Google?" fallback.
   4. Click Create and copy the **Client ID** (it ends in `.apps.googleusercontent.com`).
5. Open `config.js`, paste the Client ID in `googleClientId`, and commit.

The Client ID is public by design. It is not a secret, so it is fine for it to be in the repository. **There are no secrets anywhere in this app.**

### 3. Try it yourself

Open https://pccalderonr-coder.github.io/finanzas-app/ on your phone.

To use **your existing sheet** instead of a new one:

1. On the "Tu hoja" screen, tap **Ya tengo una hoja**.
2. Paste its link.
3. Approve the extra permission. Google may show "Google hasn't verified this app"; tap **Advanced → Go to Finanzas**. That screen appears because the `spreadsheets` scope is sensitive and the app isn't verified.

The app reads your sheet by its column headers, so your current tabs work as they are.

## Para quien la usa (instrucciones para testers)

1. Abre **https://pccalderonr-coder.github.io/finanzas-app/** en el teléfono.
   - **iPhone:** usa Safari, toca **Compartir → Agregar a pantalla de inicio**.
   - **Android:** usa Chrome, toca **⋮ → Instalar app** (o "Agregar a pantalla principal").
2. Abre **Finanzas** desde la pantalla de inicio y toca **Empezar con Google**.
3. Toca **Crear mi hoja en Google Drive**. La app crea *Finanzas personales* en tu Drive. Solo tú la ves.
4. Consigue tu clave de Gemini:
   1. Entra a https://aistudio.google.com/apikey con tu cuenta de Google.
   2. Toca **Create API key**, cópiala y pégala en la app.
   3. La clave se guarda solo en tu teléfono.
5. Sigue la guía de presupuesto (7 pasos). Al final Gemini revisa tu plan y la app lo guarda en tu hoja.
6. Para registrar algo toca **+**. Puedes escribirlo, tomarle foto al recibo, mandar una nota de voz o escribir una frase como “almuerzo 25 mil con Nequi”. Gemini lo revisa y tú confirmas antes de guardar.

Notas:

- Con el plan gratuito de Gemini, Google puede usar lo que se envía para mejorar sus productos. Si activas la facturación en AI Studio, no. La app envía a Gemini tus movimientos y totales, nunca contraseñas ni números de tarjeta (usa apodos como “Tarjeta Visa”).
- Cada hora Google pide confirmar la sesión. Toca **Continuar con Google**.
- En iPhone, si la ventana de Google no abre desde la app instalada, toca **“¿No se abrió la ventana de Google? Inicia sesión aquí”**.
- **Ajustes → Borrar datos de este teléfono** borra la clave de Gemini y la sesión. Tu hoja sigue en tu Drive.

## Updating the app

1. Edit the files and push to `main`. Pages redeploys in about a minute.
2. Phones pick up the new version the next time the app is opened online; the service worker loads the network first.

If you change `template.js`, only **new** sheets get the change; existing sheets are not modified.

## Gemini models

- The default is `gemini-3.8-flash`, set in `config.js`.
- Each person can switch to `gemini-3.5-flash-lite` (cheaper) or `gemini-flash-latest` in **Ajustes → Gemini**.
- The app asks Gemini for structured JSON. If a model rejects that request format, the app falls back to an older format automatically.
