=====================================================================
  EJERCICIO 1 - PRUEBA DE CARGA: LOGIN FakeStore API
  Herramienta: K6
=====================================================================

VERSIONES DE TECNOLOGÍAS
─────────────────────────
  - K6              : v0.55.0  (https://github.com/grafana/k6/releases)
  - Sistema Operativo: Windows 10/11, Linux Ubuntu 20.04+ o macOS 12+
  - Para el sistema operativo Windows, utilizar WSL (windows subsistem for linux)
    para la creación del reporte HTML

ESTRUCTURA DEL PROYECTO
────────────────────────
  ejercicio1/
  ├── data/
  │   └── usuarios.csv          ← Credenciales parametrizadas
  ├── reports/                  ← Carpeta donde se generan los reportes (JSON)
  │   └── symmaru_*.json        ← resultados en formato json
  ├── scripts/
  │   ├── html-report.html      ← Reporte en formato HTML para su visualiación
  │   └── login_load_test.js    ← Script principal K6
  ├── conclusiones.txt          ← Hallazgos y conclusiones
  └── readme.txt                ← Este archivo

PASO A PASO DE EJECUCIÓN
─────────────────────────

PASO 1 — Instalar K6
  Windows:
    winget install k6 --source winget

  Linux (Debian/Ubuntu):
    sudo gpg -k
    sudo gpg --no-default-keyring \
      --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
      --keyserver hkp://keyserver.ubuntu.com:80 \
      --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
    echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] \
      https://dl.k6.io/deb stable main" \
      | sudo tee /etc/apt/sources.list.d/k6.list
    sudo apt-get update && sudo apt-get install k6

PASO 2 — Verificar instalación
  k6 version
  → Debe mostrar: k6 v0.55.x (o superior)

PASO 3 — Clonar o descargar el repositorio
  git clone https://github.com/GabrielGNP/K6-Reto_de_Calidad
  cd '.\K6-Reto_de_Calidad\Ejercicio 1\scripts\'

PASO 4 — Verificar que el archivo CSV existe
  La ruta relativa usada en el script es: ../data/usuarios.csv
  El script debe ejecutarse SIEMPRE desde la carpeta "scripts/".
  Si no es así, entonces tendrá conflictos con la capacidad de lectura del CSV

PASO 5 — Ejecutar la prueba de carga
  cd scripts
  k6 run login_load_test.js

  Para generar el reporte HTML, ejecutar en wsl:
  K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=html-report.html k6 run login_load_test.js 

NOTAS IMPORTANTES
──────────────────
  - Si la API retorna 401 para algún usuario, es comportamiento esperado
    de la API con credenciales no registradas; el script lo registra como error.

=====================================================================
