// Dímelo Redes (dw15): fechas y subidor de archivos en español en todas las pantallas.
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

// Textos de Uppy (barra de progreso y avisos al subir). Uppy los toma de aquí antes que de su inglés por defecto.
export const uppyEs = {
  strings: {
    uploading: 'Subiendo',
    complete: 'Listo',
    uploadFailed: 'No se pudo subir',
    paused: 'En pausa',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    pause: 'Pausar',
    resume: 'Seguir',
    done: 'Listo',
    upload: 'Subir',
    retryUpload: 'Reintentar la subida',
    showErrorDetails: 'Ver detalles del error',
    filesUploadedOfTotal: {
      0: '%{complete} de %{smart_count} archivo subido',
      1: '%{complete} de %{smart_count} archivos subidos',
    },
    dataUploadedOfTotal: '%{complete} de %{total}',
    dataUploadedOfUnknown: '%{complete} de un total desconocido',
    xTimeLeft: 'quedan %{time}',
    uploadXFiles: {
      0: 'Subir %{smart_count} archivo',
      1: 'Subir %{smart_count} archivos',
    },
    uploadXNewFiles: {
      0: 'Subir +%{smart_count} archivo',
      1: 'Subir +%{smart_count} archivos',
    },
    xMoreFilesAdded: {
      0: '%{smart_count} archivo más agregado',
      1: '%{smart_count} archivos más agregados',
    },
    exceedsSize: '%{file} pasa del tamaño máximo de %{size}',
    inferiorSize: 'Este archivo es más pequeño que el mínimo de %{size}',
    youCanOnlyUploadFileTypes: 'Solo puedes subir: %{types}',
    noDuplicates: 'No se puede agregar «%{fileName}» dos veces',
    failedToUpload: 'No se pudo subir %{file}',
    noInternetConnection: 'Sin conexión a internet',
    connectedToInternet: 'Conectado a internet',
    noMoreFilesAllowed: 'No se pueden agregar más archivos',
    youCanOnlyUploadX: {
      0: 'Solo puedes subir %{smart_count} archivo',
      1: 'Solo puedes subir %{smart_count} archivos',
    },
    youHaveToAtLeastSelectX: {
      0: 'Elige al menos %{smart_count} archivo',
      1: 'Elige al menos %{smart_count} archivos',
    },
    aggregateExceedsSize: 'Elegiste %{size} de archivos, pero el máximo es %{sizeAllowed}',
    missingRequiredMetaField: 'Faltan datos obligatorios',
    missingRequiredMetaFieldOnFile: 'Faltan datos obligatorios en %{fileName}',
    addBulkFilesFailed: {
      0: 'No se pudo agregar %{smart_count} archivo',
      1: 'No se pudieron agregar %{smart_count} archivos',
    },
    compressingImages: 'Comprimiendo imágenes...',
    compressedX: 'Se ahorró %{size} al comprimir las imágenes',
    dropPasteFiles: 'Suelta aquí los archivos o %{browseFiles}',
    dropPasteImportFiles: 'Suelta aquí los archivos, %{browseFiles} o impórtalos desde:',
    browseFiles: 'búscalos',
    browse: 'busca',
    dropHint: 'Suelta aquí tus archivos',
    uploadComplete: 'Subida lista',
    uploadPaused: 'Subida en pausa',
    xFilesSelected: {
      0: '%{smart_count} archivo elegido',
      1: '%{smart_count} archivos elegidos',
    },
    removeFile: 'Quitar archivo',
    cancelUpload: 'Cancelar la subida',
    back: 'Volver',
    addMore: 'Agregar más',
    addMoreFiles: 'Agregar más archivos',
    processingXFiles: {
      0: 'Procesando %{smart_count} archivo',
      1: 'Procesando %{smart_count} archivos',
    },
    error: 'Error',
    poweredBy: 'Con la tecnología de %{uppy}',
  },
  pluralize: (n: number) => (n === 1 ? 0 : 1),
};
