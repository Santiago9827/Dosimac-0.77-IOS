import { Server } from "http";
import { config } from "process";

/* eslint-disable prettier/prettier */
export default {
   username: 'Usario',
   password: 'Contraseña',
   Server: 'Servidor IP',
   login: 'Login',
   welcome: 'Bienvenido',
   change_language: 'Cambia idioma',
   Tabs: 'Inicio',


   Lista_instalaciones: 'Instalaciones',
   Maintenance: 'Mantenimiento',
   DetallesInstalacion: 'Detalles Instación',
   Grabar: 'Grabar',
   EstadoStore: 'Estado store',
   Nodata: 'No hay datos',
   DosimacRegistration: 'Alta Dosimac',
   NewDmMaternity: 'Nuevo Dosimac maternidad',
   DosimacG: 'Dosimac-G',
   DosimacI: 'Dosimac-I',
   UpdDmMaternity: 'Cambio Dosimac maternidad',
   NewDmGestation: 'Nuevo Dosimac gestación',
   UpdDmGestation: 'Cambio dosimac gestación',
   StartScan: 'Buscar equipos DOSIMAC',
   DosimacList: 'Equipos DOSIMAC',
   PressToScan: 'Pulse',
   DosimacSetup: 'Configuracion',
   TestoPresioneAlta: "Presione sobre el boton para buscar dispositivos DOSIMAC",
   Instalación_seleccionada: "Instalación seleccionada",
   NoInstalacionSeleccionada: "No hay instalación seleccionada",
   BorrarGranja: "Borrar granja",
   Deseaborrarlagranja: "¿Desea borrar la granja?",
   Guardar: 'Guardar',
   Cancelar: 'Cancelar',
   Aceptar: 'Aceptar',
   NombreGranja: 'Nombre Granja',
   Localidad: 'Localidad',
   Provincia: 'Provincia',
   NombreWifi: 'Nombre Wifi',
   PasswordWifi: 'Contraseña Wifi',
   colocaQrInstalacionCamara: "Coloca el código QR de la instalación dentro de la cámara.",
   escaneaCodigoQr: "Escanea el código QR",
   permisoCamaraNecesario: "Permiso de cámara necesario",
   permisoCamaraQrTexto: "Necesitas permitir el acceso a la cámara para escanear el código QR.",
   qrNoValido: "QR no válido",
   qrNoEsInstalacionDosimac: "Este no es un QR de instalación DOSIMAC.",
   ipAplicadaSinCredenciales: "La IP se ha aplicado correctamente, pero esta instalación no tiene Username y Clave.",
   instalacionSeleccionada: "Instalación seleccionada",
   conexionExitosa: "Conexión exitosa",
   instalacionConectadaCorrectamente: "La instalación se ha conectado correctamente.",
   noPuedeConectarInstalacionSeleccionada: "No se puede conectar con la instalación seleccionada. Comprueba la red WiFi o la IP del servidor.",
   conectando: "Conectando",
   conectandoInstalacionSeleccionada: "Estamos conectando con la instalación seleccionada...",





   No_hay_dispositivos: 'No hay dispositivos',
   Aviso: 'Aviso',
   SearchingDevices: 'Buscando equipos...',
   NoSePuedeBorrarGranja: "No se puede borrar una granja nueva",
   settings: 'Ajustes',
   softwareVersion: "software Version",
   configuarIntalacion: "Debe configurar al menos una instalación",
   numeroCoral: "Número de corral",
   numeroMaquina: "Número de máquina",
   Enviar: "Enviar",
   Salir: "Salir",
   Informacion: "Información",
   InicioConfiguracion: "Iniciando conexion",
   ConfiguracionWifi: "Configurando.... ",
   ConfiguracionRealizada: "*Configuracion realizada*",
   ErrorConfiguracion: "*Error de configuración*",
   CapturaTagCorral: "Capturar tag de corral",
   CorralTag: "Corral tag",
   versionUint16: "Esta versión del equipo solo soporta corral hasta 65000",
   versionUint32: "Esta versión del equipo soporta corral hasta 4000000000",

   EnvioConfiguracion: "Envio de configuración",
   NumeroCorral: "Número de corral",
   NumeroMaquina: "Número de máquina",
   Corralnovalida: "Corral no válido",
   NumeroMaquinanovalida: "Numero de máquina no válida",

   login_title: "Iniciar sesión",
   login_subtitle: "Introduce tus datos. Es necesario configurar la IP antes de iniciar sesión desde el menú Configuración IP.",
   login_username: "Usuario",
   login_password: "Contraseña",
   login_button: "Entrar",
   login_loading: "Entrando...",
   login_footer: "Panel de control",


   login_ipRequiredTitle: "Configuración IP requerida",
   login_ipRequiredMessage: "No has configurado la dirección IP del servidor. Introdúcela para poder iniciar sesión.",
   login_serverIpLabel: "IP del servidor",
   login_cancel: "Cancelar",
   login_accept: "Aceptar",
   login_invalidCredentials: "Usuario o contraseña incorrectos",

   login_configTitle: "Configuración",
   login_errorTitle: "Error de login",
   login_genericErrorTitle: "Error",
   login_networkErrorTitle: "Error de red",
   login_networkErrorMessage: "No se pudo conectar con el servidor.",
   login_noTokenMessage: "El backend no devolvió ningún token.",
   login_missingDataTitle: "Faltan datos",
   login_missingDataMessage: "Introduce usuario y contraseña.",
   login_invalidIpTitle: "IP no válida",
   login_invalidIpMessage: "Introduce una IP o dirección de servidor válida.",
   login_saveIpErrorMessage: "No se pudo guardar la configuración IP.",
   awrStartScan_title: "Configuracion AWR ",
   awrStartScan_description: "Pantalla para escanear lectores Agrident AWR.",
   awrStartScan_button: "Escanear AWR",
   awrBluetoothPermissionMessage: "Activa Bluetooth y acepta el permiso para poder escanear.",


   gestacionConfig_screenTitle: "Configuración Gestación",
   gestacionConfig_chooseOptionTitle: "Elige una opción",
   gestacionConfig_chooseOptionDescription: "Define el flujo antes de empezar con el lector.",

   gestacionConfig_entry: "Entrada",
   gestacionConfig_exit: "Salida",
   gestacionConfig_reading: "Lectura",
   gestacionConfig_search: "Búsqueda",

   gestacionConfig_entryParamsTitle: "Parámetros de entrada",
   gestacionConfig_exitParamsTitle: "Parámetros de salida",
   gestacionConfig_entryParamsDescription: "Selecciona el corral y el comportamiento del flujo.",
   gestacionConfig_exitParamsDescription: "Configura el comportamiento del flujo de salida.",

   gestacionConfig_corralLabel: "Corral",
   gestacionConfig_corralPlaceholder: "Ej: 1",
   gestacionConfig_corralRequired: "Escribe el corral para continuar.",

   gestacionConfig_detectUnknownTitle: "Identificar animales desconocidos",
   gestacionConfig_detectUnknownDescription: "Cuando leas un animal sin identificar, podrás asignarle un ID",

   gestacionConfig_confirmTitle: "Confirmar envío",
   gestacionConfig_confirmDescription: "Pedirá confirmación antes de enviar los registros.",

   gestacionConfig_animalSearchTitle: "Búsqueda de animal",
   gestacionConfig_animalSearchDescription: "Elige si quieres buscar por crotal o por ID.",
   gestacionConfig_searchByCrotal: "Por crotal",
   gestacionConfig_searchById: "Por ID",
   gestacionConfig_manual: "Manual",
   gestacionConfig_withSword: "Con espada",

   gestacionConfig_crotalLabelSearch: "Crotal",
   gestacionConfig_idLabelSearch: "ID",
   gestacionConfig_crotalPlaceholderSearch: "Ej: 982091072397436",
   gestacionConfig_idPlaceholderSearch: "Ej: A13",
   gestacionConfig_crotalRequiredSearch: "Escribe un crotal para continuar.",
   gestacionConfig_idRequiredSearch: "Escribe un ID para continuar.",

   gestacionConfig_searchWithSwordHelp: "Al continuar, se leerá la espada en esta pantalla y se buscará el animal con ese crotal.",

   gestacionConfig_readingSword: "Leyendo espada...",
   gestacionConfig_waitingMatch: "Esperando coincidencia",
   gestacionConfig_searchingAnimal: "Buscando animal...",

   gestacionConfig_readingSwordDescription: "Acerca el crotal al lector para identificar el animal.",
   gestacionConfig_waitingMatchDescription: "Animal localizado. Ahora acerca a la espada el crotal {{crotal}} para confirmar la coincidencia.",
   gestacionConfig_searchingAnimalDescription: "Consultando información del animal en el backend.",

   gestacionConfig_awrDisconnectedTitle: "Lector no conectado",
   gestacionConfig_awrSavedDescription: "Tienes espadas guardado. Pulsa para seleccionar una.",
   gestacionConfig_awrNotSavedDescription: "No tienes ninguna espada guardada. Pulsa para escanear una.",

   gestacionConfig_scan: "Escanear",
   gestacionConfig_continue: "Continuar",

   gestacionConfig_alerts_error: "Error",
   gestacionConfig_alerts_networkError: "Error de red",
   gestacionConfig_alerts_networkErrorMessage: "No se pudo conectar con el servidor.",
   gestacionConfig_alerts_backendNoValidCrotal: "El backend no devolvió un crotal válido para comparar.",
   gestacionConfig_alerts_awrNotConnected: "AWR no conectado",
   gestacionConfig_alerts_connectSwordBeforeContinue: "Conecta una espada antes de continuar.",
   gestacionConfig_alerts_couldNotStartReading: "No se pudo iniciar la lectura con la espada.",

   gestacionConfig_alerts_missingData: "Falta dato",
   gestacionConfig_alerts_writeCrotalToSearch: "Escribe un crotal para buscar.",
   gestacionConfig_alerts_writeIdToSearch: "Escribe un ID para buscar.",

   gestacionConfig_alerts_notFound: "No encontrado",
   gestacionConfig_alerts_animalNotFoundByCrotal: "No existe ningún animal con ese crotal.",
   gestacionConfig_alerts_animalNotFoundById: "No existe ningún animal con ese ID.",

   gestacionConfig_alerts_warning: "Aviso",
   gestacionConfig_alerts_searchError: "Error en la búsqueda",


   maternidadConfig_screenTitle: "Configuración Maternidad",
   maternidadConfig_chooseOptionTitle: "Elige una opción",
   maternidadConfig_chooseOptionDescription: "Define el flujo antes de empezar con el lector.",
   maternidadConfig_entry: "Entrada",
   maternidadConfig_exit: "Salida",
   maternidadConfig_reading: "Lectura",
   maternidadConfig_search: "Búsqueda",
   maternidadConfig_entryParamsTitle: "Parámetros de entrada",
   maternidadConfig_exitParamsTitle: "Parámetros de salida",
   maternidadConfig_entryParamsDescription: "Selecciona el corral y el comportamiento del flujo.",
   maternidadConfig_exitParamsDescription: "Configura el comportamiento del flujo de salida.",
   maternidadConfig_corralLabel: "Corral",
   maternidadConfig_corralPlaceholder: "Ej: 1",
   maternidadConfig_corralRequired: "Escribe el corral para continuar.",
   maternidadConfig_detectUnknownTitle: "Identificar animales desconocidos",
   maternidadConfig_detectUnknownDescription: "Cuando leas un animal sin identificar, podrás asignarle un ID",
   maternidadConfig_confirmTitle: "Confirmar envío",
   maternidadConfig_confirmDescription: "Pedirá confirmación antes de enviar cada registro.",
   maternidadConfig_animalSearchTitle: "Búsqueda de animal",
   maternidadConfig_animalSearchDescription: "Elige si quieres buscar por crotal o por ID.",
   maternidadConfig_searchByCrotal: "Por crotal",
   maternidadConfig_searchById: "Por ID",
   maternidadConfig_manual: "Manual",
   maternidadConfig_withSword: "Con espada",
   maternidadConfig_crotalLabelSearch: "Crotal",
   maternidadConfig_idLabelSearch: "ID",
   maternidadConfig_crotalPlaceholderSearch: "Ej: 982091072397436",
   maternidadConfig_idPlaceholderSearch: "Ej: A13",
   maternidadConfig_crotalRequiredSearch: "Escribe un crotal para continuar.",
   maternidadConfig_idRequiredSearch: "Escribe un ID para continuar.",
   maternidadConfig_searchWithSwordHelp: "Al pulsar Escanear, se leerá la espada en esta pantalla y se buscará el animal con ese crotal.",
   maternidadConfig_readingSword: "Leyendo espada...",
   maternidadConfig_waitingMatch: "Esperando coincidencia",
   maternidadConfig_searchingAnimal: "Buscando animal...",
   maternidadConfig_readingSwordDescription: "Acerca el crotal al lector para identificar el animal.",
   maternidadConfig_waitingMatchDescription: "Animal localizado. Ahora acerca a la espada el crotal {{crotal}} para confirmar la coincidencia.",
   maternidadConfig_searchingAnimalDescription: "Consultando información del animal en el backend.",
   maternidadConfig_awrDisconnectedTitle: "Lector no conectado",
   maternidadConfig_awrSavedDescription: "Tienes lector guardado. Pulsa para seleccionar una.",
   maternidadConfig_awrNotSavedDescription: "No tienes ninguna AWR guardada. Pulsa para escanear una.",
   maternidadConfig_scan: "Escanear",
   maternidadConfig_continue: "Continuar",
   maternidadConfig_alert_error: "Error",
   maternidadConfig_alert_invalidBackendCrotal: "El backend no devolvió un crotal válido para comparar.",
   maternidadConfig_alert_awrNotConnected: "AWR no conectado",
   maternidadConfig_alert_connectSwordBeforeContinue: "Conecta una espada antes de continuar.",
   maternidadConfig_alert_couldNotStartReading: "No se pudo iniciar la lectura con la espada.",
   maternidadConfig_alert_missingData: "Falta dato",
   maternidadConfig_alert_writeCrotalToSearch: "Escribe un crotal para buscar.",
   maternidadConfig_alert_writeIdToSearch: "Escribe un ID para buscar.",
   maternidadConfig_alert_notFound: "No encontrado",
   maternidadConfig_alert_noAnimalWithCrotal: "No existe ningún animal con ese crotal.",
   maternidadConfig_alert_noAnimalWithId: "No existe ningún animal con ese ID.",
   maternidadConfig_alert_warning: "Aviso",
   maternidadConfig_alert_searchError: "Error en la búsqueda",
   maternidadConfig_alert_networkError: "Error de red",
   maternidadConfig_alert_networkErrorMessage: "No se pudo conectar con el servidor.",
   maternidadConfig_readOnlyTitle: "Permiso de solo lectura",
   maternidadConfig_readOnlyModifySettings: "Este usuario solo tiene permisos de lectura. No puede modificar esta configuración.",
   maternidadConfig_readOnlyUseFunction: "Este usuario solo tiene permisos de lectura. No puede usar esta función.",

   gestationReader_screenTitle: "Lector Gestación",

   gestationReader_animalInfoTitle: "Información del animal",
   gestationReader_animalInfoDescription: "Datos localizados en la búsqueda.",
   gestationReader_animalCardTitle: "Ficha Animal",
   gestationReader_animalIdLabel: "ID",
   gestationReader_animalCrotalLabel: "Crotal",
   gestationReader_fieldCorral: "Corral",
   gestationReader_fieldHouse: "Nave",
   gestationReader_fieldState: "Estado",
   gestationReader_fieldBodyCondition: "Condición corporal",
   gestationReader_fieldCycle: "Ciclo",
   gestationReader_fieldSystemEntryDate: "Entrada en sistema",
   gestationReader_newSearch: "Nueva búsqueda",

   gestationReader_summaryTitle: "Resumen",
   gestationReader_summaryDescription: "Parámetros elegidos en Configuración",
   gestationReader_mode: "Modo",
   gestationReader_corral: "Corral",
   gestationReader_modeEntry: "Entrada",
   gestationReader_modeExit: "Salida",
   gestationReader_modeReading: "Lectura",
   gestationReader_modeSearch: "Búsqueda",
   gestationReader_detectUnknownTitle: "Identificar animales desconocidos",
   gestationReader_detectUnknownDescription: "Cuando salga un animal sin ID, ofrecer asignarle un ID.",
   gestationReader_confirmSendTitle: "Confirmar envío",
   gestationReader_confirmSendDescription: "Pedirá confirmación antes de enviar cada registro.",
   gestationReader_changeSettings: "Cambiar configuración",

   gestationReader_currentReadingTitle: "Lectura actual",
   gestationReader_currentReadingDescription: "El crotal detectado y el ID asociado aparecerán aquí.",
   gestationReader_awrDisconnected: "AWR no conectado",
   gestationReader_readCrotal: "Crotal leído",
   gestationReader_readId: "ID",
   gestationReader_animalWithoutAssignedId: "Animal sin ID asignado",
   gestationReader_unknownAnimal: "Animal desconocido",

   gestationReader_animalWithoutIdTitle: "Animal sin ID",
   gestationReader_animalWithoutIdDescription: "Escribe un ID manual para actualizar el crotal leído.",
   gestationReader_newIdLabel: "Nuevo ID",
   gestationReader_newIdPlaceholder: "Ej: A13",
   gestationReader_updateId: "Actualizar ID",
   gestationReader_updatingId: "Actualizando...",

   gestationReader_sentRecordsTitle: "Registros enviados",
   gestationReader_noRecords: "No hay registros.",
   gestationReader_tableHeaderCorral: "Corral",
   gestationReader_tableHeaderId: "ID",
   gestationReader_tableHeaderCrotal: "Crotal",

   gestationReader_buttonAutoReading: "Lectura automática activa",
   gestationReader_buttonAutoSending: "Envío automático activo",
   gestationReader_buttonSending: "Enviando...",
   gestationReader_buttonSend: "Enviar",

   gestationReader_alertError: "Error",
   gestationReader_alertWarning: "Aviso",
   gestationReader_alertNetworkError: "Error de red",

   gestationReader_alertMissingCrotalTitle: "Falta crotal",
   gestationReader_alertMissingCrotalMessage: "Acerca el crotal al lector antes de enviar.",
   gestationReader_alertInvalidCrotalTitle: "Crotal inválido",
   gestationReader_alertInvalidCrotalMessage: "El crotal debe ser numérico.",
   gestationReader_alertReadErrorTitle: "Error en lectura",
   gestationReader_alertNetworkErrorMessage: "No se pudo conectar con el servidor.",

   gestationReader_alertMissingCorralTitle: "Falta corral",
   gestationReader_alertMissingCorralMessage: "Escribe el corral antes de enviar.",
   gestationReader_alertInvalidCorralTitle: "Corral inválido",
   gestationReader_alertInvalidCorralMessage: "El corral debe ser un número.",
   gestationReader_alertSendErrorTitle: "Error al enviar",
   gestationReader_alertNoIpConfigured: "No hay IP configurada.",

   gestationReader_alertMissingIdTitle: "Falta ID",
   gestationReader_alertMissingIdMessage: "Escribe el nuevo ID antes de actualizar.",
   gestationReader_alertMissingAssociatedCrotalTitle: "Falta crotal",
   gestationReader_alertMissingAssociatedCrotalMessage: "No hay crotal asociado para actualizar.",
   gestationReader_alertInvalidAssociatedCrotalTitle: "Crotal inválido",
   gestationReader_alertInvalidAssociatedCrotalMessage: "El crotal asociado no es válido.",
   gestationReader_alertUpdateIdErrorTitle: "Error al actualizar ID",
   gestationReader_readerMode: "Lector",
   gestationReader_keyboardMode: "Teclado",

   gestationReader_keyboardEntryTitle: "Entrada por teclado",
   gestationReader_keyboardExitTitle: "Salida por teclado",
   gestationReader_keyboardDescription: "Escribe el dato manualmente con el teclado del teléfono.",
   gestationReader_keyboardId: "ID",
   gestationReader_keyboardCrotal: "Crotal",
   gestationReader_keyboardIdLabel: "ID animal",
   gestationReader_keyboardCrotalLabel: "Crotal",
   gestationReader_keyboardIdPlaceholder: "Escribe el ID",
   gestationReader_keyboardCrotalPlaceholder: "Escribe el crotal",
   gestationReader_keyboardAdd: "Añadir",
   gestationReader_keyboardAdding: "Añadiendo...",

   gestationReader_pendingRecordsTitle: "Registros no enviados",
   gestationReader_buttonSendingBatch: "Enviando lote...",
   gestationReader_buttonSendBatch: "Enviar lote",
   gestationReader_buttonSendBatchCount: "Enviar lote ({{count}})",

   gestationReader_noPendingRecordsTitle: "Sin registros",
   gestationReader_noPendingRecordsText: "No hay registros pendientes para enviar.",
   gestationReader_batchSentTitle: "Lote enviado",
   gestationReader_batchSentText: "Se han enviado {{count}} registro(s) correctamente.",
   gestationReader_batchWithErrorsTitle: "Lote con errores",

   gestationReader_recordSentTitle: "Registro enviado",
   gestationReader_recordSentText: "El movimiento se ha enviado correctamente.",

   gestationReader_invalidAnimalId: "El ID del animal no es válido.",
   gestationReader_invalidPenRecord: "El corral del registro no es válido.",
   gestationReader_invalidCrotalRecord: "El crotal del registro no es válido.",
   gestationReader_duplicateIdPending: "El ID {{id}} ya está en la tabla de registros no enviados.",
   gestationReader_duplicateCrotalPending: "El crotal {{crotal}} ya está en la tabla de registros no enviados.",
   gestationReader_keyboardMissingId: "Escribe el ID del animal.",
   gestationReader_keyboardMissingCrotal: "Escribe el crotal del animal.",
   gestationReader_keyboardMissingPen: "Selecciona un corral válido antes de añadir el animal.",
   gestationReader_noAnimalById: "No existe ningún animal con el ID {{id}}.",
   gestationReader_noAnimalByCrotal: "No existe ningún animal con el crotal {{crotal}}.",
   gestationReader_addAnimalError: "No se pudo añadir el animal.",

   gestationReader_pendingAnimalHint: "Los animales leídos aparecerán aquí.",

   gestationReader_changePenTitle: "Cambiar corral",
   gestationReader_changePenDescription: "Introduce el nuevo corral de entrada.",
   gestationReader_newPenLabel: "Nuevo corral",
   gestationReader_newPenPlaceholder: "Ej: 1",
   gestationReader_cancel: "Cancelar",
   gestationReader_save: "Guardar",
   gestationReader_accept: "Aceptar",
   gestationReader_sentHistoryTitle: "Historial enviados",

   maternityReader_screenTitle: "Lector Maternidad",
   maternityReader_alertMissingCrotalTitle: "Falta crotal",
   maternityReader_alertMissingCrotalMessage: "Acerca el crotal al lector antes de enviar.",
   maternityReader_alertInvalidCrotalTitle: "Crotal inválido",
   maternityReader_alertInvalidCrotalMessage: "El crotal debe ser numérico.",
   maternityReader_alertReadErrorTitle: "Error en lectura",
   maternityReader_alertNetworkError: "Error de red",
   maternityReader_alertNetworkErrorMessage: "No se pudo conectar con el servidor.",
   maternityReader_alertMissingCorralTitle: "Falta corral",
   maternityReader_alertMissingCorralMessage: "Escribe el corral antes de enviar.",
   maternityReader_alertInvalidCorralTitle: "Corral inválido",
   maternityReader_alertInvalidCorralMessage: "El corral debe ser un número (ej: 8).",
   maternityReader_alertError: "Error",
   maternityReader_alertNoIpConfigured: "No hay IP configurada.",
   maternityReader_alertWarning: "Aviso",
   maternityReader_alertSendErrorTitle: "Error al enviar",
   maternityReader_alertMissingIdTitle: "Falta ID",
   maternityReader_alertMissingIdMessage: "Escribe el nuevo ID antes de actualizar.",
   maternityReader_alertMissingAssociatedCrotalTitle: "Falta crotal",
   maternityReader_alertMissingAssociatedCrotalMessage: "No hay crotal asociado para actualizar.",
   maternityReader_alertInvalidAssociatedCrotalTitle: "Crotal inválido",
   maternityReader_alertInvalidAssociatedCrotalMessage: "El crotal asociado no es válido.",
   maternityReader_alertUpdateIdErrorTitle: "Error al actualizar ID",
   maternityReader_animalInfoTitle: "Información del animal",
   maternityReader_animalInfoDescription: "Datos localizados en la búsqueda.",
   maternityReader_animalCardTitle: "Ficha Animal",
   maternityReader_animalIdLabel: "ID",
   maternityReader_animalCrotalLabel: "Crotal",
   maternityReader_fieldCorral: "Corral",
   maternityReader_fieldHouse: "Nave",
   maternityReader_fieldState: "Estado",
   maternityReader_fieldBodyCondition: "Condición corporal",
   maternityReader_fieldCycle: "Ciclo",
   maternityReader_fieldSystemEntryDate: "Entrada en sistema",
   maternityReader_newSearch: "Nueva búsqueda",
   maternityReader_summaryTitle: "Resumen",
   maternityReader_summaryDescription: "Parámetros elegidos en Configuración",
   maternityReader_mode: "Modo",
   maternityReader_modeEntry: "Entrada",
   maternityReader_modeExit: "Salida",
   maternityReader_modeReading: "Lectura",
   maternityReader_corral: "Corral",
   maternityReader_detectUnknownTitle: "Identificar animales desconocidos",
   maternityReader_detectUnknownDescription: "Cuando salga un animal sin ID, ofrecer asignarle un ID.",
   maternityReader_confirmSendTitle: "Confirmar envío",
   maternityReader_confirmSendDescription: "Pedirá confirmación antes de enviar cada registro.",
   maternityReader_changeSettings: "Cambiar configuración",
   maternityReader_currentReadingTitle: "Lectura actual",
   maternityReader_currentReadingDescription: "El crotal detectado aparecerá aquí.",
   maternityReader_awrDisconnected: "AWR no conectado",
   maternityReader_readCrotal: "Crotal leído",
   maternityReader_readId: "ID",
   maternityReader_animalWithoutAssignedId: "Animal sin ID asignado",
   maternityReader_unknownAnimal: "Animal desconocido",
   maternityReader_animalWithoutIdTitle: "Animal sin ID",
   maternityReader_animalWithoutIdDescription: "Escribe un ID manual para actualizar el crotal leído.",
   maternityReader_newIdLabel: "Nuevo ID",
   maternityReader_newIdPlaceholder: "Ej: A13",
   maternityReader_updatingId: "Actualizando...",
   maternityReader_updateId: "Actualizar ID",
   maternityReader_sentRecordsTitle: "Registros enviados",
   maternityReader_tableHeaderCorral: "Corral",
   maternityReader_tableHeaderId: "ID",
   maternityReader_tableHeaderCrotal: "Crotal",
   maternityReader_noRecords: "No hay registros.",
   maternityReader_buttonAutoReading: "Lectura automática activa",
   maternityReader_buttonAutoSending: "Envío automático activo",
   maternityReader_buttonSending: "Enviando...",
   maternityReader_buttonSend: "Enviar",


   awrScanResults_title: "AWR – Resultados de escaneo",
   awrScanResults_searching: "Buscando AWR…",
   awrScanResults_warningTitle: "Aviso",
   awrScanResults_noDevicesNearby: "No se han encontrado AWR cercanos.",
   awrScanResults_connecting: "Conectando…",
   awrScanResults_connectErrorFallback: "No se pudo conectar",
   awrScanResults_connectedTitle: "Conectado",
   awrScanResults_connectedMessage: "Conexión establecida con {{device}}.",
   awrScanResults_genericDevice: "el dispositivo",

   awrSavedList_title: "AWR escaneados",
   awrSavedList_connecting: "Conectando…",
   awrSavedList_empty: "No hay AWR guardados. Escanea uno desde “Configuración AWR”.",
   awrSavedList_connected: "Conectado",
   awrSavedList_disconnected: "Desconectado",
   awrSavedList_renameAccessibility: "Renombrar",
   awrSavedList_deleteAccessibility: "Eliminar",
   awrSavedList_renameTitle: "Renombrar AWR",
   awrSavedList_nameLabel: "Nombre",
   awrSavedList_deleteTitle: "Eliminar AWR guardado",
   awrSavedList_deleteMessage: "¿Seguro que quieres eliminar este AWR de la lista?",
   awrSavedList_deleteAction: "Eliminar",

   ipConfig_title: "Configuración IP",
   ipConfig_cardTitle: "Servidor CTIFEED",
   ipConfig_cardDescription: "Introduce la IP del servidor donde se abrirá el portal.",
   ipConfig_inputLabel: "IP (solo la IP)",
   ipConfig_saved: "Guardado",
   ipConfig_alertSuccessTitle: "Correcto",
   ipConfig_alertSuccessMessage: "IP correcta",
   ipConfig_alertWarningTitle: "Aviso",
   ipConfig_alertServerNotUpdated: "Servidor no actualizado",
   ipConfig_alertErrorTitle: "Error",
   ipConfig_alertInvalidIp: "IP no válida",

   portal_preparing: "Preparando portal...",
   portal_noSessionToken: "No hay token de sesión. Inicia sesión de nuevo.",
   portal_noIpConfigured: "No hay IP configurada. Configura primero la IP del servidor.",
   portal_prepareUrlError: "No se pudo preparar la URL del portal.",
   portal_loadError: "No se pudo cargar el portal.",
   portal_checkingConnection: "Comprobando conexión con el portal...",
   portal_noConnectionTitle: "No hay conexión",
   portal_connectionTimeout: "No se ha podido conectar con el portal. Verifica que esté conectada la red correcta.",
   portal_connectionError: "No se ha podido conectar con el portal. Verifica la red o la IP configurada.",
   portal_httpError: "No se ha podido abrir el portal. Error HTTP {{status}}.",
   portal_retry: "Reintentar",
   portal_loading: "Cargando portal...",


   AltaDispositivos: "Alta dispositivos",
   LectorMaternidad: "Lector Maternidad",
   LectorGestacion: "Lector Gestación",
   ConfiguracionIP: "Configuración IP",
   ConfiguracionAWR: "Configuración AWR",
   DarDeAltaAWR: "Dar de Alta AWR",
   AWREscaneados: "AWR escaneados",
   CerrarSesion: "Cerrar sesión",


   Config_lastReadMismatchTitle: "El animal leído no coincide con la búsqueda",
   Config_lastReadMismatchCrotal: "Crotal",
   Config_lastReadMismatchId: "ID",

   animalState: {
      gestation: "Gestación",
      maternity: "Maternidad",
      out_of_gestation: "Fuera de gestación",
      out_of_maternity: "Fuera de maternidad"
   },

   Reader_readingTitle: "Lectura Crotales",
   Reader_labelId: "ID",
   Reader_labelCrotal: "Crotal",
   Reader_labelCorral: "Corral",
   Reader_labelHouse: "Nave",
   Reader_labelState: "Estado",
   Reader_autoReadingBadge: "Lectura automática",


   gestacionConfig_flowSectionTitle: "Configuración del flujo",
   gestacionConfig_workModeTitle: "Modo de trabajo",
   gestacionConfig_workModeDescription: "Selecciona qué hará el lector.",
   gestacionConfig_entryDescription: "Registrar entrada",
   gestacionConfig_exitDescription: "Registrar salida",
   gestacionConfig_readingDescription: "Solo consultar",
   gestacionConfig_searchDescription: "Buscar animal",

   gestacionConfig_sendSettingsTitle: "Ajustes del envío",
   gestacionConfig_sendSettingsDescription: "Configura cómo se comporta el flujo al leer animales.",

   gestacionConfig_corralSectionTitle: "Corral de entrada",
   gestacionConfig_corralSectionDescription: "Este dato es obligatorio para continuar con el registro.",

   gestacionConfig_alerts_notice: "Aviso",
   gestacionConfig_alerts_invalidCrotalFromBackend: "El backend no devolvió un crotal válido para comparar.",

   common_accept: "Aceptar",

   maternidadConfig_flowSectionTitle: "Configuración del flujo",
   maternidadConfig_workModeTitle: "Modo de trabajo",
   maternidadConfig_workModeDescription: "Selecciona qué hará el lector.",
   maternidadConfig_entryDescription: "Registrar entrada",
   maternidadConfig_exitDescription: "Registrar salida",
   maternidadConfig_readingDescription: "Solo consultar",
   maternidadConfig_searchDescription: "Buscar animal",

   maternidadConfig_sendSettingsTitle: "Ajustes del envío",
   maternidadConfig_sendSettingsDescription: "Configura cómo se comporta el flujo al leer animales.",

   maternidadConfig_corralSectionTitle: "Corral de entrada",
   maternidadConfig_corralSectionDescription: "Este dato es obligatorio para continuar con el registro.",

   maternidadConfig_alert_invalidCrotalFromBackend: "El backend no devolvió un crotal válido para comparar.",

   ajustesEnvioMaternidad: {
      headerTitle: "Ajustes del envío",
      headerSubtitle: "Configura cómo se comporta gestación al leer animales.",
      cardTitle: "Envío de registros",
      cardSubtitle: "Estos ajustes se aplican al continuar con la lectura."
   },

   noAlimentadosMaternidad: {
      viewStatus: "Ver estado",
      animalIdNotFound: "No se encontró el identificador del animal.",
      openAnimalInfoError: "No se pudo abrir la información del animal.",
      animalId: "ID ANIMAL",
      corral: "Corral",
      consumption: "Consumo",
      withoutFeeding: "Sin alimentar",
      day: "día",
      days: "días",
      loadingAnimals: "Cargando animales...",
      title: "No alimentados",
      totalAnimalsMaternity: "Total animales Maternidad:",
      notSeen: "No vistos",
      all: "Todos",
      sort: "Ordenar",
      emptyTitle: "No hay animales pendientes",
      emptyText: "No se encontraron animales no alimentados en maternidad.",
      sortBy: "Ordenar por",
      daysWithoutFeeding: "Días sin alimentar",
      sortDaysHelp: "Ordena por los días sin alimentación",
      sortCorralHelp: "Ordena por el número de corral",
      descending: "Descendente",
      ascending: "Ascendente",
      filterAnimals: "Filtrar animales",
      allHelp: "Muestra todos los animales",
      unmarked: "No marcados",
      unmarkedHelp: "Oculta los animales ya revisados",
      clearMarkedTitle: "Limpiar animales marcados",
      clearMarkedText: "Se eliminarán todas las marcas de animales revisados.",
      cancel: "Cancelar",
      clear: "Limpiar",
      error: "Error",
      serverConnectionError: "No se pudo conectar con el servidor."
   },

   noAlimentadosGestacion: {
      animalId: "ID ANIMAL",
      corral: "Corral",
      consumption: "Consumo",
      withoutFeeding: "Sin alimentar",
      day: "día",
      days: "días",
      loadingAnimals: "Cargando animales...",
      title: "No alimentados",
      totalAnimalsGestation: "Total animales Gestación:",
      notSeen: "No vistos",
      all: "Todos",
      sort: "Ordenar",
      emptyTitle: "No hay animales pendientes",
      emptyText: "No se encontraron animales no alimentados en gestación.",
      sortBy: "Ordenar por",
      daysWithoutFeeding: "Días sin alimentar",
      sortDaysHelp: "Ordena por los días sin alimentación",
      sortCorralHelp: "Ordena por el número de corral",
      descending: "Descendente",
      ascending: "Ascendente",
      filterAnimals: "Filtrar animales",
      allHelp: "Muestra todos los animales",
      unmarked: "No marcados",
      unmarkedHelp: "Oculta los animales ya revisados",
      clearMarkedTitle: "Limpiar animales marcados",
      clearMarkedText: "Se eliminarán todas las marcas de animales revisados.",
      cancel: "Cancelar",
      clear: "Limpiar",
      error: "Error",
      serverConnectionError: "No se pudo conectar con el servidor.",
      viewStatus: "Ver estado",
      animalIdNotFound: "No se encontró el identificador del animal.",
      openAnimalInfoError: "No se pudo abrir la información del animal.",
   },

   capturaAnimalHome: {
      selectOption: "Selecciona una opción",
      unfedAnimalsTitle: "Animales no alimentados",
      unfedAnimalsDescription: "Consulta los animales que no han recibido la alimentación prevista.",
      twoFeedsTitle: "2 piensos",
      twoFeedsDescription: "Gestiona el cambio de alimentación en las bocas de caída.",
      animalStatusTitle: "Estado animal",
      animalStatusDescription: "Consultar o actualizar el estado del animal.",
      birthCaptureTitle: "Captura de parto",
      birthCaptureDescription: "Registra los nacidos vivos, muertos y momificados.",
   },
   cambioPiensoMaternidad: {
      error: "Error",
      loadTasksError: "No se pudieron cargar las tareas de cambio de pienso.",
      loadingTasks: "Cargando tareas...",
      title: "Cambio de pienso",
      pendingTask: "{{count}} tarea pendiente",
      pendingTasks: "{{count}} tareas pendientes",
      emptyTitle: "No hay tareas pendientes",
      emptyText: "No se encontraron tareas de cambio de pienso.",
      animalId: "ID ANIMAL",
      corral: "Corral",
      setTo: "Fijar a",
      destination: "Destino"
   },
   estadoAnimal: {
      queryLabel: "Consulta",
      title: "Estado animal",
      subtitle: "Selecciona cómo quieres identificar el animal.",

      corral: "Corral",
      corralDescription: "Introduce el número de corral.",
      corralMaternityDescription: "Introduce el número del corral de maternidad.",

      id: "ID",
      idDescription: "Introduce el identificador del animal.",
      animalId: "ID animal",
      idAnimalDescription: "Busca el animal en maternidad y gestación.",

      requiredData: "Dato requerido",
      enterCorral: "Introduce el número de corral.",
      enterId: "Introduce el identificador del animal.",

      consulting: "Consultando...",
      continue: "Continuar",
      accept: "Aceptar",

      animalNotFound: "Animal no encontrado",
      serverConnectionError: "No se pudo conectar con el servidor.",
      noIpConfigured: "No hay IP configurada.",

      nextScreenPending: "La pantalla de información del animal la haremos en el siguiente paso.",
   },
   matCorralDetail: {
      earTagAlreadyAssigned: "El crotal está asignado a otro animal",
      readOnlyPermission: "Permiso de solo lectura",
      readOnlyPermissionText: "Este usuario solo tiene permisos de lectura. No puede realizar operaciones sobre el animal.",
      animalStatus: "Estado animal",
      id: "ID",
      earTag: "Crotal",
      cycle: "Ciclo",
      day: "Día",

      curve: "Curva",
      correction: "Corrección",
      entryDate: "Fecha entrada",
      farrowingDate: "Fecha parto",
      house: "Nave",
      pen: "Corral",
      lastFeeding: "Última alimentación",
      presentPiglets: "Lechones vivos",
      inseminationDate: "Fecha inseminación",
      teatsNumber: "Nº tetas",

      operations: "Operaciones",

      consumption: "Consumo",
      ofGrams: "de {{amount}} gr",
      oneDayWithoutFeeding: "1 día sin alimentar",
      daysWithoutFeeding: "{{count}} días sin alimentar",

      noAnimalData: "No hay datos del animal",
      noAnimalDataText: "No se ha recibido información para mostrar.",
      back: "Volver",
      operationsPendingTitle: "Operaciones",
      operationsPendingText: "Las operaciones las haremos en el siguiente paso.",
      moveToWeaning: "Pasar a destete",
      chooseOption: "Selecciona una operación para este animal.",
      nextOperation: "Siguiente operación",
      insertAnimal: "Insertar animal",
      moveToLactation: "Pasar a lactancia",
      nextStep: "Siguiente paso",
      actions: "Acciones",

      bodyCondition: "Condición corporal",
      subState: "SubEstado",
      pigletCapture: "Captura de lechones",
      animalExit: "Salida animal",
      replaceEarTag: "Sustituir crotal",
      changePen: "Cambiar corral",
      anonymousAnimalId: "Identificador animal anónimo",

      cancel: "Cancelar",
      accept: "Aceptar",
      saving: "Guardando...",
      error: "Error",

      operationDone: "Operación realizada correctamente.",
      changeStateDone: "SubEstado actualizado correctamente.",
      changeStateError: "No se pudo cambiar el estado del animal.",
      confirmNextOperation: "¿Seguro que quieres pasar a la siguiente operación?",
      pkidChangeStateNotFound: "No se encontró el identificador interno del animal.",

      selectExitType: "Selecciona el tipo de salida que quieres aplicar.",
      exitImmediate: "Salida inmediata",
      exitScheduled: "Salida programada",
      exitScheduledEmptyHopper: "Salida programada con tolva vacía",
      cancelScheduledExit: "Cancelar salida programada",
      scheduledDate: "Fecha programada",
      exitDateLimitText: "No se puede seleccionar una fecha anterior a hoy ni posterior a 3 días.",
      animalExitDone: "Salida de animal realizada correctamente.",
      animalExitError: "No se pudo realizar la salida del animal.",
      pkidExitNotFound: "No se encontró el identificador interno del animal.",

      selectCurve: "Seleccionar curva",
      selectCurveText: "Selecciona la nueva curva del animal.",
      loadingCurves: "Cargando curvas...",
      noCurvesAvailable: "No hay curvas disponibles.",
      confirmChangeCurve: "¿Seguro que quieres cambiar la curva?",
      loadCurvesError: "No se pudieron cargar las curvas.",
      pkidChangeCurveNotFound: "No se encontró el identificador interno del animal.",
      changeCurveDone: "Curva actualizada correctamente.",
      changeCurveError: "No se pudo cambiar la curva.",

      selectBodyConditionText: "Selecciona la nueva condición corporal del animal.",
      loadingBodyConditions: "Cargando condiciones corporales...",
      noBodyConditionsAvailable: "No hay condiciones corporales disponibles.",
      confirmChangeBodyCondition: "¿Seguro que quieres cambiar la condición corporal?",
      loadBodyConditionsError: "No se pudieron cargar las condiciones corporales.",
      pkidChangeBodyConditionNotFound: "No se encontró el identificador interno del animal.",
      changeBodyConditionDone: "Condición corporal actualizada correctamente.",
      changeBodyConditionError: "No se pudo cambiar la condición corporal.",

      selectSubStateText: "Selecciona manualmente el nuevo subestado del animal.",
      confirmChangeSubState: "¿Seguro que quieres cambiar el subestado?",

      currentPen: "Corral actual: {{pen}}",
      newPen: "Nuevo corral",
      enterNewPen: "Introduce el nuevo corral.",
      pkidChangePenNotFound: "No se encontró el identificador interno del animal.",
      changePenDone: "Corral actualizado correctamente.",
      changePenError: "No se pudo cambiar el corral.",

      currentEarTag: "Crotal actual: {{earTag}}",
      newEarTag: "Nuevo crotal",
      enterNewEarTag: "Introduce el nuevo crotal.",
      pkidEarTagNotFound: "No se encontró el identificador interno del animal.",
      replaceEarTagDone: "Crotal actualizado correctamente.",
      replaceEarTagError: "No se pudo sustituir el crotal.",

      identifyAnonymousAnimalText: "Elige si quieres asignar un ID o un crotal al animal.",
      newId: "Nuevo ID",
      enterNewId: "Introduce el nuevo ID.",
      idExample: "Ej: 1010",
      earTagExample: "Ej: 123",
      notAnonymousAnimalText: "Este animal no es anónimo porque ya tiene ID o crotal asignado.",
      pkidIdentifyNotFound: "No se encontró el identificador interno del animal.",
      identifyAnonymousAnimalDone: "Identificador del animal actualizado correctamente.",
      identifyAnonymousAnimalError: "No se pudo identificar el animal anónimo.",

      livePiglets: "Vivos",
      deadPiglets: "Muertos",
      mummifiedPiglets: "Momificados",
      totalBornPiglets: "Nacidos totales",
      pigletCaptureText: "Introduce los lechones vivos, muertos y momificados.",
      captureBeforeLactationText: "Registra los nacidos antes de pasar a lactancia.",
      weaningPigletsOnlyRead: "En destete solo se pueden consultar los lechones.",
      pkidPigletsNotFound: "No se encontró el identificador interno del animal.",
      pigletCaptureDone: "Captura de lechones guardada correctamente.",
      pigletCaptureError: "No se pudo guardar la captura de lechones.",
      penNotFound: "Corral no encontrado",
   },
   subState: {
      prepartum: "Preparto",
      lactation: "Lactancia",
      weaning: "Destete",
   },

   capturaParto: {
      birthDataTitle: "Datos del parto",
      birthDataSubtitle: "Revisa los datos del animal antes de registrar el parto.",
      corral: "Corral",
      id: "ID",
      date: "Fecha",
      subState: "SubEstado",

      dataCollectionTitle: "Recogida de datos",
      dataCollectionSubtitle: "Introduce los nacidos vivos, muertos y momificados.",
      weaningReadOnly: "En destete solo se pueden consultar los datos.",

      totalBorn: "Nacidos totales",
      live: "Vivos",
      dead: "Muertos",
      mummified: "Momificados",

      prepartum: "Preparto",
      farrowing: "Parto",
      lactation: "Lactancia",
      weaning: "Destete",

      accept: "Aceptar",
      cancel: "Cancelar",
      saving: "Guardando...",

      sentTitle: "Captura enviada",
      sentMessage: "La captura de parto se ha guardado correctamente.",

      errorTitle: "Error",
      invalidAnimalTitle: "Animal no válido",
      invalidAnimalText: "No se encontró el identificador interno del animal.",
      reportSendError: "No se pudo guardar la captura de parto.",

      invalidDateTitle: "Fecha no válida",
      invalidDateMessage: "La fecha de parto no puede ser posterior a hoy.",
      changeDate: "Cambiar fecha",

      selectDateTitle: "Seleccionar fecha",
      selectDateMessage: "Ajusta la fecha del parto con los botones.",
   },

   capturaMaternidadEntrada: {
      title: "Captura de parto",
      description: "Busca el animal por corral o por ID para registrar el parto.",
      maternityLabel: "MATERNIDAD",

      corral: "Corral",
      corralDescription: "Busca el animal por el número de corral.",
      id: "ID",
      idDescription: "Busca el animal por su identificador.",
      animalId: "ID animal",

      corralExample: "Ej: 102",
      idExample: "Ej: 1234",

      consulting: "Consultando...",
      continue: "Continuar",
      accept: "Aceptar",

      serverConnectionError: "No se pudo conectar con el servidor.",
   },

   altaBajaStack: {
      tituloPantalla: "Alta/Baja de lechones",
      descripcionPantalla: "Busca la madre por corral o ID para registrar altas o bajas de lechones.",
   },

   altaBajaLechones: {
      heroTitle: "Movimiento de lechones",
      statusAlta: "Alta",
      statusBaja: "Baja",

      corralUpper: "CORRAL",
      idUpper: "ID",
      dateUpper: "FECHA",

      movementType: "Tipo de movimiento",
      movementSubtitle: "Selecciona si quieres registrar alta o baja.",
      adoption: "Adopción",
      baja: "Baja",

      adoptionData: "Datos de adopción",
      donorMother: "Madre donante",
      donatesPiglets: "Dona lechones",
      id: "ID",
      transferredPiglets: "Lechones transferidos",
      totalAdopted: "Total adoptados",
      total: "Total",

      bajaReason: "Motivo de baja",
      reasonCrushing: "Aplastamiento",
      reasonDiarrhea: "Diarrea",
      reasonLowViability: "Baja viabilidad",
      reasonDeformities: "Deformidades",
      reasonOther: "Otros",

      piglet: "lechón",
      piglets: "lechones",
      description: "Descripción",

      editReason: "Editar motivo",
      addReason: "Añadir motivo",
      reasonModalText: "Indica la cantidad de lechones y describe el motivo.",

      saving: "Guardando...",
      saveAlta: "Guardar alta",
      saveBaja: "Guardar baja",
      accept: "Aceptar",
      cancel: "Cancelar",

      error: "Error",
      missingData: "Faltan datos",
      saveError: "Error al guardar",
      saveErrorText: "No se pudo guardar la operación.",
      selectedAnimalPkidNotFound: "No se encontró el identificador interno del animal seleccionado.",

      enterTransferredPiglets: "Introduce el número de lechones transferidos.",
      invalidTotalTitle: "Total no válido",
      invalidPigletsNumber: "Introduce un número válido de lechones.",

      missingDescriptionTitle: "Descripción obligatoria",
      missingDescriptionText: "Introduce la descripción del motivo.",
      invalidQuantityTitle: "Cantidad no válida",
      invalidPigletQuantity: "Introduce una cantidad válida de lechones.",

      selectReasonRequired: "Selecciona al menos un motivo de baja.",

      adoptionSavedTitle: "Alta guardada",
      adoptionSavedMessage: "Se han registrado {{count}} lechones correctamente.",

      bajasSavedTitle: "Bajas guardadas",
      bajasSavedMessage: "Se han registrado {{piglets}} bajas correctamente en {{reasons}} motivo(s).",
   },
   avisoAplicacionNoConfigurada: {
      title: "Aplicación no configurada",
      text: "Configure la Dirección IP del Servidor",
      link: "Pulse aquí",
   },
   generalHome: {
      servidorCtifeedDesactualizadoTitulo: "Servidor CTIFEED desactualizado",
      servidorCtifeedDesactualizadoTexto: "Es necesario actualizar el servidor CTIFEED para usar esta funcionalidad.",
      tareasMovimientosTitulo: "Tareas de movimientos",
      tareasMovimientosDescripcion: "Consulta y gestión de tareas pendientes de movimientos.",
      movementAnimalTitle: "Movimiento animal",
      readerDescription: "Lector de crotales.",
      keyboardDescription: "Teclado",

      ctifeedTitle: "CTIFEED",
      ctifeedDescription: "Accede al portal principal.",

      modalApplicationNotConfiguredTitle: "Aplicación no configurada",
      modalNoSessionTitle: "Sesión no iniciada",
      modalInstallationUnavailableTitle: "Instalación no disponible",
      modalPreparingSessionTitle: "Preparando sesión",
      modalReadOnlyPermissionTitle: "Permiso solo lectura",

      modalApplicationNotConfiguredText: "No hay ninguna instalación configurada. Ve a Instalaciones y selecciona una.",
      modalNoSessionText: "La instalación tiene IP, pero no hay sesión iniciada. Revisa el Username y la Clave en Instalaciones.",
      modalInstallationUnavailableText: "No se puede conectar con la instalación seleccionada. Comprueba que estás conectado a la red WiFi correcta o revisa la IP del servidor.",
      modalPreparingSessionText: "La sesión todavía se está cargando. Inténtalo de nuevo en unos segundos.",
      modalReadOnlyPermissionText: "Tu usuario no tiene permisos de administrador para acceder a esta funcionalidad.",

      accept: "Aceptar",

      connectingTitle: "Conectando...",
      connectingText: "Comprobando conexión con la instalación seleccionada.",
   },

   movimientoAnimalMaternidad: {
      smallLabel: "MOVIMIENTO",
      title: "Maternidad",
      subtitle: "Realiza entradas y salidas manuales por teclado.",

      movementType: "Tipo de movimiento",
      entry: "Entrada",
      exit: "Salida",

      searchAnimal: "Buscar animal",
      entryHelper: "Introduce el corral de destino y el ID del animal.",
      exitHelper: "Selecciona si quieres hacer la salida por corral o por ID.",

      pen: "Corral",
      animalId: "ID Animal",
      type: "Tipo",

      sending: "Enviando...",
      accept: "Aceptar",
      cancel: "Cancelar",

      confirmEntry: "Confirmar entrada",
      confirmExit: "Confirmar salida",
      confirmSubtitle: "Revisa los datos antes de enviar el movimiento.",

      incompleteDataTitle: "Datos incompletos",
      entryIncompleteText: "Introduce el corral y el ID del animal.",
      exitPenIncompleteText: "Introduce el corral para hacer la salida.",
      exitIdIncompleteText: "Introduce el ID del animal para hacer la salida.",

      invalidPenTitle: "Corral inválido",
      invalidPenText: "El corral debe ser un número válido mayor que 0.",

      sendErrorTitle: "Error al enviar",
      connectionErrorTitle: "Error de conexión",
      noIpConfigured: "No hay una IP configurada.",
      serverConnectionError: "No se pudo conectar con el servidor.",
      serverEmptyResponse: "El servidor no devolvió mensaje. Código HTTP {{status}}.",

      entrySentTitle: "Entrada enviada",
      entrySentText: "El movimiento de entrada se ha enviado correctamente.",

      exitSentTitle: "Salida enviada",
      exitByPenSentText: "La salida por corral se ha enviado correctamente.",
      exitByIdSentText: "La salida por ID se ha enviado correctamente.",
   },

   movimientoAnimalGestacion: {
      smallLabel: "GESTACIÓN",
      title: "Movimiento animal",
      subtitle: "Realiza entradas y salidas manuales por teclado.",

      movementType: "Tipo de movimiento",
      entry: "Entrada",
      exit: "Salida",

      searchAnimal: "Buscar animal",
      entryHelper: "Introduce el corral de destino y el ID del animal.",
      exitHelper: "Introduce el ID del animal para hacer la salida de gestación.",

      pen: "Corral",
      animalId: "ID Animal",
      type: "Tipo",

      sending: "Enviando...",
      accept: "Aceptar",
      cancel: "Cancelar",

      confirmEntry: "Confirmar entrada",
      confirmExit: "Confirmar salida",
      confirmSubtitle: "Revisa los datos antes de enviar el movimiento.",

      incompleteDataTitle: "Datos incompletos",
      entryIncompleteText: "Introduce el corral y el ID del animal.",
      exitIdIncompleteText: "Introduce el ID del animal para hacer la salida.",

      invalidPenTitle: "Corral inválido",
      invalidPenText: "El corral debe ser un número válido mayor que 0.",

      sendErrorTitle: "Error al enviar",
      noIpConfigured: "No hay una IP configurada.",
      serverConnectionError: "No se pudo conectar con el servidor.",
      serverEmptyResponse: "El servidor no devolvió mensaje. Código HTTP {{status}}.",

      entrySentTitle: "Entrada enviada",
      entrySentText: "El movimiento de entrada en gestación se ha enviado correctamente.",

      exitSentTitle: "Salida enviada",
      exitByIdSentText: "La salida por ID en gestación se ha enviado correctamente.",
   },

   gestCorralDetail: {
      title: "Estado animal gestación",
      emptyTitle: "No hay animal en este corral",

      id: "ID",
      crotal: "Crotal",
      cycle: "Ciclo",
      day: "Día",

      stateGestation: "Gestación",
      stateOutOfGestation: "Fuera de gestación",

      curve: "Curva",
      correction: "Corrección",
      entryDate: "Fecha entrada",
      inseminationDate: "Fecha inseminación",
      house: "Nave",
      corral: "Corral",
      estimatedFarrowingDate: "Fecha estimada parto",
      lastFeeding: "Última alimentación",

      oneDayWithoutFeeding: "1 día sin alimentar",
      daysWithoutFeeding: "{{count}} días sin alimentar",
      of: "de",
      operationsButton: "Operaciones",
      operationsTitle: "Operaciones",
      operationsSubtitle: "Selecciona una operación",

      operationInseminationDate: "Fecha inseminación",
      operationCurve: "Curva",
      operationBodyCondition: "Condición corporal",
      operationChangePen: "Cambio corral",
      operationExitAnimal: "Salida animal",
      operationReplaceEarTag: "Sustituir crotal",
      cancel: "Cancelar",
      accept: "Aceptar",
      saving: "Guardando...",

      selectCurve: "Seleccionar curva",
      loadingCurves: "Cargando curvas...",
      noCurvesAvailable: "No hay curvas disponibles",

      selectBodyCondition: "Seleccionar condición corporal",
      loadingBodyConditions: "Cargando condiciones corporales...",
      noBodyConditionsAvailable: "No hay condiciones corporales disponibles",

      changePenTitle: "Cambiar corral",
      currentPen: "Corral actual: {{corral}}",
      newPen: "Nuevo corral",
      changePenPlaceholder: "Introduce el corral destino",

      replaceEarTagTitle: "Sustituir crotal",
      currentEarTag: "Crotal actual: {{crotal}}",
      newEarTag: "Nuevo crotal",
      replaceEarTagPlaceholder: "Introduce el nuevo crotal",

      inseminationDateTitle: "Fecha inseminación",
      selectDate: "Selecciona la fecha",
      noFutureInseminationDate: "No se permite seleccionar una fecha posterior a la actual.",

      exitAnimalTitle: "Salida animal",
      exitAnimalGestation: "Salida animal gestación",
      exitDate: "Fecha salida",
      noFutureExitDate: "La fecha de salida no puede ser superior a la fecha actual.",
      penNotFound: "Corral no encontrado",
      changePenGenericError: "No se pudo cambiar el corral.",
      earTagAlreadyAssigned: "El crotal está asignado a otro animal",
      replaceEarTagGenericError: "No se pudo sustituir el crotal.",
   },

   tareasMovimientos: {
      tabs: {
         tareas: "Tareas",
         historial: "Historial"
      },

      secciones: {
         gestacion: "Gestación",
         maternidad: "Maternidad",
         todos: "Todos",
         todas: "Todas"
      },

      operaciones: {
         entrada: "Entrada",
         salida: "Salida",
         realizada: "Realizada"
      },

      tarjetas: {
         tareasPendientesMovimientos: "Tareas pendientes de movimientos",
         idAnimal: "ID animal",
         sinCrotal: "Sin crotal",
         corralDestino: "Corral destino",
         corralOrigen: "Corral origen",
         fecha: "Fecha programada",
         fechaRealizado: "Fecha realizada",
      },

      filtros: {
         titulo: "Filtros",
         filtrarPorFecha: "Filtrar por fecha",
         hoy: "Hoy",
         ayer: "Ayer",
         fecha: "Fecha",
         formatoFecha: "DD/MM/AAAA"
      },

      carga: {
         cargandoHistorial: "Cargando historial..."
      },

      vacio: {
         sinResultados: "Sin resultados",
         sinMovimientosConFiltros: "No hay movimientos realizados con esos filtros.",
         sinMovimientosTodavia: "No hay movimientos realizados todavía."
      },

      errores: {
         actualizarServidorTareas: "Debe actualizar el servidor para utilizar la función de tareas de movimientos.",
         noCargarTareas: "No se pudieron cargar las tareas.",
         noCargarHistorialTitulo: "No se pudo cargar el historial",
         noCargarHistorial: "No se pudo cargar el historial de movimientos.",
         historialNoDisponible: "Historial no disponible",
         actualizarServidorHistorial: "Debe actualizar el servidor para utilizar el historial de tareas de movimientos."
      }
   },

   tareasMovimientosDetalle: {
      tabs: {
         gestacion: "Gestación",
         maternidad: "Maternidad"
      },

      acciones: {
         filtros: "Filtros",
         ordenar: "Ordenar",
         marcarRealizado: "Marcar Realizado",
         marcarSeleccionadas: "Marcar ({{total}})",
         marcando: "Marcando...",
         aceptar: "Aceptar",
         cancelar: "Cancelar",
         confirmar: "Confirmar",
         validando: "Validando..."
      },

      orden: {
         corralAscendente: "Corral ascendente",
         corralDescendente: "Corral descendente"
      },

      operaciones: {
         entrada: "Entrada",
         salida: "Salida",
         trasladoEntrada: "Traslado Entrada",
         trasladoSalida: "Traslado Salida"
      },

      tarjetas: {
         idAnimal: "ID animal",
         sinCrotal: "Sin crotal",
         corralDestino: "Corral destino",
         corralOrigen: "Corral origen",
         fecha: "Fecha programada"
      },

      estados: {
         cargandoTareas: "Cargando tareas...",
         noCargarTareasTitulo: "No se pudieron cargar las tareas",
         pulsaReintentar: "Pulsa para reintentar",
         sinTareasConFiltros: "No hay tareas con esos filtros",
         sinTareasPendientes: "No hay tareas pendientes",
         cambiaFiltros: "Prueba cambiando los filtros aplicados.",
         sinMovimientosPendientes: "No se encontraron movimientos pendientes."
      },

      modalResultado: {
         tareasRealizadasTitulo: "Tareas realizadas",
         tareasRealizadasMensaje: "Las tareas seleccionadas se han marcado como realizadas.",
         tareaRealizadaTitulo: "Tarea realizada",
         tareaRealizadaMensaje: "La entrada de maternidad se ha marcado como realizada.",
         errorTitulo: "Error"
      },

      modalCorral: {
         titulo: "Confirmar corral",
         mensaje: "Revisa el corral destino de la entrada en maternidad.",
         labelCorralDestino: "Corral destino",
         placeholderCorral: "Introduce el corral"
      },

      errores: {
         noCargarTareas: "No se pudieron cargar las tareas.",
         entradaMaternidadTitulo: "Entrada de maternidad",
         soloUnaEntradaMaternidad: "Solo puedes marcar una entrada de maternidad a la vez.",
         soloUnaEntradaMaternidadCadaVez: "Solo puedes marcar una entrada de maternidad cada vez.",
         noMarcarTareas: "No se pudieron marcar las tareas como realizadas.",
         corralMaximo9: "Introduce un corral válido de máximo 9 números.",
         corralNoExiste: "El corral no existe.",
         corralOcupado: "El corral está ocupado.",
         noValidarCorral: "No se pudo validar el corral.",
         noValidarCorralMaternidad: "No se pudo validar el corral de maternidad."
      }
   },
   filtrosTareasMovimientos: {
      cabecera: {
         titulo: "Filtros",
         subtituloTareasDe: "Tareas de {{seccion}}",
         limpiar: "Limpiar"
      },

      secciones: {
         gestacion: "Gestación",
         maternidad: "Maternidad"
      },

      bloques: {
         tipoMovimiento: "Tipo de movimiento",
         fecha: "Fecha",
         corral: "Corral",
         idAnimal: "ID animal"
      },

      opciones: {
         todos: "Todos",
         entrada: "Entrada",
         salida: "Salida",
         todasLasFechas: "Todas las fechas",
         hoy: "Hoy",
         manana: "Mañana",
         fecha: "Fecha",
         todosLosCorrales: "Todos los corrales",
         porCorral: "Por corral",
         todosLosAnimales: "Todos los animales",
         porId: "Por ID"
      },

      placeholders: {
         dia: "DD",
         mes: "MM",
         anio: "AA/AAAA",
         introduceCorral: "Introduce el corral",
         introduceIdAnimal: "Introduce el ID animal"
      },

      validaciones: {
         fechaCompleta: "Introduce día, mes y año.",
         diaDosCifras: "El día debe tener 2 cifras.",
         mesDosCifras: "El mes debe tener 2 cifras.",
         anioDosOCuatroCifras: "El año debe tener 2 o 4 cifras.",
         diaRango: "El día debe estar entre 01 y 31.",
         mesRango: "El mes debe estar entre 01 y 12.",
         fechaNoExiste: "La fecha no existe.",
         introduceCorral: "Introduce un número de corral.",
         introduceIdAnimal: "Introduce un ID de animal."
      },

      botones: {
         cancelar: "Cancelar",
         aceptar: "Aceptar"
      }
   },
   filtrosHistorialMovimientos: {
      cabecera: {
         titulo: "Filtros",
         subtitulo: "Historial de movimientos",
         limpiar: "Limpiar"
      },

      bloques: {
         tipoMovimiento: "Tipo de movimiento",
         fecha: "Fecha",
         corral: "Corral",
         idAnimal: "ID animal"
      },

      opciones: {
         todos: "Todos",
         entrada: "Entrada",
         salida: "Salida",
         todasLasFechas: "Todas las fechas",
         hoy: "Hoy",
         manana: "Mañana",
         fecha: "Fecha",
         todosLosCorrales: "Todos los corrales",
         porCorral: "Por corral",
         todosLosAnimales: "Todos los animales",
         porId: "Por ID"
      },

      placeholders: {
         dia: "DD",
         mes: "MM",
         anio: "AA/AAAA",
         introduceCorral: "Introduce el corral",
         introduceIdAnimal: "Introduce el ID animal"
      },

      validaciones: {
         fechaCompleta: "Introduce día, mes y año.",
         diaDosCifras: "El día debe tener 2 cifras.",
         mesDosCifras: "El mes debe tener 2 cifras.",
         anioDosOCuatroCifras: "El año debe tener 2 o 4 cifras.",
         diaRango: "El día debe estar entre 01 y 31.",
         mesRango: "El mes debe estar entre 01 y 12.",
         fechaNoExiste: "La fecha no existe.",
         introduceCorral: "Introduce un número de corral.",
         introduceIdAnimal: "Introduce un ID de animal."
      },

      botones: {
         cancelar: "Cancelar",
         aceptar: "Aceptar"
      }
   },
   modalSalidaPendiente: {
      titulo: "Salida pendiente",
      mensaje: "Este animal tiene una tarea de salida pendiente. ¿Quieres completar primero la salida y después realizar la entrada seleccionada?",
      animal: "Animal",
      botonConfirmar: "Realizar operación",
      trasladoEntradaTitulo: "Traslado de entrada",
      soloUnTrasladoEntrada: "Solo puedes marcar un traslado de entrada cada vez.",
   }

};