# =========================================================================
#  Servidor local del panel de administracion - Compas Outlet
# -------------------------------------------------------------------------
#  Sirve la tienda en http://localhost:8787 y le da al panel la capacidad
#  de escribir de verdad en los archivos:
#
#    POST /api/guardar    graba js/productos.js
#    POST /api/foto       graba una imagen en img/
#    POST /api/publicar   sube los cambios a GitHub (y por lo tanto a Vercel)
#
#  Solo escucha en localhost: nadie de afuera puede entrar.
#  No se ejecuta solo: lo abre administrar.cmd
# =========================================================================

$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$puerto = 8787
$prefijo = "http://localhost:$puerto/"
$git = "C:\Program Files\Git\cmd\git.exe"

$tipos = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".webp" = "image/webp"
  ".gif"  = "image/gif"
  ".svg"  = "image/svg+xml"
  ".txt"  = "text/plain; charset=utf-8"
  ".md"   = "text/plain; charset=utf-8"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefijo)

try {
  $listener.Start()
} catch {
  Write-Output ""
  Write-Output "  ERROR: no pude abrir el puerto $puerto."
  Write-Output "  Puede que ya tengas el panel abierto en otra ventana."
  Write-Output "  Cerra esa ventana y volve a intentar."
  Write-Output ""
  Read-Host "  Enter para salir"
  exit 1
}

Write-Output ""
Write-Output "  =================================================="
Write-Output "   PANEL DE COMPAS OUTLET"
Write-Output "  =================================================="
Write-Output ""
Write-Output "   Abierto en: ${prefijo}admin.html"
Write-Output ""
Write-Output "   NO CIERRES ESTA VENTANA mientras uses el panel."
Write-Output "   Para terminar: cerra esta ventana."
Write-Output ""

# --- utilidades -----------------------------------------------------------

function Responder($ctx, $codigo, $tipo, $texto) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($texto)
  $ctx.Response.StatusCode = $codigo
  $ctx.Response.ContentType = $tipo
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function ResponderJson($ctx, $codigo, $objeto) {
  Responder $ctx $codigo "application/json; charset=utf-8" ($objeto | ConvertTo-Json -Compress -Depth 6)
}

function LeerCuerpo($ctx) {
  $lector = New-Object System.IO.StreamReader($ctx.Request.InputStream, [System.Text.Encoding]::UTF8)
  $texto = $lector.ReadToEnd()
  $lector.Close()
  return $texto
}

# Deja solo un nombre de archivo seguro: sin rutas, sin caracteres raros.
function NombreSeguro($nombre) {
  $limpio = [System.IO.Path]::GetFileName($nombre)
  $limpio = $limpio -replace '[^A-Za-z0-9._-]', '-'
  $limpio = $limpio -replace '-+', '-'
  if ([string]::IsNullOrWhiteSpace($limpio)) { $limpio = "foto.jpg" }
  return $limpio
}

# --- bucle principal ------------------------------------------------------

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $ruta = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    $metodo = $ctx.Request.HttpMethod

    # ---------- API ----------

    if ($ruta -eq "/api/estado") {
      ResponderJson $ctx 200 @{ ok = $true; modo = "servidor"; carpeta = $raiz }
      $ctx.Response.Close()
      continue
    }

    if ($ruta -eq "/api/guardar" -and $metodo -eq "POST") {
      $cuerpo = LeerCuerpo $ctx
      $datos = $cuerpo | ConvertFrom-Json
      $destino = Join-Path $raiz "js\productos.js"

      # Copia de seguridad del catalogo anterior
      if (Test-Path $destino) {
        Copy-Item $destino (Join-Path $raiz "js\productos-anterior.js") -Force
      }

      $sinBom = New-Object System.Text.UTF8Encoding($false)
      [System.IO.File]::WriteAllText($destino, $datos.contenido, $sinBom)

      Write-Output ("  [guardado] js\productos.js  ({0} articulos)" -f $datos.cantidad)
      ResponderJson $ctx 200 @{ ok = $true; mensaje = "Catalogo guardado" }
      $ctx.Response.Close()
      continue
    }

    if ($ruta -eq "/api/foto" -and $metodo -eq "POST") {
      $cuerpo = LeerCuerpo $ctx
      $datos = $cuerpo | ConvertFrom-Json
      $nombre = NombreSeguro $datos.nombre
      $carpetaImg = Join-Path $raiz "img"
      if (-not (Test-Path $carpetaImg)) { New-Item -ItemType Directory -Path $carpetaImg | Out-Null }
      $destino = Join-Path $carpetaImg $nombre
      $bytes = [Convert]::FromBase64String($datos.base64)
      [System.IO.File]::WriteAllBytes($destino, $bytes)

      Write-Output ("  [foto] img\{0}  ({1} KB)" -f $nombre, [int]($bytes.Length / 1024))
      ResponderJson $ctx 200 @{ ok = $true; ruta = ("img/" + $nombre) }
      $ctx.Response.Close()
      continue
    }

    if ($ruta -eq "/api/publicar" -and $metodo -eq "POST") {
      if (-not (Test-Path $git)) {
        ResponderJson $ctx 200 @{ ok = $false; mensaje = "No encuentro Git en $git" }
        $ctx.Response.Close()
        continue
      }

      Write-Output "  [publicando] subiendo cambios a GitHub..."
      Push-Location $raiz
      $salida = ""
      $salida += (& $git add -A 2>&1 | Out-String)
      $hayCambios = (& $git status --porcelain 2>&1 | Out-String).Trim()

      if ([string]::IsNullOrWhiteSpace($hayCambios)) {
        Pop-Location
        Write-Output "  [publicando] no habia cambios nuevos"
        ResponderJson $ctx 200 @{ ok = $true; mensaje = "No habia cambios nuevos que publicar."; sinCambios = $true }
        $ctx.Response.Close()
        continue
      }

      $fecha = Get-Date -Format "yyyy-MM-dd HH:mm"
      $salida += (& $git commit -m "Actualizacion del catalogo - $fecha" 2>&1 | Out-String)
      $salida += (& $git push 2>&1 | Out-String)
      $codigo = $LASTEXITCODE
      Pop-Location

      if ($codigo -eq 0) {
        Write-Output "  [publicando] listo"
        ResponderJson $ctx 200 @{ ok = $true; mensaje = "Publicado. En menos de un minuto se ve en compas-outlet.vercel.app"; detalle = $salida }
      } else {
        Write-Output "  [publicando] FALLO"
        ResponderJson $ctx 200 @{ ok = $false; mensaje = "No se pudo subir a GitHub."; detalle = $salida }
      }
      $ctx.Response.Close()
      continue
    }

    # ---------- archivos estaticos ----------

    $rel = $ruta.TrimStart('/')
    if ($rel -eq "") { $rel = "admin.html" }

    # Nunca salir de la carpeta del proyecto
    $completa = [System.IO.Path]::GetFullPath((Join-Path $raiz $rel))
    if (-not $completa.StartsWith([System.IO.Path]::GetFullPath($raiz))) {
      Responder $ctx 403 "text/plain; charset=utf-8" "Acceso denegado"
      $ctx.Response.Close()
      continue
    }

    if (Test-Path $completa -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($completa).ToLower()
      $ct = $tipos[$ext]
      if (-not $ct) { $ct = "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($completa)
      $ctx.Response.ContentType = $ct
      $ctx.Response.Headers.Add("Cache-Control", "no-store")
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      Responder $ctx 404 "text/plain; charset=utf-8" "No encontrado: $rel"
    }

    $ctx.Response.Close()

  } catch {
    Write-Output ("  error: " + $_.Exception.Message)
    try { $ctx.Response.Close() } catch { }
  }
}
