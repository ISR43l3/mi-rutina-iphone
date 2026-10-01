# Mi Rutina para iPhone

Una app web instalable hecha para uso personal desde Windows. Organiza tareas y rutinas, muestra la semana, funciona sin conexión después de cargarla y guarda los datos en el almacenamiento del iPhone.

## Publicarla desde Windows con GitHub Pages

1. Descomprime `VoiceRoutine-iPhone.zip` en tu PC.
2. Crea un repositorio nuevo en GitHub y sube el contenido de esta carpeta a la raíz.
3. En el repositorio, abre **Settings → Pages**.
4. En **Build and deployment**, elige **Deploy from a branch**, selecciona `main` y la carpeta `/(root)`, y guarda.
5. Espera a que GitHub muestre la dirección publicada.
6. En el iPhone, abre esa dirección con Safari, pulsa **Compartir → Añadir a pantalla de inicio** y confirma.

La página publicada será accesible públicamente. El código no contiene tus tareas; estas se guardan solo en el almacenamiento local del iPhone. Si borras los datos de Safari o cambias de dispositivo, usa el botón de copia (flecha hacia arriba) para exportar e importar una copia JSON. GitHub Pages ofrece alojamiento gratuito para repositorios públicos; el [proceso oficial para publicarlo](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) está documentado por GitHub.

## Uso

- En **Hoy**, escribe una tarea o toca el micrófono del teclado iPhone para dictarla. Las frases con «hoy», «mañana» y una hora como «a las 18» se convierten en fecha y hora.
- **Semana** resume tareas de los próximos siete días.
- **Rutinas** permite crear, editar, pausar y borrar hábitos con días, hora y pasos.
- Las tareas se guardan sin conexión en el iPhone después de la primera visita.

## Límites de esta versión

Esta es una app web de pantalla de inicio, no una app nativa. iOS no permite que una página web programe por sí sola un aviso local fiable para una hora futura cuando está cerrada. Los avisos push requieren alojar un servidor que los envíe. Para tener notificaciones locales fiables como las del prototipo Swift, hace falta una app iOS nativa o conectar esta versión a un servicio de notificaciones.

## Privacidad

Las tareas y rutinas se guardan en `localStorage` del navegador de ese iPhone. No se usa cuenta, analítica ni servidor de datos. El alojamiento sirve los archivos de la app; no recibe las tareas guardadas en el móvil.
